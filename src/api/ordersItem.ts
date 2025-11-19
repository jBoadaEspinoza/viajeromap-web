import { apiClient } from './apiClient';
import {auth} from '../config/firebase';
import { getAuthToken } from '../utils/cookieHelper';

export interface ApiResponse {
    success: boolean;
    message: string;
    idCreated?: string | number | null;
}


export interface Supplier {
  name: string;
  isVerified: boolean;
}

export interface Activity {
  id: string;
  title: string;
  rating: number;
  numComments: number;
  totalBookings: number;
  lastReviewDate: string; // ISO date
  imageUrl: string;
  supplier: Supplier;
}

export interface AddOrderItemRequest {
    activityId: string;
    bookingOptionId: string;
    currency: "USD" | "PEN";
    adults: number;
    children: number;
    pricePerParticipant: number;
    startDatetime: string; // formato ISO: YYYY-MM-DDTHH:mm:ss
    specialRequest?: string | null;
    meetingPickupPlaceId?: number | null;
    meetingPickupPointName?: string | null;
    meetingPickupPointAddress?: string | null;
    meetingPickupPointLatitude?: number | null;
    meetingPickupPointLongitude?: number | null;
    guideLanguage?: string | null;
    status: "PENDING" | "ATTENDED" | "CANCELLED";
}
  

export const ordersItemApi = {
    addOrderItem: async (request: AddOrderItemRequest): Promise<ApiResponse> => {
        try {
            let firebaseToken: string | null = null;
    
            // Intentar obtener el token actual de Firebase
            if (auth.currentUser) {
              try {
                firebaseToken = await auth.currentUser.getIdToken();
              } catch (error) {
                console.error('Orders API: Error al obtener el token de Firebase:', error);
              }
            }
    
            // Fallback al token almacenado (si existe)
            if (!firebaseToken) {
              firebaseToken = getAuthToken();
            }
    
            const config = firebaseToken
              ? {
                  headers: {
                    Authorization: `Bearer ${firebaseToken}`
                  }
                }
              : undefined;
    
            console.log('📝 Orders API -> createOrder request:', request);
            console.log('🔐 Orders API -> token utilizado:', firebaseToken ? `${firebaseToken.substring(0, 8)}...` : 'No disponible');
    
            const response = await apiClient.post<ApiResponse>('/order-items', request, config);
    
            if (response?.data) {
              return response.data;
            }
    
            throw new Error('Respuesta inesperada al crear la orden');
          } catch (error: any) {
            console.error('Orders API: Error al crear la orden:', error);
            if (error?.response?.data) {
              throw error.response.data;
            }
            throw error instanceof Error ? error : new Error('Error desconocido al crear la orden');
          }
    },
    removeItem: async (orderItemId: number): Promise<ApiResponse> => {
        try {
            let firebaseToken: string | null = null;
    
            // Intentar obtener el token actual de Firebase
            if (auth.currentUser) {
              try {
                firebaseToken = await auth.currentUser.getIdToken();
              } catch (error) {
                console.error('Orders Item API: Error al obtener el token de Firebase:', error);
              }
            }
    
            // Fallback al token almacenado (si existe)
            if (!firebaseToken) {
              firebaseToken = getAuthToken();
            }
    
            const config = firebaseToken
              ? {
                  headers: {
                    Authorization: `Bearer ${firebaseToken}`
                  }
                }
              : undefined;
    
            console.log('🗑️ Orders Item API -> removeItem request:', orderItemId);
            console.log('🔐 Orders Item API -> token utilizado:', firebaseToken ? `${firebaseToken.substring(0, 8)}...` : 'No disponible');
    
            const response = await apiClient.post<ApiResponse>(`/order-items/${orderItemId}/remove`, {}, config);
    
            if (response?.data) {
              return response.data;
            }
    
            throw new Error('Respuesta inesperada al eliminar el item');
          } catch (error: any) {
            console.error('Orders Item API: Error al eliminar el item:', error);
            if (error?.response?.data) {
              throw error.response.data;
            }
            throw error instanceof Error ? error : new Error('Error desconocido al eliminar el item');
          }
    }
}