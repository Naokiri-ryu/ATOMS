import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Radio, Gauge, CircleAlert } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { PageHeader } from '@/components/common/PageHeader';
import { Skeleton } from '@/components/common/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { branchOfficeService } from '@/services/branchOfficeService';
import type {
  BranchModuleCatalog,
  BranchModuleOption,
  BranchModuleType,
  BranchModuleUpdatePayload,
  BranchOfficeDetail,
} from '@/types/branch';

const EDIT_ROLES = ['Admin', 'Manager Teknik'];

interface FamilyConfig {
  type: BranchModuleType;
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  emptyGroup: string;
}

const FAMILIES: FamilyConfig[] = [
  {
    type: 'cnsd',
    title: 'Modul CNSD',
    icon: Radio,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-700',
    emptyGroup: 'Belum ada modul CNSD.',
  },
  {
    type: 'tfp',
    title: 'Modul TFP',
    icon: Gauge,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    emptyGroup: 'Belum ada modul TFP.',
  },
];

/**
 * /branches/:id — Kantor Cabang detail.
 *
 * Toggles which CNSD / TFP modules are available for this branch. Read-only
 * for every role; saving is limited to Admin + Manager Teknik.
 */
export const BranchOfficeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const branchId = Number(id);
  const canEdit = !!user?.role && EDIT_ROLES.includes(user.role);

  const [office, setOffice] = useState<BranchOfficeDetail | null>(null);
  const [catalog, setCatalog] = useState<BranchModuleCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // key → is_available (the working copy being edited)
  const [draft, setDraft] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!Number.isFinite(branchId)) return;

    setIsLoading(true);
    try {
      const [detail, moduleCatalog] = await Promise.all([
        branchOfficeService.getOffice(branchId),
        branchOfficeService.getModuleCatalog(),
      ]);

      setOffice(detail);
      setCatalog(moduleCatalog);
      setDraft(buildDraft(detail));
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        axios.isAxiosError(err) && err.response?.status === 404
          ? 'Kantor cabang tidak ditemukan.'
          : 'Gagal memuat detail kantor cabang.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const dirty = useMemo(() => {
    if (!office) return false;
    const persisted: Record<string, boolean> = buildDraft(office);
    return Object.keys(draft).some((key) => draft[key] !== persisted[key]);
  }, [draft, office]);

  const enabledCount = (type: BranchModuleType) =>
    catalog
      ? catalog[type].filter((option) => draft[option.key]).length
      : 0;

  const toggle = (key: string) => {
    if (!canEdit) return;
    setSuccessMessage(null);
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!catalog || !office) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      const modules: BranchModuleUpdatePayload[] = FAMILIES.flatMap(({ type }) =>
        catalog[type].map((option) => ({
          type,
          key: option.key,
          is_available: draft[option.key] ?? false,
        }))
      );

      const updated = await branchOfficeService.updateModules(office.id, { modules });
      setOffice(updated);
      setDraft(buildDraft(updated));
      setSuccessMessage('Ketersediaan modul berhasil disimpan.');
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err) {
      setErrorMessage(
        axios.isAxiosError(err) && err.response?.status === 422
          ? 'Ada modul yang tidak valid. Muat ulang halaman lalu coba lagi.'
          : 'Gagal menyimpan ketersediaan modul.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!office || !catalog) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Button variant="outline" onClick={() => navigate('/branches')} className="gap-2">
          <ArrowLeft size={16} /> Kembali
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2" role="alert">
          <CircleAlert size={16} /> {errorMessage ?? 'Kantor cabang tidak ditemukan.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-fade-in">
      <Link to="/branches" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-primary transition-colors">
        <ArrowLeft size={15} /> Kantor Cabang
      </Link>

      <PageHeader
        icon={FAMILIES[0].icon}
        iconBg={FAMILIES[0].iconBg}
        iconColor={FAMILIES[0].iconColor}
        title={office.name}
        subtitle={`Kode ${office.code} · ${office.is_active ? 'Aktif' : 'Nonaktif'}`}
        actions={
          canEdit && (
            <Button onClick={handleSave} isLoading={isSaving} disabled={!dirty} className="gap-2">
              <Save size={16} /> Simpan
            </Button>
          )
        }
      />

      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Mode baca saja. Pengubahan ketersediaan modul hanya dapat dilakukan oleh Admin atau Manager Teknik.
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
          {successMessage}
        </div>
      )}

      {FAMILIES.map(({ type, title, icon: Icon, iconBg, iconColor, emptyGroup }) => (
        <section key={type} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <header className="px-5 py-3 flex items-center justify-between gap-3 border-b border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${iconBg}`}>
                <Icon size={18} className={iconColor} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500">{catalog[type].length} modul</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-500 shrink-0">
              {enabledCount(type)} / {catalog[type].length} aktif
            </span>
          </header>

          {catalog[type].length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-slate-400 italic">{emptyGroup}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {groupBy(catalog[type]).map(([group, options]) => (
                <li key={group}>
                  <p className="px-5 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group}</p>
                  <ul className="divide-y divide-slate-50">
                    {options.map((option) => (
                      <ModuleRow
                        key={option.key}
                        option={option}
                        checked={!!draft[option.key]}
                        disabled={!canEdit}
                        onToggle={() => toggle(option.key)}
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {canEdit && dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={handleSave} isLoading={isSaving} className="gap-2 shadow-lg">
            <Save size={16} /> Simpan Perubahan
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Working copy of persisted availability, keyed by module key. */
function buildDraft(office: BranchOfficeDetail): Record<string, boolean> {
  return {
    ...Object.fromEntries(office.modules.cnsd.map((m) => [m.key, m.is_available])),
    ...Object.fromEntries(office.modules.tfp.map((m) => [m.key, m.is_available])),
  };
}

function groupBy(options: BranchModuleOption[]): [string, BranchModuleOption[]][] {
  const map = new Map<string, BranchModuleOption[]>();
  for (const option of options) {
    const list = map.get(option.group) ?? [];
    list.push(option);
    map.set(option.group, list);
  }
  return Array.from(map.entries());
}

// ─── Row ──────────────────────────────────────────────────────────────────

interface ModuleRowProps {
  option: BranchModuleOption;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

const ModuleRow: React.FC<ModuleRowProps> = ({ option, checked, disabled, onToggle }) => (
  <li>
    <label
      className={`flex items-center justify-between gap-4 px-5 py-3 transition-colors ${
        disabled ? 'cursor-default' : 'cursor-pointer hover:bg-slate-50'
      }`}
    >
      <span className="min-w-0">
        <span className={`block text-sm ${checked ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
          {option.label}
        </span>
        <span className="block font-mono text-[11px] text-slate-400">{option.key}</span>
      </span>

      <span className="relative inline-flex items-center shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onToggle}
          className="peer h-5 w-9 appearance-none rounded-full bg-gray-200 transition-colors checked:bg-brand-primary disabled:opacity-60"
        />
        <span className="pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  </li>
);