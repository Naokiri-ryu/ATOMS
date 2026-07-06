// src/config/index.ts

/**
 * Mendapatkan base URL API berdasarkan lokasi akses (localhost vs network)
 */
export const getApiUrl = (): string => {
  const currentUrl = window.location.href;
  console.log('🔍 [Config] Current URL:', currentUrl);
  
  // Kalau akses dari localhost → pake VITE_API_URL
  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    console.log('✅ [Config] Detected localhost, using VITE_API_URL');
    return import.meta.env.VITE_API_URL || 'http://localhost:5657/api';
  }
  
  // Kalau akses dari IP/network → pake VITE_API_URL_PROD
  console.log('✅ [Config] Detected network, using VITE_API_URL_PROD');
  return import.meta.env.VITE_API_URL_PROD || 'http://172.19.38.157:5657/api';
};

/**
 * Mendapatkan base URL Rostering (frontend) berdasarkan lokasi akses
 */
export const getRosteringUrl = (): string => {
  const currentUrl = window.location.href;
  console.log('🔍 [Config] Current URL:', currentUrl);
  
  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    console.log('✅ [Config] Detected localhost, using VITE_ROSTERING_URL');
    return import.meta.env.VITE_ROSTERING_FRONTEND_URL || 'http://localhost:5658';
  }
  
  console.log('✅ [Config] Detected network, using VITE_ROSTERING_URL_PROD');
  return import.meta.env.VITE_ROSTERING_URL_PROD || 'http://172.19.38.157:5658';
};

/**
 * API URL yang sudah siap pakai (di-cache)
 */
export const API_URL_PROD = getApiUrl();

/**
 * Rostering URL yang sudah siap pakai (di-cache)
 */
export const ROSTERING_URL_PROD = getRosteringUrl();
