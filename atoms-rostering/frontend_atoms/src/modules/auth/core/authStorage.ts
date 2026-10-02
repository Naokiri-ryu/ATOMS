const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_USER_KEY = 'user';

const safeGet = (storage: Storage, key: string): string | null => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (storage: Storage, key: string, value: string): void => {
  try {
    storage.setItem(key, value);
  } catch {
    // Ignore storage write failures.
  }
};

const safeRemove = (storage: Storage, key: string): void => {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
};

export const migrateLegacyAuthStorage = (): void => {
  // Do not migrate to localStorage - we want session-only
  safeRemove(localStorage, AUTH_TOKEN_KEY);
  safeRemove(localStorage, AUTH_USER_KEY);
};

export const getStoredToken = (): string | null => {
  return safeGet(sessionStorage, AUTH_TOKEN_KEY);
};

export const getStoredUser = (): string | null => {
  return safeGet(sessionStorage, AUTH_USER_KEY);
};

export const setStoredAuth = (token: string, user: string): void => {
  safeSet(sessionStorage, AUTH_TOKEN_KEY, token);
  safeSet(sessionStorage, AUTH_USER_KEY, user);
  safeRemove(localStorage, AUTH_TOKEN_KEY);
  safeRemove(localStorage, AUTH_USER_KEY);
};

export const clearStoredAuth = (): void => {
  safeRemove(sessionStorage, AUTH_TOKEN_KEY);
  safeRemove(sessionStorage, AUTH_USER_KEY);
  safeRemove(localStorage, AUTH_TOKEN_KEY);
  safeRemove(localStorage, AUTH_USER_KEY);
};

export const hasStoredToken = (): boolean => Boolean(getStoredToken());
