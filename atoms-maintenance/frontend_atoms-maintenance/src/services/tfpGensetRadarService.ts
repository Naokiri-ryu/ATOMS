import { API_URL_PROD } from '@/config';
import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  TfpGensetRadarRecordDetail,
  TfpGensetRadarRecordSummary,
  TfpGensetRadarListParams,
  TfpGensetRadarUpdatePayload,
  TfpGensetRadarSaveStructurePayload,
  TfpGensetRadarFieldsPayload,
  TfpGensetRadarRoleKey,
} from '@/types/tfpGensetRadar';

const API_URL = API_URL_PROD || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

interface PaginatedApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const tfpGensetRadarService = {
  async listRecords(
    params: TfpGensetRadarListParams = {},
  ): Promise<PaginatedApiResponse<TfpGensetRadarRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/tfp/genset-radar`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/tfp/genset-radar/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/tfp/genset-radar/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    location?: string;
    engine?: string;
    alternator?: string;
    kapasitas?: string;
  }): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/tfp/genset-radar`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(
    id: number,
    payload: TfpGensetRadarUpdatePayload,
  ): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/genset-radar/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateGensetFields(
    id: number,
    payload: TfpGensetRadarFieldsPayload,
  ): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/genset-radar/${id}/genset-fields`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: TfpGensetRadarRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: TfpGensetRadarRoleKey; record: TfpGensetRadarRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/tfp/genset-radar/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/tfp/genset-radar/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  async addParameter(
    id: number,
    payload: { parameter_name: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/genset-radar/${id}/parameters`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateParameter(
    id: number,
    paramId: number,
    payload: { parameter_name?: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-radar/${id}/parameters/${paramId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteParameter(id: number, paramId: number): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/genset-radar/${id}/parameters/${paramId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderParameters(id: number, orderedIds: number[]): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-radar/${id}/parameters-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async addFacility(
    id: number,
    payload: { facility_name: string },
  ): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/genset-radar/${id}/facilities`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateFacility(
    id: number,
    facilityId: number,
    payload: { facility_name?: string },
  ): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-radar/${id}/facilities/${facilityId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteFacility(id: number, facilityId: number): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/genset-radar/${id}/facilities/${facilityId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderFacilities(id: number, orderedIds: number[]): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-radar/${id}/facilities-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async saveStructure(
    id: number,
    payload: TfpGensetRadarSaveStructurePayload,
  ): Promise<TfpGensetRadarRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-radar/${id}/structure`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};
