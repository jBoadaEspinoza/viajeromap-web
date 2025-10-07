import { apiClient } from './apiClient';

export interface CompanyData {
  name: string;
  logoUrl: string;
  address: string;
  latitude: number;
  longitude: number;
  linkReviewGoogleMap: string;
  whatsappNumber: string;
  isActive: boolean;
}

export interface CompanyResponse {
  success: boolean;
  message: string;
  data: CompanyData;
}

export const companiesApi = {
  getCompany: async (): Promise<CompanyResponse> => {
    const response = await apiClient.get(`/companies/current`);
    return response.data;
  },
}; 