import { getStoredToken } from '../modules/auth/core/authStorage';

export function redirectToSakti(): void {
  const token = getStoredToken();
  const userStr = localStorage.getItem('user');
  const userObject = userStr ? JSON.parse(userStr) : null;
  const tokenfix = userObject ? `mock-token-${userObject.id}` : '';

  const currentUrl = window.location.href;
  let baseUrl: string;

  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    baseUrl = import.meta.env.VITE_SAKTI_URL || 'http://localhost:5660';
  } else {
    baseUrl = import.meta.env.VITE_SAKTI_URL_PROD || 'http://172.19.38.157:5660';
  }

  const url = token
    ? `${baseUrl}/sso?token=${encodeURIComponent(token)}&tokenfix=${encodeURIComponent(tokenfix)}`
    : baseUrl;

  window.location.href = url;
}
