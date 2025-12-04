import { apiClient } from './apiClient';
import {auth} from '../config/firebase';
import { getAuthToken } from '../utils/cookieHelper';

export interface IssuedBy {
    id: number;
    nickname: string;
    profileImageUrl: string;
    country: string;
}

export interface ActivityReview {
    id: string;
    rating: number;
    comment?: string;
    lang: string;
    createdAt: string;
    issuedBy: IssuedBy;
}
  
export interface ActivityReviewRequest {
    activityId: string;
    orderItemId: number;
    rating: number;
    comment?: string;
    lang: "es" | "en";
}

export interface ApiResponse {
    success: boolean;
    message: string;
    idCreated?: string | number | null;
}

export const activityReviewsApi = {
    createActivityReview: async (request: ActivityReviewRequest): Promise<ApiResponse> => {
        try{
            let firebaseToken: string | null = null;

            // Intentar obtener el token actual de Firebase
            if (auth.currentUser) {
                try {
                    firebaseToken = await auth.currentUser.getIdToken();
                } catch (error) {
                    console.error('Activity Reviews API: Error al obtener el token de Firebase:', error);
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
            console.log('📝 Activity Reviews API -> createActivityReview request:', request);
            console.log('🔐 Activity Reviews API -> token utilizado:', firebaseToken ? `${firebaseToken.substring(0, 8)}...` : 'No disponible');
            const response = await apiClient.post<ApiResponse>('/activity-reviews', request, config);
            if (response?.data) {
                return response.data;
            }
            throw new Error('Respuesta inesperada al crear la valoración');

        } catch (error: any) {
            console.error('Activity Reviews API: Error creating activity review:', error);
            if (error?.response?.data) {
                throw error.response.data;
            }
            throw error instanceof Error ? error : new Error('Error desconocido al crear la valoración');
        }
    }
}