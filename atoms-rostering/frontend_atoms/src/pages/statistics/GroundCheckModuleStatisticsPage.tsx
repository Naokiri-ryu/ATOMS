import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { PageHeader } from '../../components';
import {
  maintenanceStatisticsService,
  type GroundCheckDetail,
} from '../../services/maintenanceStatisticsService';
import { buildMaintenanceUrl } from '../../utils/redirectMaintenance';
import { EmptyState, Skeleton } from './parts';
import { CompletionChart, MinMaxAvgChart, formatTanggal } from './chartParts';

const FIRST_YEAR = 2020;

const numberFormat = new Intl.NumberFormat('id-ID');

const selectClass =
  'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent min-w-0';

/**
 * Detail satu modul Ground Check. Localizer & DVOR punya nilai ukur sehingga
 * grafik min–maks–rata-rata; ADC, VHF, dan Glide Check hanya menampilkan
 * kelengkapan pengujian per bulan.
 */
const GroundCheckModuleStatisticsPage: React.FC = () => {
  const { moduleKey = '' } = useParams<{ moduleKey: string }>();
  const now = new Date();
  const yearOptions = useMemo(
    () => Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, i) => now.getFullYear() - i),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
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
        const res = await maintenanceStatisticsService.getGroundCheckDetail(
          moduleKey,
          targetYear,
          metric ?? undefined,
        );
        setData(res);
        setErrorMessage(null);
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        setErrorMessage(
          status === 401
            ? 'Sesi habis atau akses ditolak. Silakan login ulang.'
            : status === 404
              ? 'Modul Ground Check tidak ditemukan.'
              : `Gagal memuat statistik Ground Check tahun ${targetYear}. Pastikan aplikasi Maintenance aktif.`,
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
      ? `${series.normalized_samples} pembacaan ditulis di luar rentang \u00b1180\u00b0 (mis. error DVOR di titik 360\u00b0) ` +
        `dan dibaca ulang ke nilai sebenarnya agar grafik tidak tertarik. Nilai di database tidak diubah.`
      : undefined;

  return (
    <PageHeader
      title={data?.label ?? 'Statistik Ground Check'}
      subtitle={`Kelengkapan pengujian dan tren nilai per bulan \u2014 tahun ${year}`}
    >
      <nav
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 flex gap-1.5"
        aria-label="Sub-menu statistik"
      >
        <Link
          to="/statistics/performance-check"
          className="flex-1 h-10 flex items-center justify-center rounded-lg text-sm font-semibold text-slate-600 hover:bg-navy-50 hover:text-navy-700 transition-colors"
        >
          Performance Check
        </Link>
        <span className="flex-1 h-10 flex items-center justify-center rounded-lg text-sm font-semibold bg-navy-700 text-white shadow-sm">
          Ground Check
        </span>
      </nav>

      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/statistics/ground-check"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-navy-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Semua Modul Ground Check
        </Link>
        {data && (
          <>
            <span className="text-slate-300">/</span>
            <a
              href={buildMaintenanceUrl(data.route)}
              className="text-slate-500 hover:text-navy-700 transition-colors"
            >
              Halaman form
            </a>
          </>
        )}
      </nav>

      <div className="flex flex-wrap items-center gap-3">
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
        <button
          type="button"
          onClick={() => void fetchDetail(year, metricKey)}
          className="h-10 flex items-center gap-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-slate-600 hover:bg-navy-50 hover:text-navy-700 transition-colors shrink-0"
          aria-label="Muat ulang statistik"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : undefined} />
          <span className="hidden sm:inline">Muat Ulang</span>
        </button>
        {data && (
          <span className="text-xs text-slate-400 ml-1">
            <strong className="font-mono text-slate-600">{numberFormat.format(data.records_completed)}</strong> completed
            dari <strong className="font-mono text-slate-600">{numberFormat.format(data.records_total)}</strong> form
            ({data.completion_rate}%) &middot; terakhir {formatTanggal(data.last_date)}
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
          <div className="bg-white border border-slate-200 shadow-card rounded-xl p-5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full mt-3" />
          </div>
          <div className="bg-white border border-slate-200 shadow-card rounded-xl p-5">
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      )}

      {!isLoading && !errorMessage && data && (
        <>
          {data.has_numeric ? (
            <>
              <section className="bg-white border border-slate-200 shadow-card rounded-xl p-5">
                <h2 className="text-sm font-bold text-navy-900 mb-1">Pilih Nilai Ukur</h2>
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
                    <option value="">Pilih nilai ukur&hellip;</option>
                    {metrics.map((m) => (
                      <option key={m.metric_key} value={m.metric_key}>
                        {`${m.label}${m.unit ? ` (${m.unit})` : ''} \u2014 ${numberFormat.format(m.samples)} pembacaan`}
                      </option>
                    ))}
                  </select>
                )}
              </section>

              {series && metricKey && (
                <MinMaxAvgChart
                  title={`${series.label ?? ''}${series.unit ? ` (${series.unit})` : ''}`}
                  subtitle="Area = rentang nilai min\u2013maks tiap bulan, garis = rata-rata."
                  meta={`${numberFormat.format(series.total_samples)} pembacaan`}
                  note={note}
                  points={series.points}
                  emptyTitle="Belum ada pembacaan"
                  emptyDescription={`Tidak ada nilai untuk ${series.label} pada tahun ${year}.`}
                />
              )}

              {metrics.length > 0 && !metricKey && (
                <div className="bg-white border border-slate-200 shadow-card rounded-xl">
                  <EmptyState
                    title="Pilih satu nilai ukur"
                    description="Pilih kolom di atas untuk melihat tren min\u2013maks dan rata-ratanya per bulan."
                  />
                </div>
              )}
            </>
          ) : (
            <CompletionChart monthlyTotal={data.monthly_total} monthlyCompleted={data.monthly_completed} />
          )}
        </>
      )}
    </PageHeader>
  );
};

export default GroundCheckModuleStatisticsPage;
