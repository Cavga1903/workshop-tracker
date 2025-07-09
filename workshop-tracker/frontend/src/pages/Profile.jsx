import React, { useState, useEffect } from 'react';
import { Card, Label, TextInput, Button, Alert, Avatar, Select, Badge, Tabs } from 'flowbite-react';
import { 
  HiUser, HiMail, HiPhone, HiPhotograph, HiShieldCheck, HiLockClosed, 
  HiEye, HiEyeOff, HiPencil, HiCamera, HiCheckCircle, HiExclamationCircle, HiInformationCircle 
} from 'react-icons/hi';
import { 
  Shield, Lock, User as UserIcon, Settings, Eye, EyeOff, Edit3, 
  MapPin, Calendar, Award, Star, Zap, Bell, Globe, Moon, Sun 
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    countryCode: '+90',
    phoneNumber: '',
    avatarUrl: ''
  });

  // Load profile data
  useEffect(() => {
    if (profile) {
      // Parse phone number to extract country code and number
      let countryCode = '+90';
      let phoneNumber = '';
      
      if (profile.phone_number) {
        const matchedCountry = countryCodes.find(country => 
          profile.phone_number.startsWith(country.code)
        );
        if (matchedCountry) {
          countryCode = matchedCountry.code;
          phoneNumber = profile.phone_number.substring(matchedCountry.code.length);
        } else {
          phoneNumber = profile.phone_number;
        }
      }

      setFormData({
        fullName: profile.full_name || '',
        username: profile.username || '',
        countryCode: countryCode,
        phoneNumber: phoneNumber,
        avatarUrl: profile.avatar_url || ''
      });
      
      // Set avatar preview if avatar URL exists
      if (profile.avatar_url) {
        setAvatarPreview(profile.avatar_url);
      }
    }
  }, [profile]);

  // Show loading if no profile yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Loading your profile...
          </h2>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If avatar URL changes, update preview
    if (name === 'avatarUrl') {
      if (value && value.startsWith('http')) {
        setAvatarPreview(value);
      } else if (!value) {
        setAvatarPreview(null);
      }
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processAvatarFile(file);
    }
  };

  const processAvatarFile = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      // Create preview URL immediately for better UX
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage error:', error);
        
        // If bucket doesn't exist, show a more user-friendly message
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          setError('Avatar upload is not configured yet. Please contact support or try again later.');
        } else {
          setError('Failed to upload image. Please try again.');
        }
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update form data with the public URL
      setFormData(prev => ({
        ...prev,
        avatarUrl: urlData.publicUrl
      }));

    } catch (err) {
      console.error('Error processing file:', err);
      setError('Failed to process image. Please try again.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processAvatarFile(files[0]);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setFormData(prev => ({
      ...prev,
      avatarUrl: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      // Prepare phone number with country code
      const fullPhoneNumber = formData.countryCode && formData.phoneNumber 
        ? `${formData.countryCode}${formData.phoneNumber}` 
        : '';

      // Prepare update data
      const updateData = {
        full_name: formData.fullName,
        username: formData.username,
        avatar_url: formData.avatarUrl,
        phone_number: fullPhoneNumber,
        email: user.email,
        updated_at: new Date().toISOString()
      };

      // Update profile using AuthContext's updateProfile function
      const { error: updateError } = await updateProfile(updateData);

      if (updateError) {
        console.error('Profile update error:', updateError);
        
        // Handle specific error cases
        if (updateError.code === '23505' && updateError.message.includes('username')) {
          setError('Username already exists. Please choose a different username.');
        } else {
          setError(`Failed to update profile: ${updateError.message}`);
        }
        return;
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear preview after successful update
      setAvatarPreview(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password form
    if (!passwordData.currentPassword) {
      setError('Current password is required');
      return;
    }
    
    if (!passwordData.newPassword) {
      setError('New password is required');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });
      
      if (verifyError) {
        setError('Current password is incorrect');
        return;
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });
      
      if (updateError) {
        setError(updateError.message);
        return;
      }
      
      setSuccess('Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Function to get avatar source - prioritize preview over URL
  const getAvatarSrc = () => {
    if (avatarPreview) {
      return avatarPreview;
    }
    if (formData.avatarUrl) {
      return formData.avatarUrl;
    }
    return null;
  };

  // Function to get avatar display - fallback to initials
  const getAvatarDisplay = () => {
    const src = getAvatarSrc();
    if (src) {
      return (
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <img 
            src={src} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="w-full h-full bg-blue-500 text-white text-2xl font-bold flex items-center justify-center" style={{display: 'none'}}>
            {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'T'}
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-20 h-20 rounded-full bg-blue-500 text-white text-2xl font-bold flex items-center justify-center">
        {user?.user_metadata?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'T'}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Alert Messages */}
        {success && (
          <Alert color="success" className="mb-6">
            <HiCheckCircle className="mr-2 h-5 w-5" />
            <span>{success}</span>
          </Alert>
        )}

        {error && (
          <Alert color="failure" className="mb-6">
            <HiExclamationCircle className="mr-2 h-5 w-5" />
            <span>{error}</span>
          </Alert>
        )}

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {getAvatarDisplay()}
                {isEditing && (avatarPreview || formData.avatarUrl) && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formData.fullName || 'Tolga Çavga'}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  @{formData.username || 'tcavga1903'}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <HiMail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  {formData.phoneNumber && (
                    <div className="flex items-center space-x-1">
                      <HiPhone className="w-4 h-4" />
                      <span>{formData.countryCode}{formData.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</p>
              <Badge color="success" className="mt-1">
                Verified
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-8 py-4">
              {[
                { id: 'profile', label: 'Profile Information', icon: UserIcon },
                { id: 'security', label: 'Security & Privacy', icon: Shield },
                { id: 'settings', label: 'Preferences', icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-8">
                {/* Profile Edit Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Profile Information
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Update your personal details and contact information
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    color="light"
                    className="border-gray-300 dark:border-gray-600"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Avatar Section */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Profile Picture
                    </h3>
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        {getAvatarDisplay()}
                        {isEditing && (avatarPreview || formData.avatarUrl) && (
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex-1 max-w-md space-y-4">
                          <div>
                            <Label value="Upload Image" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                            
                            {/* Drag & Drop Area */}
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                                isDragOver
                                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <HiCamera className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                              <div className="mt-2">
                                <label className="cursor-pointer">
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                                    Click to upload
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400"> or drag and drop</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="sr-only"
                                  />
                                </label>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                PNG, JPG, GIF up to 5MB
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <span className="text-sm">or</span>
                          </div>
                          
                          <div>
                            <Label htmlFor="avatarUrl" value="Image URL" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                            <TextInput
                              id="avatarUrl"
                              name="avatarUrl"
                              type="url"
                              placeholder="https://example.com/avatar.jpg"
                              value={formData.avatarUrl}
                              onChange={handleChange}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Personal Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="fullName" value="Full Name" />
                          <TextInput
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="username" value="Username" />
                          <TextInput
                            id="username"
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Contact Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email" value="Email Address" />
                          <TextInput
                            id="email"
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Email cannot be changed. Contact support if needed.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="phoneNumber" value="Phone Number" />
                          <div className="flex space-x-2 mt-1">
                            <Select
                              id="countryCode"
                              name="countryCode"
                              value={formData.countryCode}
                              onChange={handleChange}
                              disabled={!isEditing}
                              className="w-32"
                            >
                              {countryCodes.map((country, index) => (
                                <option key={index} value={country.code}>
                                  {country.flag} {country.code}
                                </option>
                              ))}
                            </Select>
                            <TextInput
                              id="phoneNumber"
                              name="phoneNumber"
                              type="tel"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                              disabled={!isEditing}
                              className="flex-1"
                              placeholder="5400729264"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  {isEditing && (
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        type="button"
                        color="light"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        color="blue"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                {/* Security Header */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Security & Privacy
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage your account security and privacy settings
                  </p>
                </div>

                {/* Security Status */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Account Security
                        </h3>
                        <p className="text-green-600 dark:text-green-400 text-sm">
                          Your account is secure
                        </p>
                      </div>
                    </div>
                    <Badge color="success">
                      Strong
                    </Badge>
                  </div>
                </div>

                {/* Password Change */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Change Password
                  </h3>

                  {success && (
                    <Alert color="success" className="mb-4">
                      <HiCheckCircle className="mr-2 h-5 w-5" />
                      {success}
                    </Alert>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" value="Current Password" />
                      <div className="relative mt-1">
                        <TextInput
                          id="currentPassword"
                          name="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newPassword" value="New Password" />
                        <div className="relative mt-1">
                          <TextInput
                            id="newPassword"
                            name="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter new password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword" value="Confirm New Password" />
                        <div className="relative mt-1">
                          <TextInput
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Confirm new password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        color="blue"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Security Tips */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Security Tips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Strong Password</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Use 8+ characters with mix of letters, numbers, and symbols</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Regular Updates</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Keep your profile information current</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Settings Header */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Preferences & Settings
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Customize your experience and manage notifications
                  </p>
                </div>

                {/* Coming Soon */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 text-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 mx-auto mb-4">
                    <Settings className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Advanced settings and customization options will be available here soon.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 