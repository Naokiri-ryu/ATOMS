import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RefreshCw, Radar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import { MinMaxAvgChart } from '@/pages/statistics/MinMaxAvgChart';
import { BULAN_LABELS, formatTanggal } from '@/pages/statistics/format';
import { StatisticsTabs } from '@/pages/statistics/StatisticsTabs';
import { statisticsService, type GroundCheckDetail } from '@/services/statisticsService';

const FIRST_YEAR = 2020;

const numberFormat = new Intl.NumberFormat('id-ID');

/**
 * Kelengkapan per bulan untuk modul tanpa nilai ukur (ADC, VHF, Glide Path).
 * Isian form modul ini bebas teks, jadi yang bisa diringkas hanyalah jumlah
 * form per bulan dan berapa yang sudah selesai ditandatangani.
 */
const CompletionTable: React.FC<{ monthlyTotal: number[]; monthlyCompleted: number[] }> = ({
  monthlyTotal,
  monthlyCompleted,
}) => {
  const total = monthlyTotal.reduce((a, b) => a + b, 0);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
      <h2 className="text-sm font-bold text-slate-900">Kelengkapan Pengujian</h2>
      <p className="text-xs text-slate-500 mb-4">
        Modul ini tidak punya nilai numerik yang bisa diplot — yang ditampilkan adalah jumlah form per bulan dan
        berapa yang sudah selesai.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-gray-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2.5 font-semibold">Bulan</th>
              <th className="px-3 py-2.5 font-semibold text-right">Form</th>
              <th className="px-3 py-2.5 font-semibold text-right">Completed</th>
              <th className="px-3 py-2.5 font-semibold text-right">Kelengkapan</th>
            </tr>
          </thead>
          <tbody>
            {BULAN_LABELS.map((label, i) => {
              const t = monthlyTotal[i] ?? 0;
              const c = monthlyCompleted[i] ?? 0;
              return (
                <tr
                  key={label}
                  className={`border-b border-gray-100 last:border-0 ${t > 0 ? '' : 'text-slate-300'}`}
                >
                  <td className="px-3 py-2 font-medium text-slate-700">{label}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700">{t}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-700">{c}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                    {t > 0 ? `${Math.round((c / t) * 100)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-slate-50/70">
              <td className="px-3 py-2.5 font-semibold text-slate-700">Total</td>
              <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">{total}</td>
              <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">
                {monthlyCompleted.reduce((a, b) => a + b, 0)}
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">
                {total > 0 ? `${Math.round((monthlyCompleted.reduce((a, b) => a + b, 0) / total) * 100)}%` : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};

export const GroundCheckModuleStatisticsPage: React.FC = () => {
  const { moduleKey = '' } = useParams<{ moduleKey: string }>();
  const now = useMemo(() => new Date(), []);
  const yearOptions = useMemo(
    () => Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, i) => now.getFullYear() - i),
    [now],
  );

  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<GroundCheckDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [metricKey, setMetricKey] = useState<string | null>(null);

  const fetchDetail = useCallback(
    async (targetYear: number, metric: string | null) => {
      if (!moduleKey) return;
      setIsLoading(true);
      try {
        const res = await statisticsService.getGroundCheckDetail(moduleKey, targetYear, metric ?? undefined);
        setData(res);
        setErrorMessage(null);
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        setErrorMessage(
          status === 401
            ? 'Sesi habis. Silakan login ulang.'
            : status === 404
              ? 'Modul Ground Check tidak ditemukan.'
              : `Gagal memuat statistik Ground Check tahun ${targetYear}.`,
        );
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [moduleKey],
  );

  useEffect(() => {
    setMetricKey(null);
    void fetchDetail(year, null);
  }, [year, fetchDetail]);

  useEffect(() => {
    if (!metricKey) return;
    void fetchDetail(year, metricKey);
  }, [metricKey, year, fetchDetail]);

  const metrics = useMemo(() => data?.available_metrics ?? [], [data]);
  const series = data?.series;

  const note =
    series && series.normalized_samples > 0
      ? `${series.normalized_samples} pembacaan ditulis di luar rentang ±180° (mis. error DVOR di titik 360°) dan ` +
        `dibaca ulang ke nilai sebenarnya agar grafik tidak tertarik. Nilai di database tidak diubah.`
      : undefined;

  const selectClass =
    'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={Radar}
        iconBg="bg-brand-50"
        iconColor="text-brand-primary"
        title={data?.label ?? 'Statistik Ground Check'}
        subtitle={`Kelengkapan pengujian dan tren nilai per bulan — tahun ${year}`}
        actions={
          <button
            type="button"
            onClick={() => void fetchDetail(year, metricKey)}
            className="h-10 flex items-center gap-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-slate-600 hover:bg-gray-50 hover:text-brand-primary transition-colors shrink-0"
            aria-label="Muat ulang statistik"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : undefined} />
            <span className="hidden sm:inline">Muat Ulang</span>
          </button>
        }
      />

      <StatisticsTabs active="ground-check" />

      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/statistics/ground-check"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft size={15} />
          Semua Modul Ground Check
        </Link>
        {data && (
          <>
            <span className="text-slate-300">/</span>
            <Link to={data.route} className="text-slate-500 hover:text-brand-primary transition-colors">
              Halaman form
            </Link>
          </>
        )}
      </nav>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <select
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          className={selectClass}
          aria-label="Pilih tahun"
        >
          {yearOptions.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        {data && (
          <span className="text-xs text-slate-400">
            <strong className="font-mono text-slate-600">{numberFormat.format(data.records_completed)}</strong>{' '}
            completed dari <strong className="font-mono text-slate-600">{numberFormat.format(data.records_total)}</strong>{' '}
            form ({data.completion_rate}%) · terakhir {formatTanggal(data.last_date)}
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full mt-3" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      )}

      {!isLoading && !errorMessage && data && (
        <>
          {data.has_numeric ? (
            <>
              <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
                <h2 className="text-sm font-bold text-slate-900 mb-1">Pilih Nilai Ukur</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Setiap pembacaan diambil pada titik ukur yang berbeda (per bearing untuk DVOR, per jarak untuk
                  Localizer), jadi pilih kolom yang mau dilihat trendnya.
                </p>

                {metrics.length === 0 ? (
                  <EmptyState
                    title="Belum ada nilai pengukuran"
                    description={`Tidak ada pembacaan numerik pada form completed tahun ${year}.`}
                  />
                ) : (
                  <select
                    value={metricKey ?? ''}
                    onChange={(e) => setMetricKey(e.target.value || null)}
                    className={`${selectClass} w-full`}
                    aria-label="Pilih nilai ukur"
                  >
                    <option value="">Pilih nilai ukur…</option>
                    {metrics.map((m) => (
                      <option key={m.metric_key} value={m.metric_key}>
                        {`${m.label}${m.unit ? ` (${m.unit})` : ''} — ${numberFormat.format(m.samples)} pembacaan`}
                      </option>
                    ))}
                  </select>
                )}
              </section>

              {series && metricKey && (
                <MinMaxAvgChart
                  title={`${series.label ?? ''}${series.unit ? ` (${series.unit})` : ''}`}
                  subtitle="Area = rentang nilai min–maks tiap bulan, garis = rata-rata."
                  meta={`${numberFormat.format(series.total_samples)} pembacaan`}
                  note={note}
                  points={series.points}
                  emptyTitle="Belum ada pembacaan"
                  emptyDescription={`Tidak ada nilai untuk ${series.label} pada tahun ${year}.`}
                />
              )}

              {metrics.length > 0 && !metricKey && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-card">
                  <EmptyState
                    icon={Radar}
                    title="Pilih satu nilai ukur"
                    description="Pilih kolom di atas untuk melihat tren min–maks dan rata-ratanya per bulan."
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <CompletionTable
                monthlyTotal={data.monthly_total}
                monthlyCompleted={data.monthly_completed}
              />
              <div className="bg-white rounded-2xl border border-gray-200 shadow-card">
                <EmptyState
                  title="Modul tanpa nilai numerik"
                  description="Isian form modul ini berupa pilihan dan centang, bukan angka, jadi tidak ada grafik nilai yang bisa ditampilkan."
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default GroundCheckModuleStatisticsPage;
