import { API_URL_PROD } from '@/config';
import axios from 'axios';
import type { ShiftType } from '@/types';
import type {
  TfpGensetDvorRecordDetail,
  TfpGensetDvorRecordSummary,
  TfpGensetDvorListParams,
  TfpGensetDvorUpdatePayload,
  TfpGensetDvorSaveStructurePayload,
  TfpGensetDvorFieldsPayload,
  TfpGensetDvorRoleKey,
} from '@/types/tfpGensetDvor';

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

export const tfpGensetDvorService = {
  async listRecords(
    params: TfpGensetDvorListParams = {},
  ): Promise<PaginatedApiResponse<TfpGensetDvorRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/tfp/genset-dvor`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/tfp/genset-dvor/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/tfp/genset-dvor/years`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as number[];
  },

  async createRecord(payload: {
    date: string;
    shift_type: ShiftType;
    form_type?: string;
    location?: string;
  }): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.post(`${API_URL}/v1/tfp/genset-dvor`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async updateRecord(
    id: number,
    payload: TfpGensetDvorUpdatePayload,
  ): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/genset-dvor/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  /** Updates catatan / status_operasi / status_master_slave / fuel_level — fields unique to this module. */
  async updateGensetFields(
    id: number,
    payload: TfpGensetDvorFieldsPayload,
  ): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/tfp/genset-dvor/${id}/genset-fields`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: TfpGensetDvorRoleKey,
    signature: string,
    technicianRowId?: number,
  ): Promise<{ signed_role: TfpGensetDvorRoleKey; record: TfpGensetDvorRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/tfp/genset-dvor/${id}/sign`, body, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async deleteRecord(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/tfp/genset-dvor/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  // ─── Structural edit (Manager / Supervisor / Admin only) ─────
  // All eight return the refreshed detail record so callers can
  // setRecord() directly without a follow-up GET.

  async addParameter(
    id: number,
    payload: { parameter_name: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/genset-dvor/${id}/parameters`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateParameter(
    id: number,
    paramId: number,
    payload: { parameter_name?: string; parameter_number?: string | null; unit?: string | null },
  ): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-dvor/${id}/parameters/${paramId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteParameter(id: number, paramId: number): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/genset-dvor/${id}/parameters/${paramId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderParameters(id: number, orderedIds: number[]): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-dvor/${id}/parameters-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async addFacility(
    id: number,
    payload: { facility_name: string },
  ): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/tfp/genset-dvor/${id}/facilities`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async updateFacility(
    id: number,
    facilityId: number,
    payload: { facility_name?: string },
  ): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-dvor/${id}/facilities/${facilityId}`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async deleteFacility(id: number, facilityId: number): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.delete(
      `${API_URL}/v1/tfp/genset-dvor/${id}/facilities/${facilityId}`,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  async reorderFacilities(id: number, orderedIds: number[]): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-dvor/${id}/facilities-reorder`,
      { ordered_ids: orderedIds },
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },

  // ─── Excel-like structure save (Manager / Supervisor / Admin) ─────────────
  //
  // Batch-save the full columns_config + per-item is_disabled_map + merge_map.
  // Cell values are kept intact server-side, except for cells whose keys are
  // no longer present in the new columns_config — those get pruned.
  async saveStructure(
    id: number,
    payload: TfpGensetDvorSaveStructurePayload,
  ): Promise<TfpGensetDvorRecordDetail> {
    const response = await axios.put(
      `${API_URL}/v1/tfp/genset-dvor/${id}/structure`,
      payload,
      { headers: getAuthHeaders() },
    );
    return response.data.data;
  },
};