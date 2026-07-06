import axios, { AxiosError } from 'axios';
import { clearStoredAuth, getStoredToken } from '../modules/auth/core/authStorage';

// const API_BASE_URL = 'http://172.19.38.157:5659/api' || import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const getApiBaseUrl = () => {
  const currentUrl = window.location.href;
  console.log('🔍 Current URL:', currentUrl);
  
  // Kalau akses dari localhost → pake localhost
  if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
    console.log('✅ Detected localhost, using localhost API');
    return import.meta.env.VITE_API_URL || 'http://localhost:5659/api';
  }
  
  // Fallback
  console.log('⚠️ Using default fallback');
  return import.meta.env.VITE_API_URL_PROD || 'http://localhost:5659/api';
};
const API_BASE_URL = getApiBaseUrl();
console.log('🔍 Final API_BASE_URL:', API_BASE_URL);


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // Temporarily remove withCredentials to fix CORS issue
  // withCredentials: true,  // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and optimize headers
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Remove unnecessary headers for simple requests when possible
    if (config.method?.toLowerCase() === 'get' && !config.headers.Authorization) {
      // For GET requests without auth, use minimal headers to avoid preflight
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      clearStoredAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
