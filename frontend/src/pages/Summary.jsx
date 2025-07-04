import React, { useEffect, useState } from 'react';
import { Card, Spinner, Button } from 'flowbite-react';
import { HiRefresh, HiCurrencyDollar, HiCreditCard, HiTrendingUp } from 'react-icons/hi';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

// Enhanced components
import QuickMetricsCards from '../components/QuickMetricsCards';
import UpcomingEvents from '../components/UpcomingEvents';
import FinancialInsights from '../components/FinancialInsights';
import MiniChartsPanel from '../components/MiniChartsPanel';
import UserProfileSnapshot from '../components/UserProfileSnapshot';
import RecentActivityFeed from '../components/RecentActivityFeed';

export default function Summary() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch user's workshops first
      const { data: workshops, error: workshopsError } = await supabase
        .from('workshops')
        .select('id')
        .eq('instructor_id', user.id);

      if (workshopsError) throw workshopsError;

      const workshopIds = workshops?.map(w => w.id) || [];

      // Fetch user's income data
      const { data: incomes, error: incomeError } = await supabase
        .from('incomes')
        .select('amount')
        .in('workshop_id', workshopIds.length > 0 ? workshopIds : [-1]);

      if (incomeError) throw incomeError;

      // Fetch user's expense data
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .in('workshop_id', workshopIds.length > 0 ? workshopIds : [-1]);

      if (expenseError) throw expenseError;

      // Calculate totals
      const totalIncome = incomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      const totalProfit = totalIncome - totalExpenses;

      setSummary({
        totalIncome,
        totalExpenses,
        totalProfit
      });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchSummary();
    }
  }, [user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Financial Summary
        </h1>
        <Button onClick={fetchSummary} size="sm" color="gray">
          <HiRefresh className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      ) : error ? (
        <div className="p-4 text-red-800 bg-red-50 dark:bg-red-900 dark:text-red-100 rounded-lg">
          {error}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Total Income
                </p>
                <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(summary.totalIncome)}
                </h3>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <HiCurrencyDollar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total earnings from all workshops and classes
              </p>
            </div>
          </Card>

          <Card className="transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Total Expenses
                </p>
                <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(summary.totalExpenses)}
                </h3>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                <HiCreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total costs from all categories
              </p>
            </div>
          </Card>

          <Card className="transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Net Profit
                </p>
                <h3 className={`text-2xl font-bold ${
                  summary.totalProfit >= 0 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(summary.totalProfit)}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <HiTrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total profit after expenses
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Enhanced Financial Summary Components */}
      {!loading && !error && (
        <div className="space-y-8 mt-8">
          {/* Quick Metrics Cards */}
          <QuickMetricsCards />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Upcoming Events */}
              <UpcomingEvents />
              
              {/* Financial Insights */}
              <FinancialInsights />
              
              {/* Recent Activity Feed */}
              <RecentActivityFeed />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* User Profile Snapshot */}
              <UserProfileSnapshot />
              
              {/* Mini Charts Panel */}
              <MiniChartsPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 