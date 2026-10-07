import React from 'react';
import { NavLink } from 'react-router-dom';

export type StatisticsTab = 'performance-check' | 'ground-check';

const TABS: Array<{ key: StatisticsTab; label: string; to: string }> = [
  { key: 'performance-check', label: 'Performance Check', to: '/statistics/performance-check' },
  { key: 'ground-check', label: 'Ground Check', to: '/statistics/ground-check' },
];

const linkClass = (isActive: boolean): string =>
  [
    'flex-1 sm:flex-none sm:px-4 h-10 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors whitespace-nowrap',
    isActive
      ? 'bg-brand-primary text-white shadow-sm'
      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-primary',
  ].join(' ');

/**
 * Sub-menu Statistik. Ditampilkan di halaman daftar maupun halaman detail, jadi
 * operator bisa berpindah antara Performance Check dan Ground Check tanpa
 * melewati halaman utama dulu.
 *
 * Penanda aktif datang dari prop `active`, bukan dari mencocokkan URL: halaman
 * detail Performance Check ada di /statistics/performance-check/:moduleKey,
 * yang tidak akan dianggap aktif oleh NavLink tanpa `end`.
 */
export const StatisticsTabs: React.FC<{ active: StatisticsTab }> = ({ active }) => (
  <nav
    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 flex gap-1.5 overflow-x-auto"
    aria-label="Sub-menu statistik"
  >
    {TABS.map((tab) => (
      <NavLink key={tab.key} to={tab.to} className={linkClass(active === tab.key)}>
        {tab.label}
      </NavLink>
    ))}
  </nav>
);

export default StatisticsTabs;
