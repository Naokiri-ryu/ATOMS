import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROSTERING_URL_PROD  } from '@/config';

const ROSTERING_LOGIN_URL = 
  ROSTERING_URL_PROD 
    ? `${ROSTERING_URL_PROD}/login`
    : import.meta.env.VITE_ROSTERING_FRONTEND_URL 
      ? `${import.meta.env.VITE_ROSTERING_FRONTEND_URL}/login`
      : 'http://localhost:5174/login';

/**
 * LoginPage — atoms-maintenance tidak punya login sendiri.
 * Semua autentikasi dilakukan di atoms-rostering.
 *
 * Jika sudah login → langsung ke dashboard.
 * Jika belum → redirect ke atoms-rostering login.
 */
export const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.replace(ROSTERING_LOGIN_URL);
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF1F8] px-4">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card">
          <div className="bg-gradient-to-br from-brand-800 to-brand-600 px-6 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">AirNav Indonesia</p>
            <h1 className="mt-1 text-lg font-bold text-white">ATOMS Maintenance</h1>
          </div>
          <div className="flex flex-col items-center gap-3 px-6 py-8">
            <div className="h-10 w-10 rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin" />
            <p className="text-sm text-slate-500">Mengarahkan ke halaman login…</p>
          </div>
        </div>
      </div>
    </div>
  );
};
