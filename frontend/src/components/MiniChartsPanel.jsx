import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'flowbite-react';
import { 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function MiniChartsPanel() {
  const { user } = useAuth();
  const [monthlyIncomeData, setMonthlyIncomeData] = useState([]);
  const [classPopularityData, setClassPopularityData] = useState([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchChartsData();
    }
  }, [user]);

  const fetchChartsData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch user's incomes for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: incomes, error: incomesError } = await supabase
        .from('incomes')
        .select('payment, created_at, name, guest_count')
        .eq('user_id', user.id)
        .gte('created_at', sixMonthsAgo.toISOString());

      if (incomesError) throw incomesError;

      // Fetch user's expenses for categorization
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('cost, name, created_at, category')
        .eq('user_id', user.id);

      if (expensesError) throw expensesError;

      // Process monthly income data
      const processedMonthlyData = processMonthlyIncomeData(incomes || []);
      setMonthlyIncomeData(processedMonthlyData);

      // Process workshop popularity data (based on guest count)
      const processedPopularityData = processWorkshopPopularityData(incomes || []);
      setClassPopularityData(processedPopularityData);

      // Process expense breakdown data
      const processedExpenseData = processExpenseBreakdownData(expenses || []);
      setExpenseBreakdownData(processedExpenseData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyIncomeData = (incomes) => {
    const now = new Date();
    const monthlyData = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      monthlyData[monthKey] = { month: monthKey, income: 0 };
    }

    // Aggregate income by month
    incomes.forEach(income => {
      const date = new Date(income.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].income += income.payment || 0;
      }
    });

    return Object.values(monthlyData);
  };

  const processWorkshopPopularityData = (incomes) => {
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

    // Calculate total participants
    const totalParticipants = incomes.reduce((sum, income) => sum + (income.guest_count || 0), 0);
    if (totalParticipants === 0) return [];

    // Create chart data based on guest count
    const popularWorkshops = incomes
      .filter(income => income.guest_count > 0)
      .map((income, index) => ({
        name: income.name || 'Unknown Workshop',
        value: Math.round((income.guest_count / totalParticipants) * 100),
        count: income.guest_count,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Top 4 workshops

    return popularWorkshops;
  };

  const processExpenseBreakdownData = (expenses) => {
    const categories = {};

    // Group expenses by category
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      categories[category] = (categories[category] || 0) + (expense.cost || 0);
    });

    return Object.entries(categories)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4); // Top 4 categories
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {label}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {payload[0].name}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {payload[0].value}% ({payload[0].payload.count} participants)
          </p>
        </div>
      );
    }
    return null;
  };

  const calculateGrowth = () => {
    if (monthlyIncomeData.length < 2) return '+0%';
    const current = monthlyIncomeData[monthlyIncomeData.length - 1]?.income || 0;
    const previous = monthlyIncomeData[monthlyIncomeData.length - 2]?.income || 0;
    if (previous === 0) return '+0%';
    const growth = ((current - previous) / previous) * 100;
    return `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  const getTotalExpenses = () => {
    return expenseBreakdownData.reduce((sum, item) => sum + item.amount, 0);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Performance Overview
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
          Performance Overview
        </h3>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="p-4 text-red-800 bg-red-50 dark:bg-red-900 dark:text-red-100 rounded-lg">
            Error loading charts: {error}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Performance Overview
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Income Trend */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Monthly Income Trend
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last 6 months
                </p>
              </div>
            </div>
            
            <div className="h-32">
              {monthlyIncomeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyIncomeData}>
                    <XAxis 
                      dataKey="month" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 4, fill: '#1D4ED8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                  No data available
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Growth</span>
              <span className={`font-medium ${
                calculateGrowth().startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {calculateGrowth()}
              </span>
            </div>
          </div>
        </Card>

        {/* Class Popularity */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <PieChartIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Workshop Popularity
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By enrollment
                </p>
              </div>
            </div>
            
            <div className="h-32">
              {classPopularityData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classPopularityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {classPopularityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                  No workshops yet
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              {classPopularityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-400 truncate" title={item.name}>
                      {item.name.length > 15 ? `${item.name.substring(0, 15)}...` : item.name}
                    </span>
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <BarChart3 className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Expense Breakdown
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By category
                </p>
              </div>
            </div>
            
            <div className="h-32">
              {expenseBreakdownData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseBreakdownData}>
                    <XAxis 
                      dataKey="category" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#6B7280' }}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="amount" 
                      fill="#EF4444"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
                  No expenses yet
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatCurrency(getTotalExpenses())}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 