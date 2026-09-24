import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, LoginCredentials } from '../../../types';
import { authService } from '../repository/authService';
import { clearStoredAuth, getStoredToken, getStoredUser, migrateLegacyAuthStorage, setStoredAuth } from './authStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mustChangePassword: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    migrateLegacyAuthStorage();

    // Delegated SSO logout: other apps (e.g. atoms-maintenance) redirect here
    // with ?logout=1 so the rostering session is actually cleared at this origin.
    if (new URLSearchParams(window.location.search).get('logout') === '1') {
      authService.logout().catch(() => {});
      clearStoredAuth();
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
      window.history.replaceState({}, '', '/login');
    }

    const storedToken = getStoredToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      // Refresh user data from backend to ensure employee relationship is loaded
      authService.me()
        .then(response => {
          const updatedUser = response.user;
          setUser(updatedUser);
          setMustChangePassword(!!updatedUser.must_change_password);
          setStoredAuth(storedToken, JSON.stringify(updatedUser));
        })
        .catch(error => {
          console.error('Failed to refresh user data:', error);
          // Keep using stored user if refresh fails
        });
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    const { access_token, user: userData, must_change_password } = response;

    setStoredAuth(access_token, JSON.stringify(userData));

    setToken(access_token);
    setUser(userData);
    setMustChangePassword(!!must_change_password);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearStoredAuth();
      setToken(null);
      setUser(null);
      setMustChangePassword(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    if (token) {
      setStoredAuth(token, JSON.stringify(updatedUser));
    }
  };

  const clearMustChangePassword = () => {
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        mustChangePassword,
        login,
        logout,
        updateUser,
        clearMustChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
