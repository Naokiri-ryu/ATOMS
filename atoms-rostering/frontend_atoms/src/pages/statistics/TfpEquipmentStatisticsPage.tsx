import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { PageHeader } from '../../components';
import {
  maintenanceStatisticsService,
  type TfpEquipmentDetail,
  type TfpMeasurementPoint,
} from '../../services/maintenanceStatisticsService';
import { buildMaintenanceUrl } from '../../utils/redirectMaintenance';
import { EmptyState, Skeleton } from './parts';
import { MinMaxAvgChart, formatTanggal } from './chartParts';

const FIRST_YEAR = 2020;

const numberFormat = new Intl.NumberFormat('id-ID');

const selectClass =
  'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent min-w-0';

export const TfpEquipmentStatisticsPage: React.FC = () => {
  const { moduleKey = '' } = useParams<{ moduleKey: string }>();
  const now = new Date();
  const yearOptions = useMemo(
    () => Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, i) => now.getFullYear() - i),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<TfpEquipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Titik ukur terpilih, disimpan sebagai pointer lengkap (nomor + nama + sel).
  const [selected, setSelected] = useState<TfpMeasurementPoint | null>(null);
  const [search, setSearch] = useState('');

  /** Muat ringkasan + (opsional) seri untuk titik ukur terpilih. */
  const fetchDetail = useCallback(
    async (targetYear: number, point: TfpMeasurementPoint | null) => {
      if (!moduleKey) return;
      setIsLoading(true);
      try {
        const res = await maintenanceStatisticsService.getTfpEquipmentDetail(
          moduleKey,
          targetYear,
          point ?? undefined,
        );
        setData(res);
        setErrorMessage(null);
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        setErrorMessage(
          status === 401
            ? 'Sesi habis atau akses ditolak. Silakan login ulang.'
            : status === 404
              ? 'Peralatan TFP tidak ditemukan.'
              : `Gagal memuat statistik peralatan tahun ${targetYear}. Pastikan aplikasi Maintenance aktif.`,
        );
        setData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [moduleKey],
  );

  // Muat ringkasan saat modul / tahun berubah; titik ukur ikut di-reset.
  useEffect(() => {
    setSelected(null);
    void fetchDetail(year, null);
  }, [year, fetchDetail]);

  // Muat seri saat titik ukur diganti (tahun & modul tidak berubah).
  useEffect(() => {
    if (!selected) return;
    void fetchDetail(year, selected);
  }, [selected, year, fetchDetail]);

  const points = useMemo(() => data?.available_points ?? [], [data]);

  /** Opsi dropdown dikelompokkan per panel, mengikuti urutan form kertas. */
  const grouped = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = needle
      ? points.filter(
          (p) =>
            p.parameter_name.toLowerCase().includes(needle) ||
            p.cell_label.toLowerCase().includes(needle) ||
            (p.unit ?? '').toLowerCase().includes(needle) ||
            p.parameter_number.toLowerCase() === needle,
        )
      : points;

    const map = new Map<string, TfpMeasurementPoint[]>();
    filtered.forEach((p) => {
      const list = map.get(p.cell_label) ?? [];
      list.push(p);
      map.set(p.cell_label, list);
    });
    return [...map.entries()];
  }, [points, search]);

  const selectedId = selected
    ? `${selected.parameter_number}|${selected.parameter_name}|${selected.cell_key}`
    : '';

  const chartData: ChartPoint[] = useMemo(
    () =>
      (data?.series.points ?? []).map((p) => ({
        ...p,
        band: p.min !== null && p.max !== null ? Number((p.max - p.min).toFixed(2)) : null,
      })),
    [data],
  );

  const hasReadings = chartData.some((p) => p.count > 0);
  const series = data?.series;

  return (
    <PageHeader
      title={data?.label ?? 'Statistik Peralatan'}
      subtitle={`Tren nilai pengukuran per bulan — tahun ${year}`}
    >
      <div className="flex flex-wrap items-center gap-2">
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
          onClick={() => void fetchDetail(year, selected)}
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
            ({data.completion_rate}%) · {numberFormat.format(points.length)} titik ukur · terakhir {formatTanggal(data.last_date)}
          </span>
        )}
      </div>

      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/statistics/performance-check"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-navy-700 transition-colors"
        >
          <ArrowLeft size={15} />
          Semua Peralatan Performance Check
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
          <section className="bg-white border border-slate-200 shadow-card rounded-xl p-5">
            <h2 className="text-sm font-bold text-navy-900 mb-1">Pilih Titik Ukur</h2>
            <p className="text-xs text-slate-500 mb-4">
              Setiap nilai diukur pada satu panel/kolom tertentu, jadi pilih kombinasi parameter + panel yang mau dilihat.
            </p>

            {points.length === 0 ? (
              <EmptyState
                title="Belum ada nilai pengukuran"
                description={`Tidak ada pembacaan numerik pada form completed tahun ${year}.`}
              />
            ) : (
              <>
                <div className="relative mb-3">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari parameter atau panel…"
                    className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent"
                    aria-label="Cari titik ukur"
                  />
                </div>

                <select
                  value={selectedId}
                  onChange={(e) => {
                    const found = points.find(
                      (p) => `${p.parameter_number}|${p.parameter_name}|${p.cell_key}` === e.target.value,
                    );
                    setSelected(found ?? null);
                  }}
                  className={`${selectClass} w-full`}
                  size={Math.min(Math.max(grouped.length, 1), 10)}
                  aria-label="Pilih titik ukur"
                >
                  {grouped.length === 0 ? (
                    <option value="">Tidak ada yang cocok</option>
                  ) : (
                    grouped.map(([cellLabel, list]) => (
                      <optgroup key={cellLabel} label={`${cellLabel} (${list.length})`}>
                        {list.map((p) => (
                          <option
                            key={`${p.parameter_number}|${p.parameter_name}|${p.cell_key}`}
                            value={`${p.parameter_number}|${p.parameter_name}|${p.cell_key}`}
                          >
                            {`#${p.parameter_number} ${p.parameter_name}${p.unit ? ` (${p.unit})` : ''}`}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
                <p className="mt-2 text-xs text-slate-400">
                  {grouped.reduce((sum, [, list]) => sum + list.length, 0)} dari {points.length} titik ukur ditampilkan.
                </p>
              </>
            )}
          </section>

          {!selected && points.length > 0 && (
            <div className="bg-white border border-slate-200 shadow-card rounded-xl">
              <EmptyState
                title="Pilih satu titik ukur"
                description="Pilih parameter di atas untuk melihat tren min–maks dan rata-ratanya per bulan."
              />
            </div>
          )}

          {selected && series && (
            <MinMaxAvgChart
              title={`${series.parameter_name ?? ''}${series.unit ? ` (${series.unit})` : ''}`}
              subtitle="Area = rentang nilai min–maks tiap bulan, garis = rata-rata."
              meta={`${series.cell_label} · ${numberFormat.format(series.total_samples)} pembacaan`}
              note={
                series.samples_excluded > 0
                  ? `${series.samples_excluded} pembacaan di luar rentang wajar tidak dihitung agar grafik tidak ` +
                    `terarik jauh (mis. salah ketik). Periksa kembali isian formnya.`
                  : undefined
              }
              points={series.points}
              emptyTitle="Belum ada pembacaan"
              emptyDescription={`Tidak ada nilai numerik untuk ${series.parameter_name} di ${series.cell_label} pada tahun ${year}.`}
            />
          )}
        </>
      )}
    </PageHeader>
  );
};

export default TfpEquipmentStatisticsPage;
