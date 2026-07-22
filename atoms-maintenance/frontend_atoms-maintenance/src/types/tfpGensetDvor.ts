// ─── TFP Performance Check Genset DVOR ──────────────────────────────
//
// Type definitions for the TFP Genset DVOR module.
// Cells are dynamic now: the record carries a `columns_config` defining panels
// and sub-columns; each item stores values + is_disabled_map + merge_map keyed
// by composite "panelId.subKey" (e.g. "panel_cos_a03.input").

import type { ShiftType } from '@/types';

export type TfpGensetDvorStatus = 'ongoing' | 'on_hold' | 'completed';
export type TfpGensetDvorRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpGensetDvorSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpGensetDvorTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

// ─── Dynamic columns ─────────────────────────────────────────────────────────

export interface TfpGensetDvorSubColumn {
  key: string;   // stable slug e.g. "input", "output", "bypass"
  label: string; // human label e.g. "Input"
}

export interface TfpGensetDvorPanel {
  id: string;       // stable slug e.g. "panel_cos_a03"
  label: string;    // human label e.g. "Panel COS (A 03)"
  sub_columns: TfpGensetDvorSubColumn[];
}

export type TfpGensetDvorColumnsConfig = TfpGensetDvorPanel[];

// Composite cell key shape: "panelId.subKey" (e.g. "panel_cos_a03.input")
export type TfpGensetDvorCellKey = string;

export type TfpGensetDvorStatusOperasi = 'PLN_OFF' | 'RUN_UP';
export type TfpGensetDvorStatusMasterSlave = 'Master' | 'Slave';
export type TfpGensetDvorFuelLevel = 'E' | '1/4' | '1/2' | '3/4' | 'F';

export interface TfpGensetDvorItem {
  id: number;
  parameter_number: string | null;
  /** Section heading this row belongs to (e.g. "Pengukuran Tegangan Output Genset"). Null for standalone rows. */
  group_label: string | null;
  parameter_name: string;
  unit: string | null;
  /** cellKey → value */
  values: Record<TfpGensetDvorCellKey, string>;
  /** cellKey → true if grey/disabled */
  is_disabled_map: Record<TfpGensetDvorCellKey, boolean>;
  /** cellKey → colspan (≥2 means this cell spans N cells to the right) */
  merge_map: Record<TfpGensetDvorCellKey, number>;
  sort_order: number;
}

export interface TfpGensetDvorFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpGensetDvorRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpGensetDvorStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpGensetDvorRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpGensetDvorColumnsConfig;
  status: TfpGensetDvorStatus;
  catatan: string | null;
  status_operasi: TfpGensetDvorStatusOperasi | null;
  status_master_slave: TfpGensetDvorStatusMasterSlave | null;
  fuel_level: TfpGensetDvorFuelLevel | null;
  manager: TfpGensetDvorSignerInfo | null;
  supervisor: TfpGensetDvorSignerInfo | null;
  technicians: TfpGensetDvorTechnicianRow[];
  items: TfpGensetDvorItem[];
  facilities: TfpGensetDvorFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpGensetDvorListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpGensetDvorUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpGensetDvorCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpGensetDvorFieldsPayload {
  catatan?: string | null;
  status_operasi?: TfpGensetDvorStatusOperasi | null;
  status_master_slave?: TfpGensetDvorStatusMasterSlave | null;
  fuel_level?: TfpGensetDvorFuelLevel | null;
}

export interface TfpGensetDvorSaveStructurePayload {
  columns_config: TfpGensetDvorColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpGensetDvorCellKey, boolean>;
    merge_map?: Record<TfpGensetDvorCellKey, number>;
  }>;
}