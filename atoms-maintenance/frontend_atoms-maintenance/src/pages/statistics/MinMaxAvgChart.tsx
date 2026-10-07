import React, { useMemo } from 'react';
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
import { EmptyState } from '@/components/common/EmptyState';
import { formatNilai } from '@/pages/statistics/format';
import type { StatisticsSeriesPoint } from '@/services/statisticsService';

const BAND_COLOR = '#1B3A6B';
const AVG_COLOR = '#F5A623';

const numberFormat = new Intl.NumberFormat('id-ID');

interface ChartPoint extends StatisticsSeriesPoint {
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
 * Tooltip kustom supaya min & maks tampil sebagai dua angka (bukan min dan
 * lebar area hasil stacking) — bentuk tooltip bawaan hanya menampilkan nilai
 * mentahnya.
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

interface Props {
  title: string;
  subtitle: string;
  /** Meta di kanan judul, mis. label sel + jumlah pembacaan. */
  meta?: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Catatan amber di bawah grafik — mis. pembacaan yang dinormalisasi/dibuang. */
  note?: string;
  points: StatisticsSeriesPoint[];
}

/**
 * Grafik rentang min–maks + garis rata-rata, dipakai bersama oleh detail
 * Performance Check (TFP) dan detail Ground Check. Keduanyainko bulanan yang
 * sama bentuknya, jadi tabel dan tooltip-nya tinggal dipakai ulang di sini.
 */
export const MinMaxAvgChart: React.FC<Props> = ({
  title,
  subtitle,
  meta,
  emptyTitle,
  emptyDescription,
  note,
  points,
}) => {
  const chartData: ChartPoint[] = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        band: p.min !== null && p.max !== null ? Number((p.max - p.min).toFixed(2)) : null,
      })),
    [points],
  );

  const hasReadings = chartData.some((p) => p.count > 0);
  const totalSamples = chartData.reduce((sum, p) => sum + p.count, 0);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400">
          {meta ?? `${numberFormat.format(totalSamples)} pembacaan`}
        </span>
      </div>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>

      {!hasReadings ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
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
              <Tooltip content={<RangeTooltip />} cursor={{ stroke: '#CBD5E1', strokeDasharray: '3 3' }} />
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
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </p>

          {note && (
            <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              {note}
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
  );
};

export default MinMaxAvgChart;
