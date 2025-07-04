import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, Label, TextInput, Button, Alert, Checkbox } from 'flowbite-react';
import { HiMail, HiLockClosed, HiEye, HiEyeOff, HiShieldCheck } from 'react-icons/hi';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BRANDING_MESSAGES } from '../config/branding';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { signIn, user, validateEmailDomain } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email) {
      setError('Email address is required');
      return false;
    }

    if (!validateEmailDomain(formData.email)) {
      setError(BRANDING_MESSAGES.authRestrictionMessage);
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data, error: signInError } = await signIn(formData.email, formData.password);
      
      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        setSuccess('Successfully signed in! Redirecting...');
        
        // Save login preference
        if (formData.rememberMe) {
          localStorage.setItem('company_remember', 'true');
        } else {
          localStorage.removeItem('company_remember');
        }

        // Small delay to show success message
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isEmailValid = formData.email && validateEmailDomain(formData.email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {BRANDING_MESSAGES.protectedRouteTitle}
          </h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-600 dark:text-gray-300">
            {BRANDING_MESSAGES.loginTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <HiShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
              {BRANDING_MESSAGES.loginSubtitle}
            </span>
          </div>
        </div>
        
        <Card className="shadow-xl border-0">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert color="failure" icon={AlertCircle}>
                <span className="font-medium">Error:</span> {error}
              </Alert>
            )}
            
            {success && (
              <Alert color="success" icon={CheckCircle}>
                <span className="font-medium">Success:</span> {success}
              </Alert>
            )}
            
            {/* Email Field */}
            <div>
              <Label htmlFor="email" value="Email address *" className="text-sm font-medium" />
              <div className="relative mt-1">
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  icon={HiMail}
                  placeholder={BRANDING_MESSAGES.emailPlaceholder}
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className={`${isEmailValid ? 'border-green-300 focus:border-green-500' : ''}`}
                />
                {formData.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    {isEmailValid ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {formData.email && !isEmailValid && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {BRANDING_MESSAGES.emailValidationMessage}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" value="Password *" className="text-sm font-medium" />
              <div className="relative mt-1">
                <TextInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  icon={HiLockClosed}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <Label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  Remember me
                </Label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              gradientDuoTone="cyanToBlue"
              size="lg"
              isProcessing={loading}
              disabled={loading || !isEmailValid}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  {BRANDING_MESSAGES.newUserPrompt}
                </span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link 
                to="/signup" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors duration-200"
              >
                Create your account
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {BRANDING_MESSAGES.copyright}
          </p>
        </div>
      </div>
    </div>
  );
} 