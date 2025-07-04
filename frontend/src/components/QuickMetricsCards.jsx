import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'flowbite-react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Globe,
  Target
} from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function QuickMetricsCards() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const currentYear = new Date().getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;

      // Fetch user's workshops
      const { data: workshops, error: workshopsError } = await supabase
        .from('workshops')
        .select('id, title, date, instructor_id')
        .eq('instructor_id', user.id);

      if (workshopsError) throw workshopsError;

      const workshopIds = workshops?.map(w => w.id) || [];

      // Fetch incomes for this year
      const { data: incomes, error: incomesError } = await supabase
        .from('incomes')
        .select('amount, created_at')
        .in('workshop_id', workshopIds.length > 0 ? workshopIds : [-1]) // Use -1 if no workshops to prevent empty array issue
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd);

      if (incomesError) throw incomesError;

      // Fetch expenses for this year
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, created_at')
        .in('workshop_id', workshopIds.length > 0 ? workshopIds : [-1])
        .gte('created_at', yearStart)
        .lte('created_at', yearEnd);

      if (expensesError) throw expensesError;

      // Fetch participants for all workshops
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id, workshop_id')
        .in('workshop_id', workshopIds.length > 0 ? workshopIds : [-1]);

      if (participantsError) throw participantsError;

      // Calculate totals
      const totalIncome = incomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      const netProfit = totalIncome - totalExpenses;

      // Calculate most popular workshop
      const workshopParticipants = {};
      participants?.forEach(participant => {
        workshopParticipants[participant.workshop_id] = (workshopParticipants[participant.workshop_id] || 0) + 1;
      });

      const mostPopularWorkshopId = Object.keys(workshopParticipants).reduce((a, b) => 
        workshopParticipants[a] > workshopParticipants[b] ? a : b, null
      );

      const mostPopularWorkshop = workshops?.find(w => w.id == mostPopularWorkshopId);
      const mostPopularCount = workshopParticipants[mostPopularWorkshopId] || 0;

      // Calculate year-over-year changes (simplified - comparing to last year)
      const lastYear = currentYear - 1;
      const lastYearStart = `${lastYear}-01-01`;
      const lastYearEnd = `${lastYear}-12-31`;

      const { data: lastYearIncomes } = await supabase
        .from('incomes')
        .select('amount')
        .in('workshop_id', workshopIds.length > 0 ? workshopIds : [-1])
        .gte('created_at', lastYearStart)
        .lte('created_at', lastYearEnd);

      const { data: lastYearExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .in('workshop_id', workshopIds.length > 0 ? workshopIds : [-1])
        .gte('created_at', lastYearStart)
        .lte('created_at', lastYearEnd);

      const lastYearIncome = lastYearIncomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
      const lastYearExpense = lastYearExpenses?.reduce((sum, expense) => sum + (expense.amount || 0), 0) || 0;
      const lastYearProfit = lastYearIncome - lastYearExpense;

      const incomeChange = lastYearIncome > 0 ? ((totalIncome - lastYearIncome) / lastYearIncome * 100) : 0;
      const expenseChange = lastYearExpense > 0 ? ((totalExpenses - lastYearExpense) / lastYearExpense * 100) : 0;
      const profitChange = lastYearProfit > 0 ? ((netProfit - lastYearProfit) / lastYearProfit * 100) : 0;

      setMetrics({
        totalIncome,
        totalExpenses,
        netProfit,
        totalWorkshops: workshops?.length || 0,
        totalParticipants: participants?.length || 0,
        mostPopularWorkshop: mostPopularWorkshop?.title || 'No workshops yet',
        mostPopularCount,
        incomeChange,
        expenseChange,
        profitChange
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatChange = (change) => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const getColorClasses = (color) => {
    const colorMap = {
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
      indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Metrics
        </h3>
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Metrics
        </h3>
        <div className="p-4 text-red-800 bg-red-50 dark:bg-red-900 dark:text-red-100 rounded-lg">
          Error loading metrics: {error}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const metricsData = [
    {
      id: 1,
      title: 'Total Income This Year',
      value: formatCurrency(metrics.totalIncome),
      change: formatChange(metrics.incomeChange),
      changeType: metrics.incomeChange >= 0 ? 'increase' : 'decrease',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 2,
      title: 'Total Expenses This Year',
      value: formatCurrency(metrics.totalExpenses),
      change: formatChange(metrics.expenseChange),
      changeType: metrics.expenseChange >= 0 ? 'increase' : 'decrease',
      icon: TrendingDown,
      color: 'red'
    },
    {
      id: 3,
      title: 'Net Profit',
      value: formatCurrency(metrics.netProfit),
      change: formatChange(metrics.profitChange),
      changeType: metrics.profitChange >= 0 ? 'increase' : 'decrease',
      icon: Target,
      color: 'blue'
    },
    {
      id: 4,
      title: 'Most Popular Workshop',
      value: metrics.mostPopularWorkshop,
      subtitle: `${metrics.mostPopularCount} participants`,
      icon: Globe,
      color: 'purple'
    },
    {
      id: 5,
      title: 'Total Workshops',
      value: metrics.totalWorkshops.toString(),
      change: `+${metrics.totalWorkshops}`,
      changeType: 'increase',
      icon: Calendar,
      color: 'orange'
    },
    {
      id: 6,
      title: 'Total Participants',
      value: metrics.totalParticipants.toLocaleString(),
      change: `+${metrics.totalParticipants}`,
      changeType: 'increase',
      icon: Users,
      color: 'indigo'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Quick Metrics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricsData.map((metric) => (
          <Card 
            key={metric.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex flex-col items-center text-center p-2">
              <div className={`p-2 rounded-full ${getColorClasses(metric.color)} mb-2`}>
                <metric.icon className="h-5 w-5" />
              </div>
              
              <div className="space-y-1">
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {metric.title}
                </h4>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                
                {metric.change && (
                  <div className={`text-xs flex items-center justify-center ${
                    metric.changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.changeType === 'increase' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {metric.change}
                  </div>
                )}
                
                {metric.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metric.subtitle}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 