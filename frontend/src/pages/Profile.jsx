import React, { useState, useEffect } from 'react';
import { Card, Label, TextInput, Button, Alert, Avatar, Select } from 'flowbite-react';
import { HiUser, HiMail, HiPhone, HiPhotograph, HiShieldCheck, HiLockClosed, HiEye, HiEyeOff } from 'react-icons/hi';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../supabase/client';

const countryCodes = [
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' }
];

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    avatarUrl: '',
    countryCode: '+90',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      // Parse existing phone number to extract country code and number
      let countryCode = '+90';
      let phoneNumber = profile.phone_number || '';
      
      if (phoneNumber) {
        // Try to extract country code from existing phone number
        const matchedCountry = countryCodes.find(country => 
          phoneNumber.startsWith(country.code)
        );
        if (matchedCountry) {
          countryCode = matchedCountry.code;
          phoneNumber = phoneNumber.substring(matchedCountry.code.length);
        }
      }

      setFormData({
        fullName: profile.full_name || '',
        username: profile.username || '',
        avatarUrl: profile.avatar_url || '',
        countryCode,
        phoneNumber
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const updates = {
      full_name: formData.fullName,
      username: formData.username,
      avatar_url: formData.avatarUrl,
      phone_number: formData.phoneNumber ? `${formData.countryCode}${formData.phoneNumber}` : ''
    };

    const { error: updateError } = await updateProfile(updates);
    
    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
    
    setLoading(false);
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (passwordError) setPasswordError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password form
    if (!passwordData.currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      setPasswordError('New password is required');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });
      
      if (verifyError) {
        setPasswordError('Current password is incorrect');
        return;
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (updateError) {
        setPasswordError(updateError.message);
        return;
      }
      
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setPasswordSuccess(''), 3000);
      
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update your personal information and preferences
        </p>
      </div>

      {success && (
        <Alert color="success" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Picture Card */}
        <Card>
          <div className="flex flex-col items-center space-y-4">
            <Avatar
              img={formData.avatarUrl || undefined}
              size="xl"
              rounded={true}
            />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {profile?.full_name || 'User'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{profile?.username || 'username'}
              </p>
              <div className="flex items-center justify-center mt-2">
                <HiShieldCheck className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {profile?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="fullName" value="Full Name" />
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

                <div>
                  <Label htmlFor="username" value="Username" />
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
                </div>

                <div>
                  <Label htmlFor="email" value="Email Address" />
                  <TextInput
                    id="email"
                    type="email"
                    icon={HiMail}
                    value={user?.email || ''}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber" value="Phone Number" />
                  <div className="flex gap-2">
                    <div className="w-32">
                      <Select
                        id="countryCode"
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleChange}
                      >
                        {countryCodes.map((country, index) => (
                          <option key={index} value={country.code}>
                            {country.flag} {country.code}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex-1">
                      <TextInput
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        icon={HiPhone}
                        placeholder="Enter your phone number"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="avatarUrl" value="Avatar URL" />
                  <TextInput
                    id="avatarUrl"
                    name="avatarUrl"
                    type="url"
                    icon={HiPhotograph}
                    placeholder="Enter image URL"
                    value={formData.avatarUrl}
                    onChange={handleChange}
                    helperText="Enter a URL to your profile picture"
                  />
                </div>

                <div>
                  <Label htmlFor="role" value="Role" />
                  <TextInput
                    id="role"
                    type="text"
                    icon={HiShieldCheck}
                    value={profile?.role || 'user'}
                    disabled
                    helperText="Role is managed by administrators"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  size="lg"
                  gradientDuoTone="purpleToBlue"
                  className="w-full md:w-auto"
                  isProcessing={loading}
                  disabled={loading}
                >
                  {loading ? 'Updating Profile...' : 'Update Profile'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Password Change Section */}
      <Card>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
            <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Change Password
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update your account password for security
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <Alert color="success" onDismiss={() => setPasswordSuccess('')} className="mb-6">
            {passwordSuccess}
          </Alert>
        )}

        {passwordError && (
          <Alert color="failure" onDismiss={() => setPasswordError('')} className="mb-6">
            {passwordError}
          </Alert>
        )}

        <form className="space-y-6" onSubmit={handlePasswordSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Password */}
            <div>
              <Label htmlFor="currentPassword" value="Current Password *" />
              <div className="relative">
                <TextInput
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  icon={HiLockClosed}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword" value="New Password *" />
              <div className="relative">
                <TextInput
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  icon={HiLockClosed}
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" value="Confirm New Password *" />
              <div className="relative">
                <TextInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  icon={HiLockClosed}
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <HiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <HiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              size="lg"
              gradientDuoTone="redToYellow"
              className="w-full md:w-auto"
              isProcessing={passwordLoading}
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 