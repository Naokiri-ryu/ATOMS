import { getStoredToken } from '../modules/auth/core/authStorage';

export function redirectToMaintenance(): void {
  const token = getStoredToken();
  const userStr = localStorage.getItem('user');
  const userObject = userStr ? JSON.parse(userStr) : null;
  const tokenfix = userObject ? `mock-token-${userObject.id}` : '';

  const currentUrl = window.location.href;
  let baseUrl: string;

  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    baseUrl = import.meta.env.VITE_MAINTENANCE_URL || 'http://localhost:5656';
  } else {
    baseUrl = import.meta.env.VITE_MAINTENANCE_URL_PROD || 'http://172.19.38.157:5656';
  }

  const url = token
    ? `${baseUrl}?token=${encodeURIComponent(token)}&tokenfix=${encodeURIComponent(tokenfix)}`
    : baseUrl;

  window.location.href = url;
}
