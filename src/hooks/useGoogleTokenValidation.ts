import { useEffect, useState, useRef, useCallback } from 'react';
import { auth } from '../config/firebase';
import { authApi } from '../api/auth';
import { useLanguage } from '../context/LanguageContext';

/**
 * Hook para validar el token de Google/Firebase en páginas específicas
 * Verifica si el usuario está autenticado con Google y valida el token periódicamente
 */
export const useGoogleTokenValidation = () => {
  const { language } = useLanguage();
  const [isValidating, setIsValidating] = useState(false);
  const isValidatingRef = useRef<boolean>(false);
  const lastValidationTimeRef = useRef<number>(0);

  // Función para verificar si el token es de Google/Firebase
  const isGoogleToken = useCallback((): boolean => {
    // Verificar si hay un usuario actual de Firebase autenticado
    const currentUser = auth.currentUser;
    if (currentUser) {
      return true;
    }

    // Si no hay usuario actual, verificar si podemos obtener un token de Firebase
    // Esto indica que el token guardado podría ser de Firebase
    // Por ahora, solo verificamos si hay un usuario actual
    return false;
  }, []);

  // Función para validar token de Google
  const validateGoogleToken = useCallback(async (): Promise<boolean> => {
    if (isValidatingRef.current) {
      return false;
    }

    try {
      isValidatingRef.current = true;
      setIsValidating(true);

      // Verificar si hay token
      const token = localStorage.getItem('authToken');
      if (!token) {
        return false;
      }

      // Verificar si es token de Google
      if (!isGoogleToken()) {
        return false;
      }

      // Obtener token de Firebase si está disponible
      let firebaseToken = token;
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          firebaseToken = await currentUser.getIdToken();
        } catch {
          // Si no se puede obtener token de Firebase, usar el token guardado
        }
      }

      // Validar token con el backend
      const response = await authApi.getInfoByTokenTravelerByGoogle(firebaseToken);

      if (response.success && response.data) {
        // Guardar token si el backend devuelve uno nuevo
        if (response.token) {
          authApi.saveToken(response.token);
        }

        lastValidationTimeRef.current = Date.now();
        return true;
      } else {
        // Token inválido - limpiar datos
        if (response.errorCode === 'TOKEN_EXPIRED' || response.errorCode === 'NO_TOKEN') {
          // Limpiar token
          localStorage.removeItem('authToken');
          localStorage.removeItem('userInfo');
          authApi.logout();

          // Cerrar sesión de Firebase
          try {
            await auth.signOut();
          } catch {
            // Error al cerrar sesión
          }
        }
        return false;
      }
    } catch (error: any) {
      // Si es error 401 o 403, limpiar token
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        authApi.logout();

        try {
          await auth.signOut();
        } catch {
          // Error al cerrar sesión
        }
      }
      return false;
    } finally {
      isValidatingRef.current = false;
      setIsValidating(false);
    }
  }, [isGoogleToken]);

  // Validar al montar el componente y periódicamente
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const checkAndValidate = async () => {
      // Verificar si hay token de Google
      if (isGoogleToken()) {
        const token = localStorage.getItem('authToken');
        if (token) {
          const now = Date.now();
          const timeSinceLastValidation = now - lastValidationTimeRef.current;
          
          // Validar si han pasado más de 5 minutos o es la primera vez
          if (lastValidationTimeRef.current === 0 || timeSinceLastValidation > 5 * 60 * 1000) {
            await validateGoogleToken();
          }
        }
      }
    };

    // Validar inmediatamente
    checkAndValidate();

    // Configurar validación periódica cada 5 minutos
    intervalId = setInterval(() => {
      checkAndValidate();
    }, 5 * 60 * 1000); // 5 minutos

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isGoogleToken, validateGoogleToken]);

  return {
    isValidating,
    validateGoogleToken,
    isGoogleToken: isGoogleToken()
  };
};

