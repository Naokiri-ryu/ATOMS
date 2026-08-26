import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROSTERING_URL_PROD } from '@/config';

const ROSTERING_LOGIN_URL = 
  ROSTERING_URL_PROD 
    ? `${ROSTERING_URL_PROD}/login`
    : import.meta.env.VITE_ROSTERING_FRONTEND_URL 
      ? `${import.meta.env.VITE_ROSTERING_FRONTEND_URL}/login`
      : 'http://localhost:5174/login';

/**
 * ProtectedRoute
 *
 * Guards all authenticated routes.
 *
 * - While auth is initialising (token verification in progress): show spinner.
 * - If the backend is unreachable: show "connecting" screen with retry button.
 * - If not authenticated after init:
 *     Mock dev mode → redirect to /login (mock login form)
 *     Production    → redirect to atoms-rostering login (external)
 * - If authenticated: render child routes.
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, serverStarting, retryServerConnection } = useAuth();
  const isMockMode = import.meta.env.VITE_DEV_MOCK_AUTH === 'true';

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-[#EEF1F8]">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="h-10 w-10 rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin" />
          <p className="text-sm text-gray-500">Memuat...</p>
        </div>
      </div>
    );
  }

  if (serverStarting) {
    return (
      <div className="h-screen flex items-center justify-center p-4 bg-[#EEF1F8]">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="h-12 w-12 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin" />
          <div>
            <p className="text-base font-semibold text-gray-800 mb-1">Server sedang memulai...</p>
            <p className="text-sm text-gray-500">
              Backend masih dalam proses startup. Silakan tunggu atau coba lagi.
            </p>
          </div>
          <button
            onClick={() => retryServerConnection()}
            className="px-5 py-2 rounded-lg bg-brand-primary hover:bg-brand-700 text-white text-sm font-medium transition-colors shadow-md hover:shadow-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isMockMode) {
      return <Navigate to="/login" replace />;
    }
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = ROSTERING_LOGIN_URL;
    return null;
  }

  return <Outlet />;
};
