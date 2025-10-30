import { apiGet } from './apiConfig';

export interface PhoneCodeSearchParams{
    lang: string;
    all: boolean;
    sortBy: string;
}

export interface NationalitySearchParams{
    lang: string;
    all: boolean;
    sortBy: string;
}

export interface PhoneCode {
    code2: string;
    code3: string;
    countryName: string;
    code: string;
}

export interface Nationality{
    code2: string;
    code3: string;
    denomination: string;
}

export interface PhoneCodeResponse{
    success: boolean;
    message: string;
    data: PhoneCode[];
}

export interface NationalityResponse{
    success: boolean;
    message: string;
    data: Nationality[];
}

export const countriesApi = {
    getPhoneCodes: async (params: PhoneCodeSearchParams): Promise<PhoneCodeResponse> => {
        try {
            const response = await apiGet<PhoneCodeResponse>('/countries/phoneCodes', { params });
            return response;
        } catch (error: any) {
            console.error('Countries API: Error fetching phone codes:', error);
            
            // Retornar una respuesta de error en lugar de lanzar la excepción
            return {
                success: false,
                message: error.response?.data?.message || 'Error al obtener los códigos telefónicos',
                data: []
            };
        }
    },
    getNationalities: async (params: NationalitySearchParams): Promise<NationalityResponse> => {
        try {
            const response = await apiGet<NationalityResponse>('/countries/nationalities', { params });
            return response;
        } catch (error: any) {
            console.error('Countries API: Error fetching nationalities:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error al obtener las nacionalidades',
                data: []
            };
        }
    }
}
