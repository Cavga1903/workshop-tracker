import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Verifying your session...
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        Please wait while we authenticate you
      </p>
    </div>
  </div>
);

// Profile Missing Error component
const ProfileMissingError = ({ onRetry }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
          </div>
      
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Profile Not Found
          </h2>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Your profile could not be found in our system. This may be due to a registration issue.
      </p>
      
      <div className="space-y-3">
        <button
          onClick={onRetry}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
        >
          Retry Loading Profile
        </button>
        
        <a
          href="mailto:support@kraftstories.com"
          className="block w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-lg transition duration-200 text-center"
        >
          Contact Support
        </a>
      </div>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        If this problem persists, please contact our support team.
          </p>
        </div>
      </div>
    );

export default function ProtectedRoute({ children }) {
  const { user, profile, session, isLoading, isInitialized, fetchUserProfile } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute - State:', { 
    isInitialized, 
    isLoading, 
    hasSession: !!session, 
    hasUser: !!user, 
    hasProfile: !!profile 
  });

  // Don't render anything until auth is initialized
  if (!isInitialized) {
    console.log('⏳ ProtectedRoute - Waiting for initialization');
    return <LoadingScreen />;
  }

  // Still loading session or user
  if (isLoading) {
    console.log('⏳ ProtectedRoute - Auth still loading');
    return <LoadingScreen />;
  }

  // No session - redirect to login
  if (!session || !user) {
    console.log('🔑 ProtectedRoute - No session, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User exists but no profile - this is acceptable for basic functionality
  if (user && !profile) {
    console.log('⚠️ ProtectedRoute - User exists but no profile, allowing access with limited functionality');
    // Don't block access, just log the issue
    // The UI will handle missing profile gracefully
  }

  console.log('✅ ProtectedRoute - All checks passed, rendering children');
  // All good - render the protected content
  return children;
} 

// Wrapper for pages that need authentication
export const withAuth = (Component) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}; 