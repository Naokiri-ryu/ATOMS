import { API_URL_PROD } from '@/config';
import axios from 'axios';
import type {
  TfpGensetRadarRecord,
  TfpGensetRadarRecordDetail,
} from '@/types/tfpGensetRadar';

const API_URL = API_URL_PROD || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export const tfpGensetRadarService = {
  getRecords: async (params?: any) => {
    const response = await axios.get(`${API_URL}/tfp/genset-radar`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  getRecord: async (id: number): Promise<TfpGensetRadarRecordDetail> => {
    const response = await axios.get(`${API_URL}/tfp/genset-radar/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  createRecord: async (data: Partial<TfpGensetRadarRecord>) => {
    const response = await axios.post(`${API_URL}/tfp/genset-radar`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  updateRecord: async (id: number, data: Partial<TfpGensetRadarRecord>) => {
    const response = await axios.put(`${API_URL}/tfp/genset-radar/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  deleteRecord: async (id: number) => {
    await axios.delete(`${API_URL}/tfp/genset-radar/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
