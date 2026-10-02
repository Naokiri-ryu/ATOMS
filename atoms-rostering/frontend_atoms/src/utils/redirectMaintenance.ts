import { getStoredToken } from '../modules/auth/core/authStorage';

/** Base URL aplikasi Maintenance, sesuai cara halaman ini diakses. */
export function maintenanceBaseUrl(): string {
  const currentUrl = window.location.href;

  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    return import.meta.env.VITE_MAINTENANCE_URL || 'http://localhost:5656';
  }
  return import.meta.env.VITE_MAINTENANCE_URL_PROD || 'http://172.19.38.157:5656';
}

/**
 * Bangun URL Maintenance lengkap dengan hand-off token, supaya tujuan
 * halaman (mis. /tfp/xyz) tetap bisa dibuka langsung dari rostering.
 */
export function buildMaintenanceUrl(path = ''): string {
  const baseUrl = maintenanceBaseUrl();
  const token = getStoredToken();
  if (!token) return `${baseUrl}${path}`;

  const userStr = sessionStorage.getItem('user');
  const userObject = userStr ? JSON.parse(userStr) : null;
  const tokenfix = userObject ? `mock-token-${userObject.id}` : '';

  return `${baseUrl}${path}?token=${encodeURIComponent(token)}&tokenfix=${encodeURIComponent(tokenfix)}`;
}

export function redirectToMaintenance(): void {
  window.location.href = buildMaintenanceUrl();
}
