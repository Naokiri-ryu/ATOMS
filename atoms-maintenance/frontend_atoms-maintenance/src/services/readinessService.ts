import { API_URL_PROD } from '@/config';
import axios from 'axios';

const API_URL = API_URL_PROD || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const readinessService = {
  async saveReading(id: number, payload: {
    module_key: string;
    value: string;
    shift_type?: string;
    date?: string;
    notes?: string;
  }) {
    return axios.post(`${API_URL}/v1/branches/${id}/readings`, payload, {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
    });
  },
};