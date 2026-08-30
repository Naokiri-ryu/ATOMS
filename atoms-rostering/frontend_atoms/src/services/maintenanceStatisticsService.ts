import axios from 'axios';
import { getStoredToken, getStoredUser } from '../modules/auth/core/authStorage';

/**
 * maintenanceStatisticsService — menjembatani halaman Statistik di
 * frontend_atoms (rostering) dengan backend atoms-maintenance.
 *
 * Data yang ditampilkan sama persis dengan halaman /statistics milik
 * aplikasi Maintenance: rekap setoran form CNSD & TFP berstatus
 * completed, dari endpoint GET {maintenance-api}/v1/statistics/overview.
 *
 * Autentikasi: token Sanctum rostering divalidasi backend maintenance
 * (mode produksi) atau didaftarkan lewat cache tokenfix (mode dev,
 * DEV_MOCK_AUTH=true). Pendaftaran dilakukan sekali per sesi via
 * endpoint publik GET /v1/auth/verify?tokenfix=mock-token-{id}.
 */

export type StatisticsDivision = 'CNSD' | 'TFP';

export interface StatisticsTrendPoint {
  month: number;
  label: string;
  cnsd: number;
  tfp: number;
  total: number;
}

export interface StatisticsModuleItem {
  module_key: string;
  label: string;
  division: StatisticsDivision;
  group: string;
  route: string;
  total: number;
  monthly: number[];
  last_date: string | null;
}

export interface StatisticsOverview {
  year: number;
  totals: Record<StatisticsDivision, number>;
  grand_total: number;
  trend: StatisticsTrendPoint[];
  modules: StatisticsModuleItem[];
}

const getMaintenanceApiBaseUrl = (): string => {
  const currentUrl = window.location.href;

  // Kalau akses dari localhost → pake localhost
  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    return import.meta.env.VITE_MAINTENANCE_API_URL || 'http://localhost:5657/api';
  }

  // Fallback (akses via IP server)
  return import.meta.env.VITE_MAINTENANCE_API_URL_PROD || 'http://localhost:5657/api';
};

let maintenanceAuthReady = false;

/** Daftarkan token rostering ke cache backend maintenance (dev mode). */
async function ensureMaintenanceAuth(): Promise<void> {
  if (maintenanceAuthReady) return;

  const token = getStoredToken();
  if (!token) throw new Error('Belum login.');

  const userStr = getStoredUser();
  let tokenfix: string | undefined;
  try {
    const user = userStr ? JSON.parse(userStr) : null;
    tokenfix = user?.id ? `mock-token-${user.id}` : undefined;
  } catch {
    tokenfix = undefined;
  }

  try {
    await axios.get(`${getMaintenanceApiBaseUrl()}/v1/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      params: tokenfix ? { tokenfix } : undefined,
    });
    maintenanceAuthReady = true;
  } catch {
    // Mode produksi tidak butuh pendaftaran cache — biarkan request
    // statistik yang menilai validitas token.
  }
}

export const maintenanceStatisticsService = {
  async getOverview(year?: number): Promise<StatisticsOverview> {
    const token = getStoredToken();
    if (!token) throw new Error('Belum login.');

    await ensureMaintenanceAuth();

    const res = await axios.get(`${getMaintenanceApiBaseUrl()}/v1/statistics/overview`, {
      headers: { Authorization: `Bearer ${token}` },
      params: year ? { year } : undefined,
    });
    return res.data.data as StatisticsOverview;
  },
};
