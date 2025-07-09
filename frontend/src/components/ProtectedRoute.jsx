import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import { Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BRANDING_MESSAGES } from '../config/branding';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4 animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <Spinner size="xl" className="mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {BRANDING_MESSAGES.protectedRouteTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Verifying your authentication...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with the current location as state
    // This allows the login page to redirect back here after successful authentication
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
} 