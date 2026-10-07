import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

/**
 * Path lama /statistics/tfp/:moduleKey dipakai saat statistik baru hanya punya
 * Performance Check. Dialihkan ke path yang sekarang supaya tidak ada satu
 * halaman dengan dua URL (bookmark lama tetap ikut terbuka).
 */
export const LegacyTfpStatisticsRedirect: React.FC = () => {
  const { moduleKey = '' } = useParams<{ moduleKey: string }>();
  return <Navigate to={`/statistics/performance-check/${moduleKey}`} replace />;
};

export default LegacyTfpStatisticsRedirect;
