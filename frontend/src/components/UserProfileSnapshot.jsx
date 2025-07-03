import React from 'react';
import { Card } from 'flowbite-react';
import { 
  User, 
  Calendar, 
  Users, 
  Clock, 
  Award,
  MapPin,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfileSnapshot() {
  const { user, profile } = useAuth();

  // Mock data for user stats
  const userStats = {
    totalWorkshops: 89,
    totalParticipants: 1247,
    totalRevenue: 45230,
    averageRating: 4.8,
    completionRate: 96,
    lastLogin: '2 hours ago',
    memberSince: 'January 2023',
    favoriteLocation: 'Zoom',
    responseTime: '< 1 hour'
  };

  const achievements = [
    { name: 'Top Instructor', color: 'bg-yellow-100 text-yellow-800', icon: Award },
    { name: '1000+ Students', color: 'bg-blue-100 text-blue-800', icon: Users },
    { name: 'Perfect Rating', color: 'bg-green-100 text-green-800', icon: Award }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Profile Overview
      </h3>

      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {profile?.full_name || 'Workshop Instructor'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Workshop Instructor & Educator
                  </p>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Mail className="h-3 w-3 mr-1" />
                  {user?.email}
                </div>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  Last login: {userStats.lastLogin}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userStats.totalWorkshops}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Workshops
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {userStats.totalParticipants.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Participants
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(userStats.totalRevenue)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Total Revenue
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {userStats.averageRating}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Average Rating
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
              Achievements
            </h5>
            <div className="flex flex-wrap gap-2">
              {achievements.map((achievement, index) => (
                <span 
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${achievement.color}`}
                >
                  <achievement.icon className="h-3 w-3 mr-1" />
                  {achievement.name}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-500 dark:text-gray-400">Member since:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{userStats.memberSince}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-500 dark:text-gray-400">Favorite platform:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{userStats.favoriteLocation}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-500 dark:text-gray-400">Response time:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{userStats.responseTime}</span>
              </div>
              
              <div className="flex items-center text-sm">
                <Award className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-500 dark:text-gray-400">Completion rate:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{userStats.completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 