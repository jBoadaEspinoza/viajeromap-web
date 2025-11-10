import { apiClient } from './apiClient';
import { auth } from '../config/firebase';
import { getAuthToken } from '../utils/cookieHelper';

export interface CreateOrderRequest {
    orderSource: "PROVIDER_SITE" | "PLATFORM" | "AGENT";
    paymentMethod: "CARD" | "CASH" | "TRANSFER" | "NONE";
    paymentStatus: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
    paymentProvider?: "GOOGLE_PAY" | "PAYPAL" | "MERCADO_PAGO" | "STRIPE" | "YAPE" | "NIUBIZ" | "OTHER";
    orderStatus: "CREATED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
    items: OrderItemRequest[];
  }
  
  export interface OrderItemRequest {
    activityId: string;
    bookingOptionId: string;
    currency: "USD" | "PEN" | "EUR";
    participants: number;
    pricePerParticipant: number;
    startDatetime: string; // ISO 8601 (ej: "2025-12-20T08:00:00")
    endDatetime?: string;
    specialRequest?: string;
    status: "PENDING" | "ATTENDED" | "CANCELLED";
    commissionPercentPlatform?: number;
    commissionPercentAgent?: number;
    commissionAmountPlatform?: number;
    commissionAmountAgent?: number;
    meetingPickupPlaceId?: number;
    meetingPickupPointName?: string;
    meetingPickupPointAddress?: string;
    meetingPickupPointLatitude?: number;
    meetingPickupPointLongitude?: number;
    guideLanguage?: string;
  }

  export interface CreateOrderResponse {
    success: boolean;
    message: string;
    idCreated: number;
  }
  
  export const ordersApi = {
    createOrder: async (request: CreateOrderRequest): Promise<CreateOrderResponse> => {
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

        const response = await apiClient.post<CreateOrderResponse>('/orders', request, config);

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
    }
  }