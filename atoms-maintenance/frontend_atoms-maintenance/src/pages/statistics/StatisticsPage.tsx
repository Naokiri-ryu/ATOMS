import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart3, ChevronRight, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { statisticsService, type TfpEquipmentIndex, type TfpEquipmentSummary } from '@/services/statisticsService';

const FIRST_YEAR = 2020;

const numberFormat = new Intl.NumberFormat('id-ID');

const formatTanggal = (iso: string | null): string => {
  if (!iso) return '\u2014';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '\u2014';
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${bulan[m - 1]} ${y}`;
};

/** Tinggi bar mini 12 bulan, relatif terhadap puncak bulan itu sendiri. */
const Sparkbars: React.FC<{ monthly: number[] }> = ({ monthly }) => {
  const peak = Math.max(...monthly, 1);
  return (
    <div className="flex items-end gap-[3px] h-8" aria-hidden>
      {monthly.map((value, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${value > 0 ? 'bg-brand-primary/70' : 'bg-slate-200'}`}
          style={{ height: value > 0 ? `${Math.max((value / peak) * 100, 12)}%` : '18%' }}
          title={`${i + 1}: ${value}`}
        />
      ))}
    </div>
  );
};

const EquipmentCard: React.FC<{
  item: TfpEquipmentSummary;
  onOpen: (moduleKey: string) => void;
}> = ({ item, onOpen }) => (
  <button
    type="button"
    onClick={() => onOpen(item.module_key)}
    className="group bg-white rounded-2xl border border-gray-200 shadow-card p-5 text-left hover:border-brand-primary/40 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900 leading-snug">{item.label}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Terakhir: {formatTanggal(item.last_date)}
        </p>
      </div>
      <ChevronRight
        size={18}
        className="shrink-0 mt-0.5 text-slate-300 transition-colors group-hover:text-brand-primary"
      />
    </div>

    <div className="mt-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-2xl font-bold font-mono text-brand-primary">
          {numberFormat.format(item.completed_records)}
        </p>
        <p className="text-xs text-slate-500">
          dari {numberFormat.format(item.total_records)} form
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold font-mono text-slate-700">{item.completion_rate}%</p>
        <p className="text-xs text-slate-400">completed</p>
      </div>
    </div>

    <div className="mt-4">
      <Sparkbars monthly={item.monthly_completed} />
      <p className="mt-1.5 text-[11px] text-slate-400">Form completed per bulan (Jan–Des)</p>
    </div>
  </button>
);

export const StatisticsPage: React.FC = () => {
  const navigate = useNavigate();
  const now = new Date();
  const yearOptions = useMemo(
    () => Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, i) => now.getFullYear() - i),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<TfpEquipmentIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchIndex = useCallback(async (targetYear: number) => {
    setIsLoading(true);
    try {
      const res = await statisticsService.getTfpEquipment(targetYear);
      setData(res);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        axios.isAxiosError(err) && err.response?.status === 401
          ? 'Sesi habis. Silakan login ulang.'
          : `Gagal memuat daftar peralatan TFP tahun ${targetYear}.`,
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIndex(year);
  }, [year, fetchIndex]);

  const equipment = data?.equipment ?? [];
  const grandTotal = equipment.reduce((sum, e) => sum + e.total_records, 0);
  const grandCompleted = equipment.reduce((sum, e) => sum + e.completed_records, 0);

  const selectClass =
    'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={BarChart3}
        iconBg="bg-brand-50"
        iconColor="text-brand-primary"
        title="Statistik"
        subtitle="Pilih peralatan untuk melihat tren nilai pengukuran per bulan"
        actions={
          <button
            type="button"
            onClick={() => void fetchIndex(year)}
            className="h-10 flex items-center gap-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-slate-600 hover:bg-gray-50 hover:text-brand-primary transition-colors shrink-0"
            aria-label="Muat ulang statistik"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : undefined} />
            <span className="hidden sm:inline">Muat Ulang</span>
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          className={selectClass}
          aria-label="Pilih tahun"
        >
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          <strong className="font-mono text-slate-600">{numberFormat.format(grandTotal)}</strong> form
          Performance Check tercatat, <strong className="font-mono text-slate-600">{numberFormat.format(grandCompleted)}</strong> completed
          pada tahun {year}.
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-7 w-20 mt-4" />
              <Skeleton className="h-8 w-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && equipment.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-card">
          <EmptyState
            icon={BarChart3}
            title="Belum ada data"
            description={`Tidak ada form Performance Check TFP pada tahun ${year}.`}
          />
        </div>
      )}

      {!isLoading && !errorMessage && equipment.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {equipment.map((item) => (
            <EquipmentCard
              key={item.module_key}
              item={item}
              onOpen={(key) => navigate(`/statistics/tfp/${key}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StatisticsPage;