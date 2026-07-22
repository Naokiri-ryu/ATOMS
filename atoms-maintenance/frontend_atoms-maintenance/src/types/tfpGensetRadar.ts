export interface TfpGensetRadarRecord {
  id: number;
  form_number: string;
  tanggal: string;
  shift: 'P' | 'S' | 'M';
  jam: string;
  engine: string;
  alternator: string;
  kapasitas: string;
  status_operasi: 'PLN OFF' | 'RUN UP' | null;
  status_master_slave: 'Master' | 'Slave' | null;
  status: 'draft' | 'completed';
  manager_teknik?: { id: number; name: string };
  supervisor?: { id: number; name: string };
  technicians: Array<{ id: number; technician_name: string }>;
  created_at: string;
  updated_at: string;
}

export interface TfpGensetRadarItem {
  id: number;
  record_id: number;
  nomor: number;
  uraian_pekerjaan: string;
  kondisi_baik: boolean;
  kondisi_tidak_baik: boolean;
  keterangan: string;
  satuan?: string;
  nilai?: string;
}

export interface TfpGensetRadarRecordDetail extends TfpGensetRadarRecord {
  items: TfpGensetRadarItem[];
}
