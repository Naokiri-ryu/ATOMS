import { API_URL_PROD } from "@/config";
import axios from "axios";
import type { ShiftType } from "@/types";
import type { CnsdTransmitterMeterRecordDetail, CnsdTransmitterMeterRecordSummary } from "@/types/cnsdTransmitter";

const API_URL = API_URL_PROD || import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeaders() {
  const token = sessionStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

interface PaginatedApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CnsdTransmitterMeterListParams {
  search?: string;
  date?: string;
  year?: string | number;
  shift_type?: ShiftType;
  status?: string;
  sort_by?: string;
  sort_dir?: "asc" | "desc";
  per_page?: number;
}

export const TRANSMITTER_FORM_TYPE = "TRANSMITTER-METER";
export const ER_TRANSMITTER_FORM_TYPE = "TRANSMITTER-ER";
export const TRANSMITTER_ROUTE = "/cnsd/transmitter-meter";
export const ER_TRANSMITTER_ROUTE = "/cnsd/transmitter-er-meter";

export function getTransmitterMeterConfig(pathname: string) {
  const isEr = pathname.startsWith(ER_TRANSMITTER_ROUTE);
  return {
    formType: isEr ? ER_TRANSMITTER_FORM_TYPE : TRANSMITTER_FORM_TYPE,
    basePath: isEr ? ER_TRANSMITTER_ROUTE : TRANSMITTER_ROUTE,
    title: isEr ? "Meter Reading VHF ER Gedung Radar" : "Meter Reading Transmitter",
    subtitle: isEr ? "CNSD Equipment Readiness — VHF ER Gedung Radar (FORM C-1)" : "CNSD Equipment Readiness — Transmitter / TX Radio (FORM C-1)",
  };
}

export interface CnsdTransmitterMeterUpdatePayload {
  items: Array<{
    id: number;
    status_value?: string | null;
    power_output?: string | null;
    modulasi?: string | null;
    keterangan?: string | null;
    hasil?: string | null;
  }>;
}

export type CnsdTransmitterMeterRoleKey = "manager" | "supervisor" | "technician";

export const cnsdTransmitterMeterService = {
  async listRecords(params: CnsdTransmitterMeterListParams = {}, formType = TRANSMITTER_FORM_TYPE): Promise<PaginatedApiResponse<CnsdTransmitterMeterRecordSummary>> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter`, {
      headers: getAuthHeaders(),
      params: { per_page: 100, form_type: formType, ...params },
    });
    return response.data.data;
  },

  async getRecord(id: number, formType = TRANSMITTER_FORM_TYPE): Promise<CnsdTransmitterMeterRecordDetail> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter/${id}`, {
      headers: getAuthHeaders(),
      params: { form_type: formType },
    });
    return response.data.data;
  },

  async getTemplate(): Promise<unknown> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter/template`, {
      headers: getAuthHeaders(),
    });
    return response.data.data;
  },

  async getYears(formType = TRANSMITTER_FORM_TYPE): Promise<number[]> {
    const response = await axios.get(`${API_URL}/v1/cnsd/transmitter-meter/years`, {
      headers: getAuthHeaders(),
      params: { form_type: formType },
    });
    return response.data.data as number[];
  },

  async createRecord(
    payload: {
      date: string;
      shift_type: ShiftType;
      form_type?: string;
      facility?: string;
      form_code?: string;
      location?: string;
    },
    formType = TRANSMITTER_FORM_TYPE,
  ): Promise<CnsdTransmitterMeterRecordDetail> {
    const response = await axios.post(
      `${API_URL}/v1/cnsd/transmitter-meter`,
      { ...payload, form_type: formType },
      {
        headers: getAuthHeaders(),
      },
    );
    return response.data.data;
  },

  async updateRecord(id: number, payload: CnsdTransmitterMeterUpdatePayload, formType = TRANSMITTER_FORM_TYPE): Promise<CnsdTransmitterMeterRecordDetail> {
    const response = await axios.put(`${API_URL}/v1/cnsd/transmitter-meter/${id}`, payload, {
      headers: getAuthHeaders(),
      params: { form_type: formType },
    });
    return response.data.data;
  },

  async signRecord(
    id: number,
    role: CnsdTransmitterMeterRoleKey,
    signature: string,
    technicianRowId?: number,
    formType = TRANSMITTER_FORM_TYPE,
  ): Promise<{ signed_role: CnsdTransmitterMeterRoleKey; record: CnsdTransmitterMeterRecordDetail }> {
    const body: Record<string, unknown> = { role, signature };
    if (technicianRowId) body.technician_row_id = technicianRowId;

    const response = await axios.post(`${API_URL}/v1/cnsd/transmitter-meter/${id}/sign`, body, {
      headers: getAuthHeaders(),
      params: { form_type: formType },
    });
    return response.data.data;
  },

  async deleteRecord(id: number, _formType = TRANSMITTER_FORM_TYPE): Promise<void> {
    await axios.delete(`${API_URL}/v1/cnsd/transmitter-meter/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
