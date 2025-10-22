import { apiGet } from "./apiConfig";
import { apiPost } from "./apiConfig";


export interface SpecialOfferRequest{
    offerName: string;
  selectedActivityId: string;
  selectedOptionId: string;
  fromDate: string; // formato ISO: yyyy-MM-dd
  toDate: string;   // formato ISO: yyyy-MM-dd
  offerType: "limited-time" | "early_booking" | "last_minute";
  timeSlots: "all" | "specific";
  noticePeriodDays?: number | null;
  advancePeriodDays?: number | null;
  selectedScheduleDate?: any | null;
  placesScope: string;
  limitedPlaces?: number | null;
  discountPercentage: number;
  companyId: number;
  createdAt: string; // formato ISO completo
  language: "es" | "en";
}

export interface SpecialOfferDayResponse {
    id: number;
    dayIndex: number; // 0 = Lunes, 1 = Martes, etc.
    specialOfferTimes?: SpecialOfferTimeResponse[];
}

export interface SpecialOfferTimeResponse {
    id: number;
    startTime: string; // formato "HH:mm:ss"
    endTime: string;
}

export interface SpecialOfferResponse {
    id: number;
    activityId: string;
    activityTitle: string;
    activityImageUrl: string;
    bookingOptionId: string;
    offerName: string;
    offerType: string;
    fromDate: string;
    toDate: string;
    daysBeforeStart?: number | null;
    daysBeforeEnd?: number | null;
    discountPercent: number;
    limitedSlots?: number | null;
    applyToAllSlots: boolean;
    createdAt: string;
    updatedAt?: string;
    isActive: boolean;
    specialOfferDays?: SpecialOfferDayResponse[];
}

export interface ApiResponse<T> {
    success: boolean;
    successCode?: string;
    message: string;
    idCreated?: number;
    data?: T;
    totalElements?: number;
    pageSize?: number;
    totalPages?: number;
    currentPage?: number;
    nextPage?: number | null;
}

export interface SpecialOfferListParams {
    activityId?: string;
    bookingOptionId?: string;
    offerType?: string;
    startDate?: string; // formato ISO: yyyy-MM-dd
    endDate?: string;   // formato ISO: yyyy-MM-dd
    isActive?: boolean;
    lang?: string;
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'ASC' | 'DESC';
}

export const specialOfferApi = {
    createSpecialOffer: async (specialOffer: SpecialOfferRequest): Promise<SpecialOfferResponse> => {
        const response = await apiPost<ApiResponse<SpecialOfferResponse>>('/special-offers/create', specialOffer);
        
        // Verificar si la respuesta tiene el formato esperado del API
        if(response && typeof response === 'object' && 'success' in response && 'data' in response){
            const apiResponse = response as ApiResponse<SpecialOfferResponse>;
            
            if(apiResponse.success && apiResponse.data){
                return apiResponse.data;
            } else {
                throw new Error(apiResponse.message || 'Error al crear la oferta especial');
            }
        }
        
        // Fallback para respuestas que no siguen el formato estándar
        const responseAny = response as any;
        if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
            return responseAny.data as SpecialOfferResponse;
        }
        
        throw new Error('Respuesta inesperada del servidor');
    },
    
    getList: async (params: SpecialOfferListParams = {}): Promise<ApiResponse<SpecialOfferResponse[]>> => {
        // Construir query parameters
        const queryParams = new URLSearchParams();
        
        if (params.activityId) queryParams.append('activityId', params.activityId);
        if (params.bookingOptionId) queryParams.append('bookingOptionId', params.bookingOptionId);
        if (params.offerType) queryParams.append('offerType', params.offerType);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
        if (params.lang) queryParams.append('lang', params.lang);
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.direction) queryParams.append('direction', params.direction);
        
        // Construir URL con query parameters
        const url = `/special-offers/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        const response = await apiGet<ApiResponse<SpecialOfferResponse[]>>(url);
        
        // Verificar si la respuesta tiene el formato esperado del API
        if(response && typeof response === 'object' && 'success' in response && 'message' in response){
            const apiResponse = response as ApiResponse<SpecialOfferResponse[]>;
            
            if(apiResponse.success){
                return apiResponse;
            } else {
                throw new Error(apiResponse.message || 'Error al obtener la lista de ofertas especiales');
            }
        }
        
        // Fallback para respuestas que no siguen el formato estándar
        const responseAny = response as any;
        if(responseAny && typeof responseAny === 'object' && 'data' in responseAny){
            return {
                success: true,
                message: 'Ofertas especiales obtenidas exitosamente',
                data: responseAny.data || [],
                totalElements: responseAny.totalElements || 0,
                pageSize: responseAny.pageSize || 0,
                totalPages: responseAny.totalPages || 0,
                currentPage: responseAny.currentPage || 0,
                nextPage: responseAny.nextPage || null
            };
        }
        
        throw new Error('Respuesta inesperada del servidor');
    },
    
    getSpecialOffer: async (id: string | number): Promise<SpecialOfferResponse> => {
        const response = await apiGet<ApiResponse<SpecialOfferResponse>>(`/special-offers/${id}`);
        
        // Verificar si la respuesta tiene el formato esperado del API
        if(response && typeof response === 'object' && 'success' in response && 'data' in response){
            const apiResponse = response as ApiResponse<SpecialOfferResponse>;
            
            if(apiResponse.success && apiResponse.data){
                return apiResponse.data;
            } else {
                throw new Error(apiResponse.message || 'Error al obtener la oferta especial');
            }
        }
        
        // Fallback para respuestas que no siguen el formato estándar
        const responseAny = response as any;
        if(responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data){
            return responseAny.data as SpecialOfferResponse;
        }
        
        throw new Error('Respuesta inesperada del servidor');
    },
    
    
}
  