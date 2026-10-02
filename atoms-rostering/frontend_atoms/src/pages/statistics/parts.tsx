import React from 'react';
import { BarChart3 } from 'lucide-react';

/**
 * Rostering belum punya EmptyState/Skeleton di components/, tapi halaman
 * statistik membutuhkannya. Ditdefined di sini agar dua halaman statistik
 * (daftar & detail) tidak menduplikasi markup yang sama.
 */

export const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="py-12 flex flex-col items-center text-center">
    <div className="bg-navy-50 rounded-full p-4 mb-4">
      <BarChart3 size={32} className="text-navy-700" />
    </div>
    <h3 className="text-lg font-semibold text-navy-900 mb-1">{title}</h3>
    <p className="text-sm text-slate-500 max-w-md">{description}</p>
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
);
