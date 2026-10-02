import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BarChart3, RefreshCw, Search } from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/common/Skeleton';
import {
  statisticsService,
  type TfpEquipmentDetail,
  type TfpMeasurementPoint,
  type TfpSeriesPoint,
} from '@/services/statisticsService';

const FIRST_YEAR = 2020;

const BAND_COLOR = '#1B3A6B';
const AVG_COLOR = '#F5A623';

const numberFormat = new Intl.NumberFormat('id-ID');

const formatTanggal = (iso: string | null): string => {
  if (!iso) return '\u2014';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '\u2014';
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${bulan[m - 1]} ${y}`;
};

/** Nilai uzup 2 desimal, atau "\u2014" untuk bulan tanpa pembacaan. */
const formatNilai = (value: number | null): string =>
  value === null ? '\u2014' : value.toLocaleString('id-ID', { maximumFractionDigits: 2 });

interface ChartPoint extends TfpSeriesPoint {
  /** max - min, ditumpuk di atas min agar area = rentang min→max. */
  band: number | null;
}

/** recharts v3 tidak lagi menerima prop `payload` pada <Legend>. */
const legendItems = [
  { color: BAND_COLOR, label: 'Rentang Min–Maks' },
  { color: AVG_COLOR, label: 'Rata-rata' },
];

interface TooltipEntry {
  payload?: ChartPoint;
}

/**
 * Tooltip kustom supaya min & maks tampil sebagai dua angka (bukan min
 * dan lebar area hasil stacking) — bentuk tooltip bawaan hanya menampilkan
 * nilai mentahnya.
 */
const RangeTooltip: React.FC<{ active?: boolean; label?: string | number; payload?: TooltipEntry[] }> = ({
  active,
  label,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const box = 'rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs shadow-md';

  if (row.count === 0) {
    return (
      <div className={box}>
        <p className="font-semibold text-slate-800">Bulan {label}</p>
        <p className="mt-0.5 text-slate-400">Tidak ada pembacaan</p>
      </div>
    );
  }

  return (
    <div className={box}>
      <p className="font-semibold text-slate-800">Bulan {label}</p>
      <dl className="mt-1.5 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5">
        <dt className="text-slate-500">Min</dt>
        <dd className="text-right font-mono text-slate-800">{formatNilai(row.min)}</dd>
        <dt className="text-slate-500">Maks</dt>
        <dd className="text-right font-mono text-slate-800">{formatNilai(row.max)}</dd>
        <dt className="text-slate-500">Rata-rata</dt>
        <dd className="text-right font-mono font-semibold text-slate-900">{formatNilai(row.avg)}</dd>
        <dt className="text-slate-500">Pembacaan</dt>
        <dd className="text-right font-mono text-slate-500">{row.count}</dd>
      </dl>
    </div>
  );
};

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
        const res = await statisticsService.getTfpEquipmentDetail(moduleKey, targetYear, point ?? undefined);
        setData(res);
        setErrorMessage(null);
      } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        setErrorMessage(
          status === 401
            ? 'Sesi habis. Silakan login ulang.'
            : status === 404
              ? 'Peralatan TFP tidak ditemukan.'
              : `Gagal memuat statistik peralatan tahun ${targetYear}.`,
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
  const selectClass =
    'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent';

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={BarChart3}
        iconBg="bg-brand-50"
        iconColor="text-brand-primary"
        title={data?.label ?? 'Statistik Peralatan'}
        subtitle={`Tren nilai pengukuran per bulan \u2014 tahun ${year}`}
        actions={
          <button
            type="button"
            onClick={() => void fetchDetail(year, selected)}
            className="h-10 flex items-center gap-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-slate-600 hover:bg-gray-50 hover:text-brand-primary transition-colors shrink-0"
            aria-label="Muat ulang statistik"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : undefined} />
            <span className="hidden sm:inline">Muat Ulang</span>
          </button>
        }
      />

      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/statistics"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-primary transition-colors"
        >
          <ArrowLeft size={15} />
          Semua Peralatan
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
            <option key={y} value={String(y)}>{y}</option>
          ))}
        </select>
        {data && (
          <span className="text-xs text-slate-400">
            <strong className="font-mono text-slate-600">{numberFormat.format(data.records_completed)}</strong> completed
            dari <strong className="font-mono text-slate-600">{numberFormat.format(data.records_total)}</strong> form
            ({data.completion_rate}%) \u00b7 {numberFormat.format(points.length)} titik ukur \u00b7 terakhir {formatTanggal(data.last_date)}
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
          <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Pilih Titik Ukur</h2>
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
                    className="h-10 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-card">
              <EmptyState
                icon={BarChart3}
                title="Pilih satu titik ukur"
                description="Pilih parameter di atas untuk melihat tren min\u2013maks dan rata-ratanya per bulan."
              />
            </div>
          )}

          {selected && series && (
            <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
                <h2 className="text-sm font-bold text-slate-900">
                  {series.parameter_name}
                  {series.unit && <span className="ml-1.5 font-normal text-slate-500">({series.unit})</span>}
                </h2>
                <span className="text-xs text-slate-400">
                  {series.cell_label} · {numberFormat.format(series.total_samples)} pembacaan
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Area = rentang nilai min–maks tiap bulan, garis = rata-rata.
              </p>

              {!hasReadings ? (
                <EmptyState
                  title="Belum ada pembacaan"
                  description={`Tidak ada nilai numerik untuk ${series.parameter_name} di ${series.cell_label} pada tahun ${year}.`}
                />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={{ stroke: '#CBD5E1' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748B' }}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        content={<RangeTooltip />}
                        cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }}
                      />
                      <Area
                        dataKey="min"
                        stackId="band"
                        stroke="none"
                        fill={BAND_COLOR}
                        fillOpacity={0}
                        isAnimationActive={false}
                        name="min"
                      />
                      <Area
                        dataKey="band"
                        stackId="band"
                        stroke={BAND_COLOR}
                        strokeWidth={1}
                        fill={BAND_COLOR}
                        fillOpacity={0.18}
                        isAnimationActive={false}
                        name="band"
                      />
                      <Line
                        dataKey="avg"
                        stroke={AVG_COLOR}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: AVG_COLOR, strokeWidth: 0 }}
                        connectNulls={false}
                        isAnimationActive={false}
                        name="Rata-rata"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  <p className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    {legendItems.map((item) => (
                      <span key={item.label} className="inline-flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: item.color }}
                        />
                        {item.label}
                      </span>
                    ))}
                  </p>

                  {series.samples_excluded > 0 && (
                    <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                      {series.samples_excluded} pembacaan di luar rentang wajar tidak dihitung agar grafik tidak
                      tertarik jauh (mis. salah ketik). Periksa kembali isian formnya.
                    </p>
                  )}

                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-y border-gray-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2.5 font-semibold">Bulan</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Min</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Maks</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Rata-rata</th>
                          <th className="px-3 py-2.5 font-semibold text-right">Pembacaan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartData.map((p) => (
                          <tr
                            key={p.month}
                            className={`border-b border-gray-100 last:border-0 ${p.count > 0 ? '' : 'text-slate-300'}`}
                          >
                            <td className="px-3 py-2 font-medium text-slate-700">{p.label}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-700">{formatNilai(p.min)}</td>
                            <td className="px-3 py-2 text-right font-mono text-slate-700">{formatNilai(p.max)}</td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                              {formatNilai(p.avg)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-slate-500">{p.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TfpEquipmentStatisticsPage;