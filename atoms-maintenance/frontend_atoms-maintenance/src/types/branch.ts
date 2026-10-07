/**
 * Type definitions for the Branch Office (Kantor Cabang) module.
 *
 * A branch office owns its own catalog of available CNSD / TFP modules.
 * The module keys are resolved from the backend's DashboardModuleRegistry —
 * never hardcoded here — so the backend returns each option with its label,
 * group and frontend route.
 */

export type BranchModuleType = 'cnsd' | 'tfp';

/** One configurable module, as returned by GET /branches/module-catalog. */
export interface BranchModuleOption {
  key: string;
  label: string;
  group: string;
  route: string;
}

export interface BranchModuleRow {
  key: string;
  is_available: boolean;
}

export interface BranchOfficeSummary {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  cnsd_available_count: number;
  tfp_available_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface BranchOfficeDetail extends BranchOfficeSummary {
  modules: {
    cnsd: BranchModuleRow[];
    tfp: BranchModuleRow[];
  };
}

export interface BranchModuleCatalog {
  cnsd: BranchModuleOption[];
  tfp: BranchModuleOption[];
}

export interface BranchOfficeCreatePayload {
  code: string;
  name: string;
  is_active?: boolean;
}

export interface BranchOfficeUpdatePayload {
  code: string;
  name: string;
  is_active?: boolean;
}

export interface BranchModuleUpdatePayload {
  type: BranchModuleType;
  key: string;
  is_available: boolean;
}

export interface BranchModulesUpdatePayload {
  modules: BranchModuleUpdatePayload[];
}