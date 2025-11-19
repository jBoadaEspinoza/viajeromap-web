import { apiClient } from './apiClient';

// Interfaces para las respuestas de autenticación
export interface LoginRequest {
  username: string;
  password: string;
  lang: string;
}



export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  tokenType?: string;
  tokenExpirationMessage?: string;
  tokenExpirationInSeg?: string;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  name: string;
  logoUrl: string;
  address: string;
  latitude: number;
  longitude: number;
  linkReviewGoogleMap: string;
  whatsappNumber: string;
  isActive: boolean;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface TokenInfoResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    company: Company;
    role: Role;
    lang: string;
    currency: string | null;
  };
  errorCode?: string;
}

export interface TokenInfoTravelerByGoogleResponse{
  success: boolean;
  message: string;
  data?: {
      uid: string;
      personId?: number;
      tokenType: 'FIREBASE';
      username: string;
      nickname: string;
      profileImageUrl: string;
      firstname: string;
      surname: string | null;
      roleId: number;
      roleCode: 'TRAVELER' | 'ADMIN' | 'PROVIDER' | string;
      email: string;
      expiration: number;
      phoneNumber: string;
      phonePostalCode: string;
      phonePostalId: number;
      phoneCodeId?: number; // ID del código telefónico
      countryBirthCode2: string;
      issuedAt: number;
  };
  token?: string;
  errorCode?: string;
}

// Interfaces para login con SMS
export interface SendSmsCodeRequest {
  phone: string;
  phoneCode: string;
  lang: string;
}

export interface UpdateTravelerContactInfoRequest {
  firstName?: string;          // Máx. 100 caracteres. Solo letras, espacios, guiones y apóstrofes
  lastName?: string;           // Máx. 100 caracteres. Solo letras, espacios, guiones y apóstrofes
  email?: string;              // Formato de email válido
  phonePostalId?: number;      // ID positivo del código telefónico (ej. 51 para Perú)
  phoneCodeId?: number;        // ID del código telefónico
  phoneNumber?: string;        // Máx. 20 caracteres. Puede incluir +, espacios, guiones, paréntesis
  countryBirthCode2?: string;  // ID positivo del país de nacimiento
  documentTypeId?: number | null; // ID positivo del tipo de documento
  documentNumber?: string | null; // Máx. 50 caracteres. Letras, dígitos y guiones
}

export interface SendSmsCodeResponse {
  success: boolean;
  message: string;
  sessionId?: string;
}

export interface VerifySmsCodeRequest {
  sessionId: string;
  code: string;
  email: string;
  lang: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface UpdateTravelerContactInfoResponse {
  personId: number;
  uid: string;
}

export interface VerifySmsCodeResponse extends LoginResponse {}

// Funciones de autenticación
export const authApi = {
  // Login tradicional
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error en el inicio de sesión'
      };
    }
  },

  // Validar token
  validateToken: async (lang: string = 'es'): Promise<TokenInfoResponse> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No hay token almacenado',
          errorCode: 'NO_TOKEN'
        };
      }

      const response = await apiClient.get(`/auth/token/info?lang=${lang}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      // Si el token expiró, limpiarlo del localStorage
      if (error.response?.data?.errorCode === 'TOKEN_EXPIRED') {
        localStorage.removeItem('authToken');
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error validando token',
        errorCode: error.response?.data?.errorCode
      };
    }
  },

  // Get info by token firebase
  getInfoByTokenTravelerByGoogle: async (token: string): Promise<TokenInfoTravelerByGoogleResponse> => {
    try {
      const response = await apiClient.get(`/auth/token/info/traveler/byGoogle`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Verificar si el backend devuelve un token en los headers o en el body
      const responseData = response.data || {};
      const tokenFromHeader = response.headers?.['authorization']?.replace('Bearer ', '') || 
                              response.headers?.['Authorization']?.replace('Bearer ', '');
      
      return {
        ...responseData,
        token: responseData.token || tokenFromHeader || token // Usar token del backend, header o Firebase token como fallback
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error validando token',
        errorCode: error.response?.data?.errorCode
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
  },

  // Verificar si hay token válido
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Obtener token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Guardar token
  saveToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  // Guardar información del usuario
  saveUserInfo: (userInfo: any) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },

  // Obtener información del usuario
  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  },

  // Update traveler contact info
  updateTravelerContactInfo: async (request: UpdateTravelerContactInfoRequest): Promise<UpdateTravelerContactInfoResponse> => {
    try {
      const response = await apiClient.post('/auth/traveler/contact-info', request);
      // El formato de respuesta es: { success: boolean, message: string, data: { personId: number, uid: string } }
      if (response.data && response.data.success && response.data.data) {
        return response.data.data as UpdateTravelerContactInfoResponse;
      }
      // Si hay un error en la respuesta
      if (response.data && response.data.success === false) {
        throw new Error(response.data.message || 'Error updating traveler contact info');
      }
      // Si no se puede determinar la estructura, lanzar error
      throw new Error('Respuesta inesperada del servidor');
    } catch (error: any) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error.response?.data?.message || 'Error updating traveler contact info');
    }
  }
}; 