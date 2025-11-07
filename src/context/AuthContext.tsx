import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { LoginRequest, User, Company, Role, TokenInfoResponse } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  company: Company | null;
  role: Role | null;
  isInitialized: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  validateToken: (lang?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  
  // Función para navegar que se puede usar después de la inicialización
  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/extranet/login';
    }
  };

  // Función para limpiar estado y mostrar modal de token expirado
  const handleTokenExpired = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCompany(null);
    setRole(null);
    setShowTokenExpiredModal(true);
  };

  // Validar token
  const validateToken = async (lang: string = 'es'): Promise<boolean> => {
    // Evitar validaciones simultáneas
    if (isValidating) {
      return isAuthenticated;
    }

    try {
      setIsValidating(true);
      const response: TokenInfoResponse = await authApi.validateToken(lang);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setCompany(response.data.company);
        setRole(response.data.role);
        setIsAuthenticated(true);
        
        // Guardar información del usuario en localStorage
        authApi.saveUserInfo(response.data);
        return true;
      } else {
        // Token inválido - limpiar estado y mostrar modal
        if (response.errorCode === 'TOKEN_EXPIRED' || response.errorCode === 'NO_TOKEN') {
          handleTokenExpired();
        } else {
          authApi.logout();
          setIsAuthenticated(false);
          setUser(null);
          setCompany(null);
          setRole(null);
        }
        return false;
      }
    } catch (error: any) {
      // Distinguir entre errores de red y errores de token
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Token expirado o inválido
        handleTokenExpired();
        return false;
      } else {
        // Error de red - mantener estado actual solo si ya estaba autenticado
        // Si no estaba autenticado y hay token, intentar validar
        if (!isAuthenticated && localStorage.getItem('authToken')) {
          // No hacer nada, dejar que la verificación periódica lo maneje
        }
        return isAuthenticated;
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Login
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login(credentials);
      
      if (response.success && response.token) {
        // Guardar token
        authApi.saveToken(response.token);
        
        // Validar token para obtener información del usuario
        const isValid = await validateToken('es');
        if (isValid) {
          return true;
        } else {
          setError('Error al obtener información del usuario');
          return false;
        }
      } else {
        setError(response.message || 'Error en el inicio de sesión');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Error en el inicio de sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCompany(null);
    setRole(null);
    setError(null);
    navigateToLogin();
  };

  // Verificar token inicial al cargar la aplicación
  const verifyInitialToken = async (): Promise<void> => {
    try {
      // Solo validar si hay token en localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsInitialized(true);
        return;
      }

      const isValid = await validateToken('es');
      
      if (!isValid) {
        // Si no hay token válido y estamos en una ruta protegida, redirigir al login
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/extranet') && currentPath !== '/extranet/login') {
          navigateToLogin();
        }
      }
    } catch (error: any) {
      setIsAuthenticated(false);
    } finally {
      setIsInitialized(true);
    }
  };

  // Verificar token al inicializar la aplicación
  useEffect(() => {
    verifyInitialToken();
  }, []);

  // Escuchar evento de token expirado desde interceptor de API
  useEffect(() => {
    const handleTokenExpiredEvent = () => {
      if (isAuthenticated) {
        handleTokenExpired();
      }
    };

    window.addEventListener('tokenExpired', handleTokenExpiredEvent);
    return () => window.removeEventListener('tokenExpired', handleTokenExpiredEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Verificación periódica del token (cada 5 minutos)
  useEffect(() => {
    // Solo verificar si hay token
    const token = localStorage.getItem('authToken');
    if (!token) {
      return;
    }

    // Verificar inmediatamente si hay token pero no está autenticado
    if (token && !isAuthenticated && isInitialized) {
      validateToken('es').catch(() => {
        // Error manejado en validateToken
      });
    }

    // Configurar verificación periódica cada 5 minutos
    const interval = setInterval(async () => {
      const currentToken = localStorage.getItem('authToken');
      if (currentToken && isInitialized) {
        // Verificar token periódicamente
        try {
          const isValid = await validateToken('es');
          if (!isValid) {
            // El handleTokenExpired ya se ejecutó en validateToken
            clearInterval(interval);
          }
        } catch (error) {
          // Error manejado en validateToken
          clearInterval(interval);
        }
      } else if (!currentToken && isAuthenticated) {
        // Si no hay token pero está marcado como autenticado, limpiar estado
        handleTokenExpired();
        clearInterval(interval);
      }
    }, 5 * 60 * 1000); // 5 minutos

    // Limpiar intervalo al desmontar
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isInitialized]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    company,
    role,
    isInitialized,
    login,
    logout,
    validateToken,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Modal de token expirado */}
      {showTokenExpiredModal && (
        <div 
          className="modal show d-block" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
          onClick={(e) => {
            // No cerrar al hacer clic fuera del modal
            e.stopPropagation();
          }}
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
                        // Para usuarios normales, recargar la página para que puedan iniciar sesión
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