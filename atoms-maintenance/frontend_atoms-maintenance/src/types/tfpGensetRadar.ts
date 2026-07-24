import type { ShiftType } from '@/types';

export type TfpGensetRadarStatus = 'ongoing' | 'on_hold' | 'completed';
export type TfpGensetRadarRoleKey = 'manager' | 'supervisor' | 'technician';

export interface TfpGensetRadarSignerInfo {
  id?: number | null;
  name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
}

export interface TfpGensetRadarTechnicianRow {
  id: number;
  technician_id: number | null;
  technician_name: string;
  signature: string | null;
  signed_by: number | null;
  signed_at: string | null;
  sort_order: number;
}

export interface TfpGensetRadarSubColumn {
  key: string;
  label: string;
}

export interface TfpGensetRadarPanel {
  id: string;
  label: string;
  sub_columns: TfpGensetRadarSubColumn[];
}

export type TfpGensetRadarColumnsConfig = TfpGensetRadarPanel[];
export type TfpGensetRadarCellKey = string;

export type TfpGensetRadarStatusOperasi = 'PLN_OFF' | 'RUN_UP';
export type TfpGensetRadarStatusMasterSlave = 'Master' | 'Slave';
export type TfpGensetRadarFuelLevel = 'E' | '1/4' | '1/2' | '3/4' | 'F';

export interface TfpGensetRadarItem {
  id: number;
  parameter_number: string | null;
  group_label: string | null;
  parameter_name: string;
  unit: string | null;
  values: Record<TfpGensetRadarCellKey, string>;
  is_disabled_map: Record<TfpGensetRadarCellKey, boolean>;
  merge_map: Record<TfpGensetRadarCellKey, number>;
  sort_order: number;
}

export interface TfpGensetRadarFacility {
  id: number;
  facility_name: string;
  kondisi: string | null;
  keterangan: string | null;
  sort_order: number;
}

export interface TfpGensetRadarRecordSummary {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  status: TfpGensetRadarStatus;
  manager_name: string | null;
  supervisor_name: string | null;
  technicians_count: number;
  technician_names: string[];
  created_at?: string;
}

export interface TfpGensetRadarRecordDetail {
  id: number;
  form_number: string;
  form_type: string;
  date: string;
  day_name: string | null;
  time_filled: string | null;
  shift_type: ShiftType;
  location: string;
  columns_config: TfpGensetRadarColumnsConfig;
  status: TfpGensetRadarStatus;
  catatan: string | null;
  status_operasi: TfpGensetRadarStatusOperasi | null;
  status_master_slave: TfpGensetRadarStatusMasterSlave | null;
  fuel_level: TfpGensetRadarFuelLevel | null;
  engine: string | null;
  alternator: string | null;
  kapasitas: string | null;
  manager: TfpGensetRadarSignerInfo | null;
  supervisor: TfpGensetRadarSignerInfo | null;
  technicians: TfpGensetRadarTechnicianRow[];
  items: TfpGensetRadarItem[];
  facilities: TfpGensetRadarFacility[];
  created_by: { id: number; name: string } | null;
  created_at?: string;
  updated_at?: string;
}

export interface TfpGensetRadarListParams {
  date?: string;
  year?: string;
  shift_type?: string;
  status?: string;
  search?: string;
  per_page?: number;
}

export interface TfpGensetRadarUpdatePayload {
  time_filled?: string | null;
  items: Array<{
    id: number;
    values?: Record<TfpGensetRadarCellKey, string | null>;
  }>;
  facilities?: Array<{
    id: number;
    kondisi?: string | null;
    keterangan?: string | null;
  }>;
}

export interface TfpGensetRadarFieldsPayload {
  catatan?: string | null;
  status_operasi?: TfpGensetRadarStatusOperasi | null;
  status_master_slave?: TfpGensetRadarStatusMasterSlave | null;
  fuel_level?: TfpGensetRadarFuelLevel | null;
  engine?: string | null;
  alternator?: string | null;
  kapasitas?: string | null;
}

export interface TfpGensetRadarSaveStructurePayload {
  columns_config: TfpGensetRadarColumnsConfig;
  items: Array<{
    id: number;
    is_disabled_map?: Record<TfpGensetRadarCellKey, boolean>;
    merge_map?: Record<TfpGensetRadarCellKey, number>;
  }>;
}
