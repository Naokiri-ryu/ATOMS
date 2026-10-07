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

// ─── Statistik TFP per alat ───────────────────────────────────────────────
//
// Satu "titik ukur" = satu parameter pada satu panel/kolom. Nilai pengukuran
// TFP disimpan per sel (mis. "panel_rd01.value"), jadi nama parameter saja
// tidak cukup untuk mengidentifikasi satu rangkaian angka.

/** Ringkasan satu alat untuk daftar /statistics. */
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

/** Titik ukur yang tersedia untuk alat + tahun terpilih. */
export interface TfpMeasurementPoint extends TfpMeasurementPointRef {
  point_id: string;
  /** Label panel, mis. "Panel RD 01 · Nilai". */
  cell_label: string;
  unit: string | null;
  /** Jumlah pembacaan setelah nilai tidak wajar disaring. */
  samples: number;
}

/** Satu titik bulanan pada grafik. Null = tidak ada pembacaan bulan itu. */
export interface StatisticsSeriesPoint {
  month: number;
  label: string;
  count: number;
  min: number | null;
  max: number | null;
  avg: number | null;
}

export type TfpSeriesPoint = StatisticsSeriesPoint;

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

// ─── Statistik Ground Check per modul ──────────────────────────────────────
//
// Berbeda dengan TFP: hanya 2 dari 5 modul Ground Check yang menyimpan angka.
// Localizer & DVOR punya kolom decimal; ADC, VHF, dan Glide Path isinya bebas
// teks (dropdown + centang), jadi modul itu hanya punya tren kelengkapan.

/** Ringkasan satu modul Ground Check untuk daftar /statistics/ground-check. */
export interface GroundCheckModuleSummary {
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
  /** false = modul ini tidak punya nilai numerik (hanya kelengkapan). */
  has_numeric: boolean;
  metric_count: number;
}

export interface GroundCheckIndex {
  year: number;
  modules: GroundCheckModuleSummary[];
}

/** Satu kolom ukur yang bisa dipilih, mis. tx1_error atau tx1_rf_level_db. */
export interface GroundCheckMetric {
  metric_key: string;
  label: string;
  unit: string | null;
  /** Jumlah pembacaan setelah nilai sudut dinormalisasi ke rentang ±180°. */
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
  points: StatisticsSeriesPoint[];
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

export const statisticsService = {
  async getOverview(year?: number): Promise<StatisticsOverview> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    const res = await axios.get(`${API_URL}/v1/statistics/overview`, { headers: getAuthHeaders(), params });
    return res.data.data as StatisticsOverview;
  },

  async getTfpEquipment(year?: number): Promise<TfpEquipmentIndex> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    const res = await axios.get(`${API_URL}/v1/statistics/tfp/equipment`, { headers: getAuthHeaders(), params });
    return res.data.data as TfpEquipmentIndex;
  },

  async getTfpEquipmentDetail(
    moduleKey: string,
    year?: number,
    point?: TfpMeasurementPointRef,
  ): Promise<TfpEquipmentDetail> {
    const params: Record<string, string | number> = {};
    if (year) params.year = year;
    if (point) {
      params.parameter_number = point.parameter_number;
      params.parameter_name = point.parameter_name;
      params.cell_key = point.cell_key;
    }
    const res = await axios.get(`${API_URL}/v1/statistics/tfp/${moduleKey}`, { headers: getAuthHeaders(), params });
    return res.data.data as TfpEquipmentDetail;
  },

  async getGroundCheck(year?: number): Promise<GroundCheckIndex> {
    const params: Record<string, number> = {};
    if (year) params.year = year;
    const res = await axios.get(`${API_URL}/v1/statistics/ground-check`, { headers: getAuthHeaders(), params });
    return res.data.data as GroundCheckIndex;
  },

  async getGroundCheckDetail(
    moduleKey: string,
    year?: number,
    metricKey?: string,
  ): Promise<GroundCheckDetail> {
    const params: Record<string, string | number> = {};
    if (year) params.year = year;
    if (metricKey) params.metric_key = metricKey;
    const res = await axios.get(`${API_URL}/v1/statistics/ground-check/${moduleKey}`, {
      headers: getAuthHeaders(),
      params,
    });
    return res.data.data as GroundCheckDetail;
  },
};
