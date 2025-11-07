import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '../config/appConfig';

// Crear instancia de axios
  const apiClient: AxiosInstance = axios.create({
    baseURL: appConfig.api.baseUrl + '/v1',
  timeout: appConfig.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores de token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró y no es una petición de login
    if (error.response?.status === 401 && 
        (error.response?.data?.errorCode === 'TOKEN_EXPIRED' || error.response?.data?.errorCode === 'NO_TOKEN') &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login')) {
      
      originalRequest._retry = true;
      
      // Limpiar token expirado
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('firebaseUser');
      
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