import { apiClient } from './apiClient';
import { auth } from '../config/firebase';
import { getAuthToken } from '../utils/cookieHelper';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  totalElements?: number;
  totalPages?: number;
  pageSize?: number;
  currentPage?: number;
}

export interface OrderUpdateRequest {
  orderStatus: "CREATED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  paymentMethod: "CARD" | "CASH" | "TRANSFER" | "NONE";
  paymentProvider: 
    | "GOOGLE_PAY"
    | "PAYPAL"
    | "MERCADO_PAGO"
    | "STRIPE"
    | "YAPE"
    | "NIUBIZ"
    | "OTHER";
}


export interface OrderResponse {
  id: string;
  issuedBy?: string | null;
  issuedTo?: number | null;
  orderSource: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentStatusHistory?: string | null;
  orderStatus: string;
  orderStatusHistory?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
  subtotal: number;
  totalCommissionPlatform: number;
  totalCommissionAgent: number;
  totalAmount: number;
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

export interface OrderItemResponse {
  id: number;
  orderId: string;
  activity: Activity;
  bookingOptionId: string;
  currency: string;
  participants: number;
  participantsDetails: {
    adults: number;
    children: number;
  };
  pricePerParticipant: number;
  timeZone: string;
  startDatetime: string;
  endDatetime: string | null;
  specialRequest?: string | null;
  status: string;
  statusHistory?: string | null;
  commissionPercentPlatform?: number | null;
  commissionPercentAgent?: number | null;
  commissionAmountPlatform?: number | null;
  commissionAmountAgent?: number | null;
  meetingPickupPlaceId?: number | null;
  meetingPickupPointAddress?: string | null;
  meetingPickupPointLatitude?: number | null;
  meetingPickupPointLongitude?: number | null;
  guideLanguage?: string | null;
  cancelUntilDate?: string | null;
  totalAmount: number;
  exchangeRateUSDtoPEN: number;
  isReviewed: boolean;
}

export interface GetOrdersDraftRequest {
  page: number;
  size: number;
  sortBy: "startDateTime" | "createdAt";
  sortDirection: "ASC" | "DESC";
  lang: string;
  currency: string;
}

export interface GetOrdersAvailablesRequest {
  orderStatus?: string;
  paymentStatus?: string;
  orderId?: string;
  fromDate?: string;
  toDate?: string;
  lang?: string;
  currency?: string;
  exchangeRateUSDtoPEN?: number;
  page?: number;
  size?: number;
  sortBy?: "startDateTime" | "createdAt";
  sortDirection?: "ASC" | "DESC";
}

export const ordersApi = {
  getOrdersDraft: async (request: GetOrdersDraftRequest): Promise<ApiResponse<OrderResponse[]>> => {
    try {
      let firebaseToken: string | null = null;

      // Obtener token Firebase actual
      if (auth.currentUser) {
        try {
          firebaseToken = await auth.currentUser.getIdToken();
        } catch (error) {
          console.error("Orders API: Error al obtener token Firebase:", error);
        }
      }

      // Fallback al token almacenado
      if (!firebaseToken) {
        firebaseToken = getAuthToken();
      }

      // Configuración para enviar Authorization: Bearer <token>
      const config = firebaseToken
        ? {
            headers: {
              Authorization: `Bearer ${firebaseToken}`
            }
          }
        : undefined;

      console.log("📄 Orders API -> GET Orders Draft");
      console.log(
        "🔐 Token utilizado:",
        firebaseToken ? `${firebaseToken.substring(0, 10)}...` : "No disponible"
      );

      // Enviar parámetros por separado usando params (sin orderStatus)
      const requestConfig = {
        ...(config || {}),
        params: {
          page: request.page,
          size: request.size,
          sortBy: request.sortBy,
          sortDirection: request.sortDirection,
          lang: request.lang,
          currency: request.currency
        }
      };

      const response = await apiClient.get<ApiResponse<OrderResponse[]>>('/orders/draft', requestConfig);

      if (response?.data) {
        return response.data;
      }

      throw new Error("Respuesta inesperada del servidor al consultar órdenes");
      } catch (error: any) {
      console.error("Orders API: Error al obtener órdenes:", error);

      if (error?.response?.data) {
        throw error.response.data;
      }

      throw error instanceof Error
        ? error
        : new Error("Error desconocido al obtener las órdenes");
    }
  },
  getOrdersAvailables: async (request: GetOrdersAvailablesRequest): Promise<ApiResponse<OrderResponse[]>> => {
    try {
      let firebaseToken: string | null = null;

      // Obtener token Firebase actual
      if (auth.currentUser) {
        try {
          firebaseToken = await auth.currentUser.getIdToken();
        } catch (error) {
          console.error("Orders API: Error al obtener token Firebase:", error);
        }
      }

      // Fallback al token almacenado
      if (!firebaseToken) {
        firebaseToken = getAuthToken();
      }

      // Configuración para enviar Authorization: Bearer <token>
      const config = firebaseToken
        ? {
            headers: {
              Authorization: `Bearer ${firebaseToken}`
            }
          }
        : undefined;

      console.log("📄 Orders API -> GET Orders Available");
      console.log(
        "🔐 Token utilizado:",
        firebaseToken ? `${firebaseToken.substring(0, 10)}...` : "No disponible"
      );

      // Enviar parámetros por separado usando params
      const requestConfig = {
        ...(config || {}),
        params: {
          lang: request.lang,
          currency: request.currency,
          exchangeRateUSDtoPEN: request.exchangeRateUSDtoPEN,
          page: request.page,
          size: request.size,
          sortBy: request.sortBy,
          sortDirection: request.sortDirection,
          ...(request.orderStatus && { orderStatus: request.orderStatus }),
          ...(request.paymentStatus && { paymentStatus: request.paymentStatus }),
          ...(request.orderId && { orderId: request.orderId }),
          ...(request.fromDate && { fromDate: request.fromDate }),
          ...(request.toDate && { toDate: request.toDate })
        }
      };

      const response = await apiClient.get<ApiResponse<OrderResponse[]>>('/orders/availables', requestConfig);

      if (response?.data) {
        return response.data;
      }

      throw new Error("Respuesta inesperada del servidor al consultar órdenes");
      } catch (error: any) {
      console.error("Orders API: Error al obtener órdenes disponibles:", error);

      if (error?.response?.data) {
        throw error.response.data;
      }

      throw error instanceof Error
        ? error
        : new Error("Error desconocido al obtener las órdenes");
    }
  },
  updateOrder: async (orderId: string, request: OrderUpdateRequest): Promise<ApiResponse<OrderResponse>> => {
    try {
      let firebaseToken: string | null = null;

      // Obtener token Firebase actual
      if (auth.currentUser) {
        try {
          firebaseToken = await auth.currentUser.getIdToken();
        } catch (error) {
          console.error("Orders API: Error al obtener token Firebase:", error);
        }
      }

      // Fallback al token almacenado
      if (!firebaseToken) {
        firebaseToken = getAuthToken();
      }

      // Configuración para enviar Authorization: Bearer <token>
      const config = firebaseToken
        ? {
            headers: {
              Authorization: `Bearer ${firebaseToken}`
            }
          }
        : undefined;

      console.log("📝 Orders API -> UPDATE Order");
      console.log(
        "🔐 Token utilizado:",
        firebaseToken ? `${firebaseToken.substring(0, 10)}...` : "No disponible"
      );

      const response = await apiClient.post<ApiResponse<OrderResponse>>(`/orders/${orderId}/update`, request, config);
      return response.data;
    } catch (error: any) {
      console.error("Orders API: Error al actualizar la orden:", error);
      
      if (error?.response?.data) {
        throw error.response.data;
      }

      throw error instanceof Error
        ? error
        : new Error("Error desconocido al actualizar la orden");
    }
  }
};
