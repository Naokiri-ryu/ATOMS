import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  BarChart3,
  CalendarRange,
  Layers,
  Plane,
  RadioTower,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader, StatsCard } from '../components';
import Card from '../components/ui/Card';
import LoadingScreen from '../components/common/LoadingScreen';
import {
  maintenanceStatisticsService,
  type StatisticsModuleItem,
  type StatisticsOverview,
} from '../services/maintenanceStatisticsService';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const FIRST_YEAR = 2020;
const CNSD_COLOR = '#222E6A'; // navy-700
const TFP_COLOR = '#F5A623'; // accent-500

const numberFormat = new Intl.NumberFormat('id-ID');

const formatTanggal = (iso: string | null): string => {
  if (!iso) return '\u2014';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return '\u2014';
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
};

const StatisticsPage: React.FC = () => {
  const now = new Date();
  const yearOptions = useMemo(
    () => Array.from({ length: now.getFullYear() - FIRST_YEAR + 1 }, (_, i) => now.getFullYear() - i),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [year, setYear] = useState(now.getFullYear());
  const [monthFilter, setMonthFilter] = useState<number | ''>('');
  const [data, setData] = useState<StatisticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOverview = useCallback(async (targetYear: number) => {
    setIsLoading(true);
    try {
      const res = await maintenanceStatisticsService.getOverview(targetYear);
      setData(res);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(
        axios.isAxiosError(err) && err.response?.status === 401
          ? 'Sesi habis atau akses ditolak. Silakan login ulang.'
          : `Gagal memuat statistik tahun ${targetYear}. Pastikan aplikasi Maintenance aktif.`,
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview(year);
  }, [year, fetchOverview]);

  const monthIndex = typeof monthFilter === 'number' ? monthFilter - 1 : null;

  /** Angka kartu: ikut filter bulan bila aktif, selain itu total setahun. */
  const shownTotals = useMemo(() => {
    if (!data) return { CNSD: 0, TFP: 0, grand: 0 };
    if (monthIndex === null) return { ...data.totals, grand: data.grand_total };
    let cnsd = 0;
    let tfp = 0;
    for (const mod of data.modules) {
      const v = mod.monthly[monthIndex] ?? 0;
      if (mod.division === 'CNSD') cnsd += v;
      else tfp += v;
    }
    return { CNSD: cnsd, TFP: tfp, grand: cnsd + tfp };
  }, [data, monthIndex]);

  const avgPerMonth = Math.round((data?.grand_total ?? 0) / 12);

  /** Data bar per modul: nilai bulan terpilih atau total tahunan, urut menurun. */
  const moduleBars = useMemo(() => {
    if (!data) return [];
    const rows = data.modules.map((mod) => ({
      label: mod.label,
      division: mod.division,
      value: monthIndex === null ? mod.total : (mod.monthly[monthIndex] ?? 0),
    }));
    const filtered = monthIndex === null ? rows : rows.filter((r) => r.value > 0);
    return [...filtered].sort((a, b) => b.value - a.value);
  }, [data, monthIndex]);

  const tableRows: StatisticsModuleItem[] = data?.modules ?? [];
  const isEmpty = !isLoading && !errorMessage && shownTotals.grand === 0;
  const selectClass =
    'h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-navy-700 focus:border-transparent min-w-0';

  return (
    <PageHeader
      title="Statistik"
      subtitle={`Rekap setoran form CNSD & TFP yang sudah completed \u2014 tahun ${year}`}
    >
      {/* Filter tahun & bulan + muat ulang */}
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
        <select
          value={monthFilter === '' ? '' : String(monthFilter)}
          onChange={(e) => setMonthFilter(e.target.value === '' ? '' : Number(e.target.value))}
          className={selectClass}
          aria-label="Pilih bulan (opsional)"
        >
          <option value="">Semua Bulan</option>
          {MONTH_FULL.map((label, i) => (
            <option key={label} value={String(i + 1)}>{label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void fetchOverview(year)}
          className="h-10 flex items-center gap-2 px-3 rounded-lg border border-gray-300 bg-white text-sm text-slate-600 hover:bg-navy-50 hover:text-navy-700 transition-colors shrink-0"
          aria-label="Muat ulang statistik"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : undefined} />
          <span className="hidden sm:inline">Muat Ulang</span>
        </button>
        <span className="text-xs text-slate-400 ml-1">
          Hanya form berstatus <strong>completed</strong> yang dihitung.
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {errorMessage}
        </div>
      )}

      {isLoading && (
        <Card padding="md">
          <LoadingScreen fullScreen={false} variant="minimal" title="Memuat statistik..." />
        </Card>
      )}

      {!isLoading && !errorMessage && data && (
        <>
          {/* Kartu angka */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total CNSD" value={numberFormat.format(shownTotals.CNSD)} icon={<RadioTower className="h-5 w-5" />} description={monthLabelHint(monthFilter, year)} isLoading={false} />
            <StatsCard title="Total TFP" value={numberFormat.format(shownTotals.TFP)} icon={<Plane className="h-5 w-5" />} description={monthLabelHint(monthFilter, year)} />
            <StatsCard title="Total Gabungan" value={numberFormat.format(shownTotals.grand)} icon={<Layers className="h-5 w-5" />} description={monthLabelHint(monthFilter, year)} />
            <StatsCard
              title={typeof monthFilter === 'number' ? `Rata-rata / Bulan (${year})` : 'Rata-rata / Bulan'}
              value={numberFormat.format(avgPerMonth)}
              icon={<TrendingUp className="h-5 w-5" />}
              description="Setahun dibagi 12 bulan"
            />
          </div>

          {isEmpty ? (
            <Card padding="md">
              <div className="py-12 flex flex-col items-center text-center">
                <div className="bg-navy-50 rounded-full p-4 mb-4">
                  <BarChart3 size={32} className="text-navy-700" />
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-1">Belum ada data setoran</h3>
                <p className="text-sm text-slate-500 max-w-md">
                  {typeof monthFilter === 'number'
                    ? `Tidak ada form completed yang disetor pada ${MONTH_FULL[monthFilter]} ${year}.`
                    : `Belum ada form completed yang disetor sepanjang tahun ${year}.`}
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Grafik tren bulanan */}
              <Card padding="md">
                <h2 className="text-sm font-bold text-navy-900 mb-1">Tren Setoran per Bulan</h2>
                <p className="text-xs text-slate-500 mb-4">Jumlah form completed CNSD vs TFP tiap bulan pada tahun {year}.</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.trend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(34, 46, 106, 0.04)' }}
                      contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                      formatter={(value, name) => [numberFormat.format(Number(value)), String(name)]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="cnsd" name="CNSD" fill={CNSD_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28}>
                      {data.trend.map((point) => (
                        <Cell key={point.month} fillOpacity={dimCell(point.month)} />
                      ))}
                    </Bar>
                    <Bar dataKey="tfp" name="TFP" fill={TFP_COLOR} radius={[3, 3, 0, 0]} maxBarSize={28}>
                      {data.trend.map((point) => (
                        <Cell key={point.month} fillOpacity={dimCell(point.month)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Grafik per modul */}
              <Card padding="md">
                <h2 className="text-sm font-bold text-navy-900 mb-1">Setoran per Modul</h2>
                <p className="text-xs text-slate-500 mb-4">
                  {typeof monthFilter === 'number'
                    ? `Urutan modul dengan setoran terbanyak pada ${MONTH_FULL[monthFilter]} ${year}.`
                    : `Urutan modul dengan setoran terbanyak sepanjang tahun ${year}.`}
                </p>
                {moduleBars.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500">Tidak ada modul dengan setoran.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(240, moduleBars.length * 30 + 50)}>
                    <BarChart data={moduleBars} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#CBD5E1' }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={230}
                        tick={{ fontSize: 11, fill: '#334155' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(34, 46, 106, 0.04)' }}
                        contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                        formatter={(value) => [numberFormat.format(Number(value)), 'Setoran']}
                      />
                      <Bar dataKey="value" name="Setoran" radius={[0, 3, 3, 0]} maxBarSize={18}>
                        {moduleBars.map((row) => (
                          <Cell key={row.label} fill={row.division === 'CNSD' ? CNSD_COLOR : TFP_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
                <p className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CNSD_COLOR }} /> CNSD</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TFP_COLOR }} /> TFP</span>
                </p>
              </Card>

              {/* Tabel rekap per modul */}
              <div className="bg-white border border-slate-200 shadow-card rounded-xl overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <h2 className="text-sm font-bold text-navy-900">Rekap per Modul</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Detail tiap modul tersedia di aplikasi Maintenance.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-gray-200 bg-slate-50/70 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-2.5 font-semibold">Modul</th>
                        <th className="px-3 py-2.5 font-semibold">Divisi</th>
                        <th className="px-3 py-2.5 font-semibold text-right">Setahun</th>
                        {typeof monthFilter === 'number' && (
                          <th className="px-3 py-2.5 font-semibold text-right">Bln Ini</th>
                        )}
                        <th className="px-5 py-2.5 font-semibold text-right">Terakhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((mod) => (
                        <tr key={mod.module_key} className="border-b border-gray-100 last:border-0 hover:bg-navy-50/40 transition-colors">
                          <td className="px-5 py-2.5 font-medium text-slate-800">{mod.label}</td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                                mod.division === 'CNSD'
                                  ? 'bg-navy-50 text-navy-700 ring-navy-200'
                                  : 'bg-accent-50 text-accent-700 ring-accent-200'
                              }`}
                            >
                              {mod.division}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-700">{numberFormat.format(mod.total)}</td>
                          {typeof monthFilter === 'number' && (
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-900">
                              {numberFormat.format(mod.monthly[monthFilter - 1] ?? 0)}
                            </td>
                          )}
                          <td className="px-5 py-2.5 text-right text-slate-500 whitespace-nowrap">{formatTanggal(mod.last_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarRange size={13} />
                Sumber data: aplikasi Maintenance {'\u2014'} GET /api/v1/statistics/overview
              </p>
            </>
          )}
        </>
      )}
    </PageHeader>
  );

  function dimCell(month: number): number {
    return typeof monthFilter === 'number' && month !== monthFilter ? 0.25 : 1;
  }

  function monthLabelHint(filter: number | '', yr: number): string {
    return typeof filter === 'number' ? MONTH_FULL[filter - 1] : `Jan\u2013Des ${yr}`;
  }
};

export default StatisticsPage;
