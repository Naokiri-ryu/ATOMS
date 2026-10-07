/**
 * Grafik rentang min–maks + garis rata-rata, dipakai bersama oleh detail
 * Performance Check (TFP) dan detail Ground Check. Keduanya memakai titik
 * bulanan dengan bentuk yang sama, jadi tooltip, legenda, dan tabelnya tinggal
 * dipakai ulang di sini.
 *
 * Warna mengikuti token rostering: navy-700 untuk rentang, accent-500 untuk
 * rata-rata — bukan `brand-*` seperti di maintenance.
 */

import React, { useMemo } from 'react';
import {
  Area,
  Bar as RBar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState } from './parts';
import type { TfpSeriesPoint } from '../../services/maintenanceStatisticsService';

const BAND_COLOR = '#222E6A'; // navy-700
const AVG_COLOR = '#F5A623'; // accent-500
const TOTAL_BAR = '#E2E8F0';
const DONE_BAR = '#222E6A';

const numberFormat = new Intl.NumberFormat('id-ID');

export const formatNilai = (value: number | null): string =>
  value === null ? '\u2014' : value.toLocaleString('id-ID', { maximumFractionDigits: 2 });

export const formatTanggal = (iso: string | null): string => {
  if (!iso) return '\u2014';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '\u2014';
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d} ${bulan[m - 1]} ${y}`;
};

interface ChartPoint extends TfpSeriesPoint {
  /** max - min, ditumpuk di atas min agar area = rentang min→max. */
  band: number | null;
}

const legendItems = [
  { color: BAND_COLOR, label: 'Rentang Min\u2013Maks' },
  { color: AVG_COLOR, label: 'Rata-rata' },
];

interface TooltipEntry {
  payload?: ChartPoint;
}

const RangeTooltip: React.FC<{ active?: boolean; label?: string | number; payload?: TooltipEntry[] }> = ({
  active,
  label,
  payload,
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const box = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md';

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

interface RangeProps {
  title: string;
  subtitle: string;
  /** Meta di kanan judul, mis. label sel + jumlah pembacaan. */
  meta?: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Catatan amber di bawah grafik — mis. pembacaan yang dinormalisasi/dibuang. */
  note?: string;
  points: TfpSeriesPoint[];
}

export const MinMaxAvgChart: React.FC<RangeProps> = ({
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
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400">{meta ?? `${numberFormat.format(totalSamples)} pembacaan`}</span>
      </div>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>

      {!hasReadings ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
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

          <SeriesTable rows={chartData} />
        </>
      )}
    </section>
  );
};

export const SeriesTable: React.FC<{ rows: ChartPoint[] }> = ({ rows }) => (
  <div className="mt-5 overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <th className="px-3 py-2.5 font-semibold">Bulan</th>
          <th className="px-3 py-2.5 font-semibold text-right">Min</th>
          <th className="px-3 py-2.5 font-semibold text-right">Maks</th>
          <th className="px-3 py-2.5 font-semibold text-right">Rata-rata</th>
          <th className="px-3 py-2.5 font-semibold text-right">Pembacaan</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr
            key={p.month}
            className={`border-b border-slate-100 last:border-0 ${p.count > 0 ? '' : 'text-slate-300'}`}
          >
            <td className="px-3 py-2 font-medium text-slate-700">{p.label}</td>
            <td className="px-3 py-2 text-right font-mono text-slate-700">{formatNilai(p.min)}</td>
            <td className="px-3 py-2 text-right font-mono text-slate-700">{formatNilai(p.max)}</td>
            <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">{formatNilai(p.avg)}</td>
            <td className="px-3 py-2 text-right font-mono text-slate-500">{p.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

interface CompletionProps {
  monthlyTotal: number[];
  monthlyCompleted: number[];
}

/**
 * Kelengkapan per bulan untuk modul tanpa nilai ukur (ADC, VHF, Glide Path).
 * Isian form modul itu bebas teks, jadi yang bisa diringkas cuma jumlah form
 * per bulan dan berapa yang sudah ditandatangani.
 */
export const CompletionChart: React.FC<CompletionProps> = ({ monthlyTotal, monthlyCompleted }) => {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const data = labels.map((label, i) => ({
    label,
    total: monthlyTotal[i] ?? 0,
    done: monthlyCompleted[i] ?? 0,
  }));
  const grandTotal = data.reduce((s, r) => s + r.total, 0);
  const grandDone = data.reduce((s, r) => s + r.done, 0);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-900">Kelengkapan Pengujian</h2>
      <p className="text-xs text-slate-500 mb-4">
        Modul ini tidak punya nilai numerik yang bisa diplot — yang ditampilkan adalah jumlah form per bulan dan
        berapa yang sudah selesai.
      </p>

      {grandTotal === 0 ? (
        <EmptyState title="Belum ada pengujian" description="Tidak ada form sama sekali pada tahun ini." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 4, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: '#F1F5F9' }}
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as { total: number; done: number } | undefined;
                  if (!row) return null;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                      <p className="font-semibold text-slate-800">Bulan {label}</p>
                      <dl className="mt-1.5 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5">
                        <dt className="text-slate-500">Form</dt>
                        <dd className="text-right font-mono text-slate-800">{row.total}</dd>
                        <dt className="text-slate-500">Completed</dt>
                        <dd className="text-right font-mono font-semibold text-slate-900">{row.done}</dd>
                      </dl>
                    </div>
                  );
                }}
              />
              <RBar dataKey="total" fill={TOTAL_BAR} radius={[3, 3, 0, 0]} isAnimationActive={false} name="Form" />
              <RBar dataKey="done" fill={DONE_BAR} radius={[3, 3, 0, 0]} isAnimationActive={false} name="Completed" />
            </ComposedChart>
          </ResponsiveContainer>

          <p className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TOTAL_BAR }} />
              Total form
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: DONE_BAR }} />
              Completed
            </span>
          </p>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2.5 font-semibold">Bulan</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Form</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Completed</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Kelengkapan</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr
                    key={r.label}
                    className={`border-b border-slate-100 last:border-0 ${r.total > 0 ? '' : 'text-slate-300'}`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-700">{r.label}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">{r.total}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">{r.done}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-900">
                      {r.total > 0 ? `${Math.round((r.done / r.total) * 100)}%` : '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td className="px-3 py-2.5 font-semibold text-slate-700">Total</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">{grandTotal}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-700">{grandDone}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">
                    {grandTotal > 0 ? `${Math.round((grandDone / grandTotal) * 100)}%` : '\u2014'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </section>
  );
};
