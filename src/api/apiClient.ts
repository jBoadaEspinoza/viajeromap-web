import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '../config/appConfig';
import { auth } from '../config/firebase';
import { getAuthToken, removeAuthToken } from '../utils/cookieHelper';

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.api.baseUrl + '/v1',
  timeout: appConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de request:
 * Obtiene automáticamente el token vigente de Firebase o del almacenamiento
 * antes de cada request protegida
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // No agregar token a peticiones de login
      if (config.url?.includes('/auth/login') || config.url?.includes('/auth/token/info')) {
        return config;
      }

      // Intentar obtener token vigente de Firebase primero
      if (auth.currentUser) {
        try {
          // Firebase automáticamente renueva el token si expiró
          const idToken = await auth.currentUser.getIdToken();
          if (idToken && config.headers) {
            config.headers.Authorization = `Bearer ${idToken}`;
            console.log('🔑 Token de Firebase agregado automáticamente al request');
          }
        } catch (error) {
          console.warn('⚠️ Error al obtener token de Firebase, usando fallback:', error);
          
          // Fallback a token almacenado
          const storedToken = getAuthToken();
          if (storedToken && config.headers) {
            config.headers.Authorization = `Bearer ${storedToken}`;
          }
        }
      } else {
        // Si no hay usuario de Firebase, usar token almacenado
        const storedToken = getAuthToken();
        if (storedToken && config.headers) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
      }
    } catch (error) {
      console.error('❌ Error en interceptor de request:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response:
 * Maneja errores de autenticación (401, token expirado)
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró y no es una petición de login
    if (error.response?.status === 401 && 
        (error.response?.data?.errorCode === 'TOKEN_EXPIRED' || 
         error.response?.data?.errorCode === 'NO_TOKEN' ||
         error.response?.data?.errorCode === 'INVALID_TOKEN') &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login')) {
      
      originalRequest._retry = true;
      
      console.log('❌ Token expirado o inválido detectado (401)');
      
      // Limpiar tokens y datos
      removeAuthToken();
      localStorage.removeItem('userInfo');
      
      // Emitir evento personalizado para que AuthContext lo maneje
      window.dispatchEvent(new CustomEvent('tokenExpired'));
      
      // Si es extranet, redirigir directamente
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/extranet')) {
        window.location.href = '/extranet/login';
      }
      
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export { apiClient }; 