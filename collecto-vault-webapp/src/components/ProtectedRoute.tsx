import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { hasVaultOtpToken } from '../api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  // If no token or token expired, redirect to login
  if (!hasVaultOtpToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
