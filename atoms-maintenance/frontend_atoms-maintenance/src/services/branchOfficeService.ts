import { API_URL_PROD } from '@/config';
import axios from 'axios';
import type {
  BranchModuleCatalog,
  BranchOfficeCreatePayload,
  BranchOfficeDetail,
  BranchOfficeSummary,
  BranchOfficeUpdatePayload,
  BranchModulesUpdatePayload,
} from '@/types/branch';

const API_URL = API_URL_PROD || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export const branchOfficeService = {
  async listOffices(params: { search?: string } = {}): Promise<BranchOfficeSummary[]> {
    const response = await axios.get(`${API_URL}/v1/branches`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data.data as BranchOfficeSummary[];
  },

  async getModuleCatalog(): Promise<BranchModuleCatalog> {
    const response = await axios.get(`${API_URL}/v1/branches/module-catalog`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as BranchModuleCatalog;
  },

  async getOffice(id: number): Promise<BranchOfficeDetail> {
    const response = await axios.get(`${API_URL}/v1/branches/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as BranchOfficeDetail;
  },

  async createOffice(payload: BranchOfficeCreatePayload): Promise<BranchOfficeSummary> {
    const response = await axios.post(`${API_URL}/v1/branches`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as BranchOfficeSummary;
  },

  async updateOffice(id: number, payload: BranchOfficeUpdatePayload): Promise<BranchOfficeSummary> {
    const response = await axios.put(`${API_URL}/v1/branches/${id}`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as BranchOfficeSummary;
  },

  async updateModules(id: number, payload: BranchModulesUpdatePayload): Promise<BranchOfficeDetail> {
    const response = await axios.put(`${API_URL}/v1/branches/${id}/modules`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as BranchOfficeDetail;
  },

  async deleteOffice(id: number): Promise<void> {
    await axios.delete(`${API_URL}/v1/branches/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};