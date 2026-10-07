import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EquipmentPickerPage } from '@/pages/statistics/EquipmentPickerPage';
import { StatisticsTabs } from '@/pages/statistics/StatisticsTabs';
import { statisticsService } from '@/services/statisticsService';

/**
 * Daftar peralatan Performance Check (10 modul TFP). Halaman ini yang dulu
 * occupying /statistics; sekarang jadi sub-menu pertama di bawahnya.
 */
export const PerformanceCheckStatisticsPage: React.FC = () => {
  const navigate = useNavigate();

  const fetchIndex = useCallback(
    async (year: number) => (await statisticsService.getTfpEquipment(year)).equipment,
    [],
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={ClipboardCheck}
        iconBg="bg-brand-50"
        iconColor="text-brand-primary"
        title="Performance Check"
        subtitle="Pilih peralatan untuk melihat tren nilai pengukuran per bulan"
      />

      <StatisticsTabs active="performance-check" />

      <EquipmentPickerPage
        icon={ClipboardCheck}
        subtitle="Grafik menampilkan rentang min–maks dan rata-rata tiap bulan untuk satu titik ukur yang dipilih."
        emptyDescription={(year) => `Tidak ada form Performance Check TFP pada tahun ${year}.`}
        fetchIndex={fetchIndex}
        onOpen={(key) => navigate(`/statistics/performance-check/${key}`)}
      />
    </div>
  );
};

export default PerformanceCheckStatisticsPage;
