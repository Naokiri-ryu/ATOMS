import React, { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials } from '@/types';
import { authService } from '@/services/authService';
import { AuthContext } from '@/contexts/contextInstances';
import { ROSTERING_URL_PROD } from '@/config';


/**
 * AuthProvider — SSO-aware auth context for atoms-maintenance.
 *
 * Token lifecycle:
 *   1. On app load, check URL for ?token query param (set by atoms-rostering redirect).
 *   2. If found: validate via GET /api/v1/auth/verify, store in sessionStorage, clean URL.
 *   3. If not found: check sessionStorage for an existing token from this session.
 *   4. If neither: redirect to atoms-rostering login page.
 *
 * Storage: sessionStorage only — never localStorage.
 * This means the session ends when the browser tab is closed, which is correct
 * for a delegated-auth system where atoms-rostering owns the session.
 *
 * Mock dev mode (VITE_DEV_MOCK_AUTH=true):
 *   The login() method is still available for the mock login flow.
 *   Token is stored as mock-token-{id} in sessionStorage.
 *
 * Server-starting handling:
 *   When the atoms-backend is unreachable (e.g. still building after restart),
 *   the provider shows a "connecting" screen with a retry button instead of
 *   bouncing the user back to the rostering login page.
 */

const ROSTERING_LOGIN_URL = 
  ROSTERING_URL_PROD 
    ? `${ROSTERING_URL_PROD}/login`
    : import.meta.env.VITE_ROSTERING_FRONTEND_URL 
      ? `${import.meta.env.VITE_ROSTERING_FRONTEND_URL}/login`
      : 'http://localhost:5174/login';

const SESSION_TOKEN_KEY   = 'auth_token';
const SESSION_USER_KEY    = 'auth_user';
// Temporary key: holds the URL token while verify() is in-flight.
// Written at module load, cleared after verify succeeds or fails.
const SESSION_PENDING_KEY = 'auth_pending_token';

// ── Capture ?token from URL at module load ────────────────────────────────
// Done here (outside React) so it runs exactly once per page load,
// before any React lifecycle or StrictMode double-invoke can interfere.
{
  const _params = new URLSearchParams(window.location.search);
  const _t = _params.get('token');
  if (_t) {
    // Park the token in sessionStorage so initAuth() can read it reliably
    // even if StrictMode runs useEffect twice.
    sessionStorage.setItem(SESSION_PENDING_KEY, _t);
    // Strip token from URL immediately — don't leave it in browser history.
    _params.delete('token');
    const _newSearch = _params.toString();
    window.history.replaceState(
      {},
      '',
      window.location.pathname + (_newSearch ? `?${_newSearch}` : '')
    );
    // Safe debug: presence only, no token contents.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[SSO] received token from URL, length:', _t.length);
    }
  }
}

type InitResult =
  | { status: 'authed'; token: string; user: User }
  | { status: 'redirect' }
  | { status: 'server-starting' }
  | { status: 'no-auth' };

// Reset the singleton so the next call to ensureInitialized() re-runs the flow.
// Used when the user clicks "Retry" on the server-starting screen.
const resetInit = () => {
  initAuthPromise = null;
};

let initAuthPromise: Promise<InitResult> | null = null;

const persistSession = (tok: string, usr: User) => {
  sessionStorage.setItem(SESSION_TOKEN_KEY, tok);
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(usr));
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(SESSION_PENDING_KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

const tryVerify = async (
  pendingToken: string,
  tokenfix: string | null,
): Promise<{ user: User } | null> => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await authService.verify(pendingToken, tokenfix);
      if (result?.user) {
        return result;
      }
    } catch (err: any) {
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_RESET';
      if (import.meta.env.DEV) {
        console.warn(`[SSO] verify attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, err.message || err);
      }
      if (isNetworkError && attempt < MAX_RETRIES) {
        if (import.meta.env.DEV) {
          console.log(`[SSO] backend unreachable, retrying in ${RETRY_DELAY_MS}ms...`);
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      break;
    }
  }
  return null;
};

const ensureInitialized = (): Promise<InitResult> => {
  if (initAuthPromise) return initAuthPromise;

  initAuthPromise = (async (): Promise<InitResult> => {
    // ── Step 1: Check for a pending SSO token (from atoms-rostering redirect) ─
    const pendingToken = sessionStorage.getItem(SESSION_PENDING_KEY);
    const params = new URLSearchParams(window.location.search);
    const tokenfix = params.get('tokenfix');
    if (pendingToken) {
      sessionStorage.removeItem(SESSION_PENDING_KEY);

      const verifyResult = await tryVerify(pendingToken, tokenfix);
      if (verifyResult) {
        persistSession(pendingToken, verifyResult.user as User);
        if (import.meta.env.DEV) {
          console.log('[SSO] token verified, user:', (verifyResult.user as User).name);
        }
        return { status: 'authed', token: pendingToken, user: verifyResult.user as User };
      }

      // All retries failed — server is likely still starting up.
      // Don't clear the token or redirect: show server-starting screen instead.
      // Re-park the token so the user can retry.
      sessionStorage.setItem(SESSION_PENDING_KEY, pendingToken);
      return { status: 'server-starting' };
    }

    // ── Step 2: Check sessionStorage for existing session ───────────────────
    const storedToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const storedUser  = sessionStorage.getItem(SESSION_USER_KEY);

    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        return { status: 'authed', token: storedToken, user: parsed };
      } catch {
        clearSession();
      }
    }

    // ── Step 3: No token anywhere ────────────────────────────────────────────
    return { status: 'no-auth' };
  })();

  return initAuthPromise;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverStarting, setServerStarting] = useState(false);

  const initAuth = useCallback(async (isRetry = false) => {
    if (isRetry) resetInit();

    setServerStarting(false);
    setIsLoading(true);

    try {
      const result = await ensureInitialized();

      if (result.status === 'authed') {
        setToken(result.token);
        setUser(result.user);
        setServerStarting(false);
        setIsLoading(false);
        return;
      }

      if (result.status === 'server-starting') {
        // Backend unreachable — show retry screen instead of redirecting
        setIsLoading(false);
        setServerStarting(true);
        return;
      }

      if (result.status === 'redirect') {
        setIsLoading(false);
        setServerStarting(false);
        window.location.href = ROSTERING_LOGIN_URL;
        return;
      }

      // status === 'no-auth'
      const isMockMode = import.meta.env.VITE_DEV_MOCK_AUTH === 'true';
      if (!isMockMode) {
        setIsLoading(false);
        setServerStarting(false);
        window.location.href = ROSTERING_LOGIN_URL;
        return;
      }

      // Mock dev mode: stay on /login so the mock form can render
      setIsLoading(false);
      setServerStarting(false);
    } catch {
      setIsLoading(false);
      setServerStarting(true);
    }
  }, []);

  useEffect(() => {
    if (window.location.pathname.startsWith('/monitor')) {
      sessionStorage.removeItem(SESSION_PENDING_KEY);
      setIsLoading(false);
      return;
    }

    initAuth(false);
  }, [initAuth]);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const { access_token, user: userData } = response;
    persistSession(access_token, userData as User);
    setToken(access_token);
    setUser(userData as User);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors — clear local state regardless
    } finally {
      clearSession();
      setToken(null);
      setUser(null);
      window.location.href = ROSTERING_LOGIN_URL;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(updatedUser));
    if (!token) {
      const mockToken = `mock-token-${updatedUser.id}`;
      setToken(mockToken);
      sessionStorage.setItem(SESSION_TOKEN_KEY, mockToken);
    }
  };

  const retryServerConnection = useCallback(() => {
    initAuth(true);
  }, [initAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        serverStarting,
        retryServerConnection,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
