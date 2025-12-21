import { apiGet } from './apiConfig';
import { apiPost } from './apiConfig';

export interface TranslationRequest {
    text: string;
    lang: string; // lang destino
}

export interface ApiResponse {
    success: boolean;
    message: string;
    data: Translation;
}

export interface Translation {
    originalText: string;
    detectedLanguage: String;
    targetLanguage: String;
    translatedText: string;
}

export const translationApi = {
    translate: async (request: TranslationRequest): Promise<ApiResponse> => {
        try {
            const response = await apiPost<ApiResponse>('/translation', request);
            if (response && response.success && response.data) {
                return response;
            } else {
                throw new Error('Respuesta inválida del servidor al traducir texto');
            }
        } catch (error: unknown) {
            console.error('Error al traducir texto:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Error desconocido al traducir texto'
            );
        }
    },
};