import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { auth as firebaseAuth } from '../config/firebase';
import { onAuthStateChanged, onIdTokenChanged, User as FirebaseUser } from 'firebase/auth';
import { authApi } from '../api/auth';
import type { LoginRequest } from '../api/auth';
import { saveAuthToken, removeAuthToken, getAuthToken } from '../utils/cookieHelper';

// Interfaz para los datos del usuario desde el backend
interface UserData {
  uid: string;
  email: string;
  username?: string;
  nickname?: string;
  firstname?: string;
  surname?: string | null;
  roleId?: number;
  roleCode?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  phonePostalCode?: string;
  phonePostalId?: number;
  phoneCodeId?: number;
  countryBirthCode2?: string;
}

interface AuthContextType {
  // Estados principales
  user: UserData | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  
  // Funciones
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  
  // Ref para evitar llamadas duplicadas al backend
  const isLoadingUserData = useRef(false);
  const lastTokenFetch = useRef<number>(0);

  /**
   * Carga los datos del usuario desde el backend (solo una vez por sesión)
   */
  const loadUserDataFromBackend = async (firebaseUser: FirebaseUser): Promise<void> => {
    // Evitar llamadas duplicadas
    if (isLoadingUserData.current) {
      console.log('⏳ Ya se está cargando la información del usuario...');
      return;
    }

    // Evitar llamadas muy frecuentes (máximo una cada 30 segundos)
    const now = Date.now();
    if (now - lastTokenFetch.current < 30000) {
      console.log('⏳ Esperando antes de revalidar token...');
      return;
    }

    try {
      isLoadingUserData.current = true;
      lastTokenFetch.current = now;
      
      console.log('🔄 Obteniendo datos del usuario desde backend...');
      
      // Obtener token de Firebase
      const idToken = await firebaseUser.getIdToken();
      
      // Llamar al backend para obtener información del usuario
      const response = await authApi.getInfoByTokenTravelerByGoogle(idToken);
      
      if (response.success && response.data) {
        console.log('✅ Datos del usuario obtenidos del backend');
        
        // Guardar token en cookie/localStorage (si hay consentimiento)
        if (response.token) {
          saveAuthToken(response.token);
        } else {
          // Usar el idToken de Firebase como fallback
          saveAuthToken(idToken);
        }
        
        // Actualizar estado del usuario
        const userData: UserData = {
          uid: response.data.uid,
          email: response.data.email,
          username: response.data.username,
          nickname: response.data.nickname,
          firstname: response.data.firstname,
          surname: response.data.surname,
          roleId: response.data.roleId,
          roleCode: response.data.roleCode,
          profileImageUrl: response.data.profileImageUrl,
          phoneNumber: response.data.phoneNumber,
          phonePostalCode: response.data.phonePostalCode,
          phonePostalId: response.data.phonePostalId,
          phoneCodeId: response.data.phoneCodeId,
          countryBirthCode2: response.data.countryBirthCode2
        };
        
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.error('❌ Error al obtener datos del backend:', response.message);
        // Si falla el backend, limpiar sesión
        await logout();
      }
    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error);
      // Si hay error, limpiar sesión
      await logout();
    } finally {
      isLoadingUserData.current = false;
    }
  };

  /**
   * Refresca los datos del usuario desde el backend
   */
  const refreshUserData = async (): Promise<void> => {
    if (firebaseUser) {
      // Forzar recarga ignorando el límite de tiempo
      lastTokenFetch.current = 0;
      await loadUserDataFromBackend(firebaseUser);
    }
  };

  /**
   * Escuchar cambios de autenticación de Firebase
   * Se ejecuta cuando el usuario inicia/cierra sesión
   */
  useEffect(() => {
    console.log('🔄 Configurando listener de onAuthStateChanged...');
    
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      console.log('🔔 onAuthStateChanged:', firebaseUser ? 'Usuario conectado' : 'Usuario desconectado');
      
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Usuario autenticado con Firebase
        // Solo cargar datos del backend si no los tenemos aún
        if (!user) {
          await loadUserDataFromBackend(firebaseUser);
        }
      } else {
        // Usuario no autenticado
        setUser(null);
        setIsAuthenticated(false);
        removeAuthToken();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Escuchar cambios en el token de Firebase
   * Se ejecuta cuando Firebase renueva automáticamente el token
   */
  useEffect(() => {
    console.log('🔄 Configurando listener de onIdTokenChanged...');
    
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔔 onIdTokenChanged: Token renovado automáticamente por Firebase');
        
        // Obtener el nuevo token y guardarlo
        const newToken = await firebaseUser.getIdToken();
        saveAuthToken(newToken);
        
        console.log('✅ Token renovado y guardado');
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Login con Google
   */
  const loginWithGoogle = async (): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('🚀 Iniciando login con Google...');
      
      const { signInWithPopup } = await import('firebase/auth');
      const { googleProvider } = await import('../config/firebase');
      
      // Autenticar con Google
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      console.log('✅ Autenticación con Google exitosa');
      
      // Obtener token de Firebase
      const idToken = await user.getIdToken();
      
      // Enviar token al backend (solo una vez)
      const response = await authApi.getInfoByTokenTravelerByGoogle(idToken);
      
      if (response.success && response.data) {
        console.log('✅ Datos del usuario obtenidos del backend');
        
        // Guardar token en cookie/localStorage (si hay consentimiento)
        if (response.token) {
          saveAuthToken(response.token);
        } else {
          saveAuthToken(idToken);
        }
        
        // Actualizar estado del usuario
        const userData: UserData = {
          uid: response.data.uid,
          email: response.data.email,
          username: response.data.username,
          nickname: response.data.nickname,
          firstname: response.data.firstname,
          surname: response.data.surname,
          roleId: response.data.roleId,
          roleCode: response.data.roleCode,
          profileImageUrl: response.data.profileImageUrl,
          phoneNumber: response.data.phoneNumber,
          phonePostalCode: response.data.phonePostalCode,
          phonePostalId: response.data.phonePostalId,
          phoneCodeId: response.data.phoneCodeId,
          countryBirthCode2: response.data.countryBirthCode2
        };
        
        setUser(userData);
        setFirebaseUser(user);
        setIsAuthenticated(true);
        
        return true;
      } else {
        console.error('❌ Error al obtener datos del backend:', response.message);
        // Si falla, cerrar sesión de Firebase también
        await firebaseAuth.signOut();
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error en login con Google:', error);
        return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login con email (extranet)
   */
  const loginWithEmail = async (credentials: LoginRequest): Promise<boolean> => {
    setLoading(true);
    
    try {
      console.log('🚀 Iniciando login con email...');
      
      const response = await authApi.login(credentials);
      
      if (response.success && response.token) {
        console.log('✅ Login con email exitoso');
        
        // Guardar token
        saveAuthToken(response.token);
        
        // Validar token para obtener información del usuario
        const validationResponse = await authApi.validateToken('es');
        
        if (validationResponse.success && validationResponse.data) {
          // Este es el flujo de extranet, diferente al de Google
          // Aquí usarías los datos de validationResponse.data.user
          setIsAuthenticated(true);
          return true;
        } else {
          removeAuthToken();
          return false;
        }
      } else {
        console.error('❌ Error en login:', response.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Error en login con email:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout completo
   */
  const logout = async (): Promise<void> => {
    try {
      console.log('🚪 Cerrando sesión...');
      
      // Cerrar sesión de Firebase
      await firebaseAuth.signOut();
      
      // Limpiar tokens y datos
      removeAuthToken();
      localStorage.removeItem('userInfo');
      
      // Limpiar estados
      setUser(null);
      setFirebaseUser(null);
      setIsAuthenticated(false);
      
      // Llamar al API de logout
      await authApi.logout();
      
      console.log('✅ Sesión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  /**
   * Escuchar evento de token expirado desde interceptor
   */
  useEffect(() => {
    const handleTokenExpired = async () => {
      console.log('⚠️ Token expirado detectado por interceptor');
      setShowTokenExpiredModal(true);
      await logout();
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => window.removeEventListener('tokenExpired', handleTokenExpired);
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated,
    loading,
    loginWithGoogle,
    loginWithEmail,
    logout,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Modal de token expirado */}
      {showTokenExpiredModal && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header border-0">
                <h5 className="modal-title d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                  {(() => {
                    const lang = typeof window !== 'undefined' ? localStorage.getItem('language') || 'es' : 'es';
                    return lang === 'en' ? 'Session Expired' : 'Sesión expirada';
                  })()}
                </h5>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  {(() => {
                    const lang = typeof window !== 'undefined' ? localStorage.getItem('language') || 'es' : 'es';
                    return lang === 'en' 
                      ? 'Your session has expired. Please log in again to continue.'
                      : 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.';
                  })()}
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setShowTokenExpiredModal(false);
                    if (typeof window !== 'undefined') {
                      if (window.location.pathname.startsWith('/extranet')) {
                        window.location.href = '/extranet/login';
                      } else {
                        // Para usuarios normales, recargar la página
                        window.location.reload();
                      }
                    }
                  }}
                >
                  {(() => {
                    const lang = typeof window !== 'undefined' ? localStorage.getItem('language') || 'es' : 'es';
                    return lang === 'en' ? 'Log in' : 'Iniciar sesión';
                  })()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
