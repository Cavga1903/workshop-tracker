import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Label, TextInput, Button, Alert, Progress } from 'flowbite-react';
import { HiMail, HiLockClosed, HiUser, HiEye, HiEyeOff, HiShieldCheck } from 'react-icons/hi';
import { Shield, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BRANDING_MESSAGES } from '../config/branding';

export default function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    username: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { signUp, user, validateEmailDomain } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Update username automatically based on email
  useEffect(() => {
    if (formData.email && validateEmailDomain(formData.email)) {
      const emailUsername = formData.email.split('@')[0];
      if (!formData.username || formData.username === '') {
        setFormData(prev => ({
          ...prev,
          username: emailUsername
        }));
      }
    }
  }, [formData.email, validateEmailDomain, formData.username]);

  // Calculate password strength
  useEffect(() => {
    const calculatePasswordStrength = (password) => {
      let strength = 0;
      if (password.length >= 8) strength += 25;
      if (password.length >= 12) strength += 15;
      if (/[A-Z]/.test(password)) strength += 20;
      if (/[a-z]/.test(password)) strength += 20;
      if (/\d/.test(password)) strength += 10;
      if (/[^A-Za-z0-9]/.test(password)) strength += 10;
      return Math.min(strength, 100);
    };

    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 30) return 'red';
    if (passwordStrength < 60) return 'yellow';
    if (passwordStrength < 80) return 'blue';
    return 'green';
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!formData.email) {
      setError('Email address is required');
      return false;
    }

    if (!validateEmailDomain(formData.email)) {
      setError(BRANDING_MESSAGES.signupAuthRestrictionMessage);
      return false;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (passwordStrength < 40) {
      setError('Password is too weak. Please use a stronger password.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
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
      const { data, error: signUpError } = await signUp(
        formData.email, 
        formData.password,
        {
          fullName: formData.fullName,
          username: formData.username
        }
      );
      
      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        setSuccess('Account created successfully! Please check your email to verify your account before signing in.');
        
        // Clear form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          username: ''
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account created! Please check your email for verification.' 
            }
          });
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const isEmailValid = formData.email && validateEmailDomain(formData.email);
  const isPasswordMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center bg-gradient-to-r from-green-600 to-blue-600 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {BRANDING_MESSAGES.signupTitle}
          </h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-600 dark:text-gray-300">
            {BRANDING_MESSAGES.navbarTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create your secure account
          </p>
        </div>

        {/* Security Badge */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <HiShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              {BRANDING_MESSAGES.signupSubtitle}
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

            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" value="Full Name *" className="text-sm font-medium" />
              <TextInput
                id="fullName"
                name="fullName"
                type="text"
                icon={HiUser}
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" value="Email Address *" className="text-sm font-medium" />
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

            {/* Username */}
            <div>
              <Label htmlFor="username" value="Username *" className="text-sm font-medium" />
              <TextInput
                id="username"
                name="username"
                type="text"
                icon={HiUser}
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This will be your display name in the app
              </p>
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" value="Password *" className="text-sm font-medium" />
              <div className="relative mt-1">
                <TextInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  icon={HiLockClosed}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      getPasswordStrengthColor() === 'green' ? 'text-green-600' :
                      getPasswordStrengthColor() === 'blue' ? 'text-blue-600' :
                      getPasswordStrengthColor() === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <Progress 
                    progress={passwordStrength} 
                    color={getPasswordStrengthColor()} 
                    size="sm"
                  />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" value="Confirm Password *" className="text-sm font-medium" />
              <div className="relative mt-1">
                <TextInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  icon={HiLockClosed}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className={`${isPasswordMatch ? 'border-green-300 focus:border-green-500' : ''}`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  {formData.confirmPassword && (
                    <div className="pr-8">
                      {isPasswordMatch ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="pr-3 flex items-center"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <HiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <HiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>
              {formData.confirmPassword && !isPasswordMatch && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  Passwords do not match
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Password Requirements:</p>
                  <ul className="space-y-1">
                    <li className={formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                      • At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}>
                      • One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}>
                      • One lowercase letter
                    </li>
                    <li className={/\d/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}>
                      • One number
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              gradientDuoTone="greenToBlue"
              size="lg"
              isProcessing={loading}
              disabled={loading || !isEmailValid || !isPasswordMatch || passwordStrength < 40}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Already have an account?
                </span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 transition-colors duration-200"
              >
                Sign in instead
              </Link>
            </div>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {BRANDING_MESSAGES.signupCopyright}
          </p>
        </div>
      </div>
    </div>
  );
} 