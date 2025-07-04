import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'flowbite-react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb, 
  Target,
  Zap,
  Star,
  Info
} from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function FinancialInsights() {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const currentMonth = new Date();
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
      const currentYear = new Date().getFullYear();

      // Fetch user's incomes (each income represents a workshop/class)
      const { data: allIncomes, error: allIncomesError } = await supabase
        .from('incomes')
        .select('payment, created_at, name, platform, guest_count')
        .eq('user_id', user.id);

      if (allIncomesError) throw allIncomesError;

      // Filter current month incomes
      const currentMonthIncomes = allIncomes?.filter(income => {
        const incomeDate = new Date(income.created_at);
        return incomeDate.getFullYear() === currentMonth.getFullYear() && 
               incomeDate.getMonth() === currentMonth.getMonth();
      }) || [];

      // Filter last month incomes
      const lastMonthIncomes = allIncomes?.filter(income => {
        const incomeDate = new Date(income.created_at);
        return incomeDate.getFullYear() === lastMonth.getFullYear() && 
               incomeDate.getMonth() === lastMonth.getMonth();
      }) || [];

      // Fetch user's expenses
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('cost, name, created_at')
        .eq('user_id', user.id)
        .gte('created_at', `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-01`);

      if (expenseError) throw expenseError;

      // Calculate insights
      const generatedInsights = generateInsights({
        currentMonthIncomes: currentMonthIncomes || [],
        lastMonthIncomes: lastMonthIncomes || [],
        expenses: expenses || [],
        allIncomes: allIncomes || []
      });

      setInsights(generatedInsights);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (data) => {
    const insights = [];
    const currentMonthIncome = data.currentMonthIncomes.reduce((sum, income) => sum + (income.payment || 0), 0);
    const lastMonthIncome = data.lastMonthIncomes.reduce((sum, income) => sum + (income.payment || 0), 0);
    const totalExpenses = data.expenses.reduce((sum, expense) => sum + (expense.cost || 0), 0);
    const totalParticipants = data.allIncomes.reduce((sum, income) => sum + (income.guest_count || 0), 0);
    const totalWorkshops = data.allIncomes.length;

    // Income Growth/Decline Insight
    if (lastMonthIncome > 0) {
      const incomeChange = ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
      if (incomeChange > 10) {
        insights.push({
          id: 1,
          type: 'positive',
          title: 'Income Growth',
          message: `Your workshop income increased by ${incomeChange.toFixed(1)}% compared to last month`,
          emoji: '🚀',
          icon: TrendingUp,
          color: 'green',
          action: 'Keep up the great work!'
        });
      } else if (incomeChange < -10) {
        insights.push({
          id: 1,
          type: 'warning',
          title: 'Income Decline',
          message: `Your workshop income decreased by ${Math.abs(incomeChange).toFixed(1)}% compared to last month`,
          emoji: '📉',
          icon: TrendingDown,
          color: 'orange',
          action: 'Review strategy'
        });
      }
    }

    // Expense Analysis
    const avgMonthlyExpenses = totalExpenses; // This would be better with historical data
    if (totalExpenses > 0 && currentMonthIncome > 0) {
      const expenseRatio = (totalExpenses / currentMonthIncome) * 100;
      if (expenseRatio > 50) {
        insights.push({
          id: 2,
          type: 'warning',
          title: 'High Expense Ratio',
          message: `Expenses are ${expenseRatio.toFixed(1)}% of income this month`,
          emoji: '💰',
          icon: AlertTriangle,
          color: 'orange',
          action: 'Review costs'
        });
      }
    }

    // Workshop Popularity (based on guest count)
    const mostPopularWorkshop = data.allIncomes.reduce((prev, current) => {
      return (current.guest_count > prev.guest_count) ? current : prev;
    }, { guest_count: 0 });

    if (mostPopularWorkshop.guest_count > 0) {
      const avgGuestCount = totalParticipants / totalWorkshops;
      if (mostPopularWorkshop.guest_count > avgGuestCount * 1.5) {
        insights.push({
          id: 3,
          type: 'suggestion',
          title: 'Popular Workshop Alert',
          message: `${mostPopularWorkshop.name} had high attendance (${mostPopularWorkshop.guest_count} participants) - consider adding more sessions`,
          emoji: '🌟',
          icon: Lightbulb,
          color: 'blue',
          action: 'Schedule more sessions'
        });
      }
    }

    // Milestone Achievement
    if (totalParticipants > 1000) {
      insights.push({
        id: 4,
        type: 'achievement',
        title: 'Milestone Reached',
        message: `Congratulations! You've taught ${totalParticipants.toLocaleString()} creative souls`,
        emoji: '🎉',
        icon: Star,
        color: 'purple',
        action: 'Celebrate your success!'
      });
    } else if (totalParticipants > 500) {
      insights.push({
        id: 4,
        type: 'achievement',
        title: 'Great Progress',
        message: `Amazing! You've reached ${totalParticipants} participants`,
        emoji: '👏',
        icon: Star,
        color: 'purple',
        action: 'Keep growing!'
      });
    }

    // Platform Analysis
    const platformCounts = {};
    data.allIncomes.forEach(income => {
      const platform = income.platform || 'Unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    const mostUsedPlatform = Object.keys(platformCounts).reduce((a, b) => 
      platformCounts[a] > platformCounts[b] ? a : b, null
    );

    if (mostUsedPlatform && mostUsedPlatform !== 'Unknown') {
      insights.push({
        id: 5,
        type: 'info',
        title: 'Platform Preference',
        message: `${mostUsedPlatform} is your most used platform with ${platformCounts[mostUsedPlatform]} workshops`,
        emoji: '🖥️',
        icon: Info,
        color: 'indigo',
        action: 'Optimize platform'
      });
    }

    // Profit Margin Insight
    if (currentMonthIncome > 0 && totalExpenses > 0) {
      const profitMargin = ((currentMonthIncome - totalExpenses) / currentMonthIncome) * 100;
      if (profitMargin > 70) {
        insights.push({
          id: 6,
          type: 'positive',
          title: 'Excellent Profit Margin',
          message: `Your profit margin is ${profitMargin.toFixed(1)}% - excellent financial performance`,
          emoji: '💚',
          icon: Target,
          color: 'green',
          action: 'Maintain efficiency'
        });
      }
    }

    return insights.slice(0, 6); // Return max 6 insights
  };

  const getColorClasses = (color, type) => {
    const colorMap = {
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        icon: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
        text: 'text-green-800 dark:text-green-200'
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
        icon: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
        text: 'text-orange-800 dark:text-orange-200'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        icon: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        icon: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
        text: 'text-purple-800 dark:text-purple-200'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
        icon: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400',
        text: 'text-indigo-800 dark:text-indigo-200'
      },
      teal: {
        bg: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
        icon: 'bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400',
        text: 'text-teal-800 dark:text-teal-200'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const getTypeIcon = (type) => {
    const iconMap = {
      positive: TrendingUp,
      warning: AlertTriangle,
      suggestion: Lightbulb,
      achievement: Star,
      info: Info
    };
    return iconMap[type] || Info;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Financial Insights
          </h3>
        </div>
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
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Financial Insights
          </h3>
        </div>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="p-4 text-red-800 bg-red-50 dark:bg-red-900 dark:text-red-100 rounded-lg">
            Error loading insights: {error}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Financial Insights
        </h3>
      </div>

      {insights.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const colors = getColorClasses(insight.color, insight.type);
            const TypeIcon = getTypeIcon(insight.type);
            
            return (
              <Card 
                key={insight.id} 
                className={`border-2 ${colors.bg} hover:shadow-lg transition-all duration-200 hover:scale-105`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${colors.icon} flex-shrink-0`}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-sm font-semibold ${colors.text}`}>
                          {insight.title}
                        </h4>
                        <span className="text-lg">{insight.emoji}</span>
                      </div>
                    </div>
                    
                    <p className={`text-sm ${colors.text} mt-1 leading-relaxed`}>
                      {insight.message}
                    </p>
                    
                    <div className="mt-3">
                      <button className={`text-xs font-medium px-3 py-1 rounded-full border 
                        ${colors.text} hover:bg-white dark:hover:bg-gray-800 transition-colors duration-200`}>
                        {insight.action}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No insights available yet
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              Start adding workshops and income data to see AI-powered insights
            </p>
          </div>
        </Card>
      )}

      {/* AI Powered Badge */}
      <div className="flex items-center justify-center mt-6">
        <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full">
          <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Powered by AI Analytics
          </span>
        </div>
      </div>
    </div>
  );
} 