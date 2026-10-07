import axios from 'axios';
import { getStoredToken, getStoredUser } from '../modules/auth/core/authStorage';

/**
 * maintenanceStatisticsService — menjembatani halaman Statistik di
 * frontend_atoms (rostering) dengan backend atoms-maintenance.
 *
 * Dua kelompok data, keduanya dilayani backend atoms-maintenance:
 *
 *  1. Rekap setoran form CNSD & TFP berstatus completed, dari endpoint
 *     GET {maintenance-api}/v1/statistics/overview (endpoint legacy,
 *     tetap dipertahankan di backend).
 *  2. Statistik Performance Check TFP per peralatan — tren nilai
 *     pengukuran (min/maks/rata-rata) per bulan — dari
 *     GET {maintenance-api}/v1/statistics/tfp/equipment dan
 *     GET {maintenance-api}/v1/statistics/tfp/{moduleKey}.
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

// ─── Statistik TFP per peralatan ───────────────────────────────────────────
//
// Satu "titik ukur" = satu parameter pada satu panel/kolom. Nilai pengukuran
// TFP disimpan per sel (mis. "panel_rd01.value"), jadi nama parameter saja
// tidak cukup untuk mengidentifikasi satu rangkaian angka.

/** Ringkasan satu peralatan untuk daftar /statistics. */
export interface TfpEquipmentSummary {
  module_key: string;
  label: string;
  route: string;
  total_records: number;
  completed_records: number;
  completion_rate: number;
  /** Index 0 = Januari. */
  monthly_total: number[];
  monthly_completed: number[];
  last_date: string | null;
}

export interface TfpEquipmentIndex {
  year: number;
  equipment: TfpEquipmentSummary[];
}

/** Pointer untuk satu titik ukur — dikirim sebagai query param. */
export interface TfpMeasurementPointRef {
  parameter_number: string;
  parameter_name: string;
  cell_key: string;
}

/** Titik ukur yang tersedia untuk peralatan + tahun terpilih. */
export interface TfpMeasurementPoint extends TfpMeasurementPointRef {
  point_id: string;
  /** Label panel, mis. "Panel RD 01 · Nilai". */
  cell_label: string;
  unit: string | null;
  /** Jumlah pembacaan setelah nilai tidak wajar disaring. */
  samples: number;
}

/** Satu titik bulanan pada grafik. Null = tidak ada pembacaan bulan itu. */
export interface TfpSeriesPoint {
  month: number;
  label: string;
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
}

export interface TfpSeries {
  parameter_number: string | null;
  parameter_name: string | null;
  unit: string | null;
  cell_key: string | null;
  cell_label: string | null;
  total_samples: number;
  /** Pembacaan yang dibuang karena di luar rentang wajar — ditampilkan ke user. */
  samples_excluded: number;
  points: TfpSeriesPoint[];
}

export interface TfpEquipmentDetail {
  year: number;
  module_key: string;
  label: string;
  route: string;
  records_total: number;
  records_completed: number;
  completion_rate: number;
  monthly_total: number[];
  monthly_completed: number[];
  status_counts: { ongoing: number; on_hold: number; completed: number };
  last_date: string | null;
  available_points: TfpMeasurementPoint[];
  series: TfpSeries;
}

// ─── Statistik Ground Check (backend maintenance) ──────────────────────────

/** Ringkasan satu modul Ground Check. */
export interface GroundCheckModuleSummary {
  module_key: string;
  label: string;
  route: string;
  total_records: number;
  completed_records: number;
  completion_rate: number;
  monthly_total: number[];
  monthly_completed: number[];
  last_date: string | null;
  /** false = modul ini hanya punya kelengkapan, tanpa nilai numerik. */
  has_numeric: boolean;
  metric_count: number;
}

export interface GroundCheckIndex {
  year: number;
  modules: GroundCheckModuleSummary[];
}

/** Satu kolom ukur, mis. tx1_error atau tx1_rf_level_db. */
export interface GroundCheckMetric {
  metric_key: string;
  label: string;
  unit: string | null;
  samples: number;
  /** Pembacaan yang ditulis ulang saat dibaca karena wraparound 360°. */
  normalized: number;
}

export interface GroundCheckSeries {
  metric_key: string | null;
  label: string | null;
  unit: string | null;
  total_samples: number;
  normalized_samples: number;
  points: TfpSeriesPoint[];
}

export interface GroundCheckDetail {
  year: number;
  module_key: string;
  label: string;
  route: string;
  records_total: number;
  records_completed: number;
  completion_rate: number;
  monthly_total: number[];
  monthly_completed: number[];
  status_counts: { ongoing: number; on_hold: number; completed: number };
  last_date: string | null;
  has_numeric: boolean;
  available_metrics: GroundCheckMetric[];
  series: GroundCheckSeries;
}

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

  async getTfpEquipment(year?: number): Promise<TfpEquipmentIndex> {
    const token = getStoredToken();
    if (!token) throw new Error('Belum login.');

    await ensureMaintenanceAuth();

    const res = await axios.get(`${getMaintenanceApiBaseUrl()}/v1/statistics/tfp/equipment`, {
      headers: { Authorization: `Bearer ${token}` },
      params: year ? { year } : undefined,
    });
    return res.data.data as TfpEquipmentIndex;
  },

  async getTfpEquipmentDetail(
    moduleKey: string,
    year?: number,
    point?: TfpMeasurementPointRef,
  ): Promise<TfpEquipmentDetail> {
    const token = getStoredToken();
    if (!token) throw new Error('Belum login.');

    await ensureMaintenanceAuth();

    const params: Record<string, string | number> = {};
    if (year) params.year = year;
    if (point) {
      params.parameter_number = point.parameter_number;
      params.parameter_name = point.parameter_name;
      params.cell_key = point.cell_key;
    }

    const res = await axios.get(`${getMaintenanceApiBaseUrl()}/v1/statistics/tfp/${moduleKey}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data.data as TfpEquipmentDetail;
  },

  async getGroundCheck(year?: number): Promise<GroundCheckIndex> {
    const token = getStoredToken();
    if (!token) throw new Error('Belum login.');

    await ensureMaintenanceAuth();

    const res = await axios.get(`${getMaintenanceApiBaseUrl()}/v1/statistics/ground-check`, {
      headers: { Authorization: `Bearer ${token}` },
      params: year ? { year } : undefined,
    });
    return res.data.data as GroundCheckIndex;
  },

  async getGroundCheckDetail(
    moduleKey: string,
    year?: number,
    metricKey?: string,
  ): Promise<GroundCheckDetail> {
    const token = getStoredToken();
    if (!token) throw new Error('Belum login.');

    await ensureMaintenanceAuth();

    const params: Record<string, string | number> = {};
    if (year) params.year = year;
    if (metricKey) params.metric_key = metricKey;

    const res = await axios.get(`${getMaintenanceApiBaseUrl()}/v1/statistics/ground-check/${moduleKey}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data.data as GroundCheckDetail;
  },
};
