import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/core/AuthContext';
import { useDataCache } from '../../contexts/DataCacheContext';
import InitialLoadingPage from '../../pages/InitialLoadingPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading: authLoading, user, mustChangePassword } = useAuth();
  const { isLoading: dataLoading, isInitialized } = useDataCache();

  // Show full loading page during auth check
  if (authLoading) {
    return <InitialLoadingPage message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force user to change temporary password before accessing protected routes
  if (mustChangePassword) {
    return <Navigate to="/login" replace />;
  }

  // Show full loading page during initial data loading
  if (isAuthenticated && !isInitialized && dataLoading) {
    return <InitialLoadingPage message="Loading your workspace..." />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
