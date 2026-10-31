import { backendClient } from './api';
import { 
  VendorResponse, 
  VendorDetailResponse, 
  CreateVendorPayload, 
  UpdateVendorPayload, 
  UpdateVendorStatusPayload, 
  PageResponse 
} from '../types/vendor';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const vendorService = {
  getVendors: async (params?: {
    search?: string;
    status?: string;
    category?: string;
    city?: string;
    district?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PageResponse<VendorResponse>> => {
    const cleanParams: Record<string, unknown> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.status && params.status !== 'ALL') cleanParams.status = params.status;
    if (params?.category && params.category !== 'ALL') cleanParams.category = params.category;
    if (params?.city) cleanParams.city = params.city;
    if (params?.district) cleanParams.district = params.district;
    cleanParams.page = params?.page ?? 0;
    cleanParams.size = params?.size ?? 10;
    cleanParams.sort = params?.sort ?? 'createdAt,desc';

    const response = await backendClient.get<ApiResponse<PageResponse<VendorResponse>>>('/v1/vendors', {
      params: cleanParams,
    });
    return response.data.data;
  },

  getVendorById: async (id: string): Promise<VendorDetailResponse> => {
    const response = await backendClient.get<ApiResponse<VendorDetailResponse>>(`/v1/vendors/${id}`);
    return response.data.data;
  },

  createVendor: async (payload: CreateVendorPayload): Promise<VendorResponse> => {
    const response = await backendClient.post<ApiResponse<VendorResponse>>('/v1/vendors', payload);
    return response.data.data;
  },

  updateVendor: async (id: string, payload: UpdateVendorPayload): Promise<VendorResponse> => {
    const response = await backendClient.put<ApiResponse<VendorResponse>>(`/v1/vendors/${id}`, payload);
    return response.data.data;
  },

  updateVendorStatus: async (id: string, payload: UpdateVendorStatusPayload): Promise<VendorResponse> => {
    const response = await backendClient.patch<ApiResponse<VendorResponse>>(`/v1/vendors/${id}/status`, payload);
    return response.data.data;
  },
};
