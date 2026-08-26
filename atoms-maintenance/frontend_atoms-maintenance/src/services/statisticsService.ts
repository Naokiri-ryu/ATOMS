import { API_URL_PROD } from '@/config';
import axios from 'axios';

const API_URL = API_URL_PROD || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getAuthHeaders() {
  const token = sessionStorage.getItem('auth_token');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export type StatisticsDivision = 'CNSD' | 'TFP';

export interface StatisticsTrendPoint {
  month: number;
  label: string;
  cnsd: number;
  tfp: number;
  total: number;
}

/** Rekap satu modul CNSD/TFP untuk satu tahun (hanya record completed). */
export interface StatisticsModuleItem {
  module_key: string;
  label: string;
  division: StatisticsDivision;
  group: string;
  route: string;
  total: number;
  /** Jumlah setoran per bulan, index 0 = Januari. */
  monthly: number[];
  /** Tanggal setoran terakhir (YYYY-MM-DD) atau null bila belum ada. */
  last_date: string | null;
}

export interface StatisticsOverview {
  year: number;
  totals: Record<StatisticsDivision, number>;
  grand_total: number;
  trend: StatisticsTrendPoint[];
  modules: StatisticsModuleItem[];
}

export const statisticsService = {
  async getOverview(year?: number): Promise<StatisticsOverview> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    const res = await axios.get(`${API_URL}/v1/statistics/overview`, { headers: getAuthHeaders(), params });
    return res.data.data as StatisticsOverview;
  },
};
