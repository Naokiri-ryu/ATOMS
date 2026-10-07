import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { EquipmentPickerPage } from '@/pages/statistics/EquipmentPickerPage';
import { StatisticsTabs } from '@/pages/statistics/StatisticsTabs';
import { statisticsService } from '@/services/statisticsService';

/**
 * Daftar 5 modul Ground Check. Localizer dan DVOR punya grafik nilai
 * numerik; ADC, VHF, dan Glide Path isinya bebas teks sehingga hanya punya
 * tren kelengkapan — badge di kartu Bridging supaya operator tidak mencari
 * grafik yang memang tidak ada.
 */
export const GroundCheckStatisticsPage: React.FC = () => {
  const navigate = useNavigate();

  const fetchIndex = useCallback(async (year: number) => (await statisticsService.getGroundCheck(year)).modules, []);

  const renderNote = useCallback(
    (item: { has_numeric?: boolean; metric_count?: number }): string | null =>
      item.has_numeric
        ? `${item.metric_count} nilai ukur`
        : 'Tanpa nilai ukur — kelengkapan saja',
    [],
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-7xl mx-auto">
      <PageHeader
        icon={Radar}
        iconBg="bg-brand-50"
        iconColor="text-brand-primary"
        title="Ground Check"
        subtitle="Kelengkapan pengujian per bulan, plus tren nilai numerik untuk Localizer dan DVOR"
      />

      <StatisticsTabs active="ground-check" />

      <EquipmentPickerPage
        icon={Radar}
        subtitle="Modul bertanda “nilai ukur” punya grafik min–maks–rata-rata; modul lain hanya menampilkan kelengkapan."
        emptyDescription={(year) => `Tidak ada form Ground Check pada tahun ${year}.`}
        fetchIndex={fetchIndex}
        onOpen={(key) => navigate(`/statistics/ground-check/${key}`)}
        renderNote={renderNote}
      />
    </div>
  );
};

export default GroundCheckStatisticsPage;
