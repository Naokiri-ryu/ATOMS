import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * /statistics adalah menu Statistiknya, sedangkan Performance Check dan Ground
 * Check masing-masing punya sub-menu dan daftar sendiri. Mengarahkan ke sub-menu
 * pertama membuat bookmark lama "/statistics" tetap berguna tanpa perlu halaman
 * perantara yang isinya cuma tombol.
 */
export const StatisticsPage: React.FC = () => <Navigate to="/statistics/performance-check" replace />;

export default StatisticsPage;
