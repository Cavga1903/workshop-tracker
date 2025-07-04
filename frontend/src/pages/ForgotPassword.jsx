import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Label, TextInput, Button, Alert } from 'flowbite-react';
import { HiMail, HiShieldCheck, HiArrowLeft } from 'react-icons/hi';
import { Shield, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BRANDING_MESSAGES } from '../config/branding';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { resetPassword, validateEmailDomain } = useAuth();

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!email) {
      setError('Email address is required');
      return false;
    }

    if (!validateEmailDomain(email)) {
      setError(BRANDING_MESSAGES.authRestrictionMessage);
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
      const { error: resetError } = await resetPassword(email);
      
      if (resetError) {
        throw resetError;
      }

      setSuccess('Password reset email sent! Please check your inbox and follow the instructions to reset your password.');
      setEmail(''); // Clear the form
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isEmailValid = email && validateEmailDomain(email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Reset Password
          </h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-600 dark:text-gray-300">
            {BRANDING_MESSAGES.forgotPasswordTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Enter your email to receive reset instructions
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <HiShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
              {BRANDING_MESSAGES.forgotPasswordSubtitle}
            </span>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          {!success ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <Alert color="failure" icon={AlertCircle}>
                  <span className="font-medium">Error:</span> {error}
                </Alert>
              )}
              
              {/* Email Field */}
              <div>
                <Label htmlFor="email" value="Email Address *" className="text-sm font-medium" />
                <div className="relative mt-1">
                  <TextInput
                    id="email"
                    name="email"
                    type="email"
                    icon={HiMail}
                    placeholder={BRANDING_MESSAGES.emailPlaceholder}
                    value={email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    className={`${isEmailValid ? 'border-green-300 focus:border-green-500' : ''}`}
                  />
                  {email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {isEmailValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {email && !isEmailValid && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {BRANDING_MESSAGES.emailValidationMessage}
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">What happens next:</p>
                    <ul className="space-y-1">
                      <li>• We'll send a secure reset link to your email</li>
                      <li>• Click the link to create a new password</li>
                      <li>• The link expires in 24 hours for security</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                gradientDuoTone="purpleToBlue"
                size="lg"
                isProcessing={loading}
                disabled={loading || !isEmailValid}
              >
                {loading ? 'Sending reset email...' : 'Send reset email'}
              </Button>
            </form>
          ) : (
            /* Success State */
            <div className="space-y-6">
              <Alert color="success" icon={CheckCircle}>
                <span className="font-medium">Success!</span> {success}
              </Alert>
              
              <div className="text-center">
                <div className="mx-auto h-12 w-12 flex items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Check your email
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Don't see the email? Check your spam folder or try again.
                </p>
              </div>

              <Button
                onClick={() => {
                  setSuccess('');
                  setEmail('');
                }}
                className="w-full"
                color="gray"
                size="lg"
              >
                Send another email
              </Button>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Remember your password?
              </span>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link 
              to="/login" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30 transition-colors duration-200"
            >
              <HiArrowLeft className="h-4 w-4 mr-2" />
              Back to sign in
            </Link>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {BRANDING_MESSAGES.forgotPasswordCopyright}
          </p>
        </div>
      </div>
    </div>
  );
} 