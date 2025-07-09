import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'flowbite-react';
import { 
  Plus, 
  Edit, 
  DollarSign, 
  CreditCard, 
  Users, 
  Calendar, 
  Trash2,
  Clock,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function RecentActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [activityCounts, setActivityCounts] = useState({
    incomes: 0,
    expenses: 0,
    workshops: 0,
    participants: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchRecentActivities();
    }
  }, [user]);

  const fetchRecentActivities = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch user's recent incomes
      const { data: incomes, error: incomesError } = await supabase
        .from('incomes')
        .select('id, payment, name, created_at, guest_count')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (incomesError) throw incomesError;

      // Fetch user's recent expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('id, cost, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (expensesError) throw expensesError;

      // Combine and process all activities
      const allActivities = [];

      // Process incomes
      incomes?.forEach(income => {
        allActivities.push({
          id: `income_${income.id}`,
          type: 'income_added',
          title: 'Workshop income received',
          description: `${income.name} - ${income.guest_count} participants`,
          amount: `$${income.payment}`,
          time: getTimeAgo(income.created_at),
          timestamp: new Date(income.created_at),
          icon: DollarSign,
          color: 'green'
        });
      });

      // Process expenses
      expenses?.forEach(expense => {
        allActivities.push({
          id: `expense_${expense.id}`,
          type: 'expense_added',
          title: 'Expense added',
          description: expense.name,
          amount: `$${expense.cost}`,
          time: getTimeAgo(expense.created_at),
          timestamp: new Date(expense.created_at),
          icon: CreditCard,
          color: 'red'
        });
      });

      // Sort all activities by timestamp (newest first) and take top 10
      const sortedActivities = allActivities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      setActivities(sortedActivities);

      // Set activity counts
      setActivityCounts({
        incomes: incomes?.length || 0,
        expenses: expenses?.length || 0,
        workshops: incomes?.length || 0,
        participants: incomes?.reduce((sum, income) => sum + (income.guest_count || 0), 0) || 0
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMinutes = Math.floor((now - past) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} days ago`;
    if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 10080)} weeks ago`;
    return `${Math.floor(diffInMinutes / 43200)} months ago`;
  };

  const getColorClasses = (color) => {
    const colorMap = {
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      gray: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getAmountColor = (type) => {
    if (type.includes('income') || type.includes('payment_received')) {
      return 'text-green-600 dark:text-green-400';
    }
    if (type.includes('expense') || type.includes('deleted')) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="p-4 text-red-800 bg-red-50 dark:bg-red-900 dark:text-red-100 rounded-lg">
            Error loading activities: {error}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Activity
        </h3>
        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center">
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      <Card className="hover:shadow-lg transition-shadow duration-200">
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className={`flex items-start space-x-4 ${
                  index !== activities.length - 1 ? 'pb-4 border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                {/* Timeline Icon */}
                <div className="relative">
                  <div className={`p-2 rounded-full ${getColorClasses(activity.color)}`}>
                    <activity.icon className="h-4 w-4" />
                  </div>
                  {index !== activities.length - 1 && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-px h-6 bg-gray-200 dark:bg-gray-700" />
                  )}
                </div>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.title}
                        </h4>
                        {activity.amount && (
                          <span className={`text-sm font-semibold ${getAmountColor(activity.type)}`}>
                            {activity.amount}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activity.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No recent activity
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              Start adding workshops, income, and expenses to see activity here
            </p>
          </div>
        )}
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {activityCounts.incomes}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Recent Income
            </div>
          </div>
        </Card>
        
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {activityCounts.expenses}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Recent Expenses
            </div>
          </div>
        </Card>
        
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {activityCounts.workshops}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Recent Workshops
            </div>
          </div>
        </Card>
        
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {activityCounts.participants}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              New Participants
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 