import React, { useEffect, useState, useMemo } from 'react';
import { Card, Button, Select, TextInput, Spinner, Alert, Badge } from 'flowbite-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  HiRefresh, 
  HiFilter, 
  HiChartBar, 
  HiChartPie, 
  HiTrendingUp,
  HiTrendingDown,
  HiCalendar,
  HiCurrencyDollar,
  HiUsers,
  HiStar,
  HiAcademicCap
} from 'react-icons/hi';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar, DollarSign } from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export default function AnalyticsDashboard() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [timeFilter, setTimeFilter] = useState('all'); // all, year, month
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [classTypeFilter, setClassTypeFilter] = useState('all');
  const [instructorFilter, setInstructorFilter] = useState('all');

  // Data states
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    if (user) {
      fetchAllAnalyticsData();
    }
  }, [user, timeFilter, selectedYear, selectedMonth, classTypeFilter, instructorFilter]);

  const fetchAllAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchIncomeData(),
        fetchExpenseData(),
        fetchClassTypes(),
        fetchInstructors()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeData = async () => {
    try {
      let query = supabase
        .from('incomes')
        .select(`
          *,
          profiles:user_id(full_name, email),
          class_types:class_type_id(name)
        `)
        .order('created_at', { ascending: true });

      // Apply user filter based on role
      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      // Apply time filters
      if (timeFilter === 'year') {
        query = query.gte('created_at', `${selectedYear}-01-01`);
        query = query.lt('created_at', `${selectedYear + 1}-01-01`);
      } else if (timeFilter === 'month') {
        const monthStr = String(selectedMonth).padStart(2, '0');
        query = query.gte('created_at', `${selectedYear}-${monthStr}-01`);
        if (selectedMonth === 12) {
          query = query.lt('created_at', `${selectedYear + 1}-01-01`);
        } else {
          const nextMonthStr = String(selectedMonth + 1).padStart(2, '0');
          query = query.lt('created_at', `${selectedYear}-${nextMonthStr}-01`);
        }
      }

      // Apply class type filter
      if (classTypeFilter !== 'all') {
        query = query.eq('class_type_id', classTypeFilter);
      }

      // Apply instructor filter
      if (instructorFilter !== 'all') {
        query = query.eq('user_id', instructorFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setIncomeData(data || []);
    } catch (err) {
      console.error('Error fetching income data:', err);
      throw err;
    }
  };

  const fetchExpenseData = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .order('created_at', { ascending: true });

      // Apply user filter based on role
      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      // Apply same time filters as income
      if (timeFilter === 'year') {
        query = query.gte('created_at', `${selectedYear}-01-01`);
        query = query.lt('created_at', `${selectedYear + 1}-01-01`);
      } else if (timeFilter === 'month') {
        const monthStr = String(selectedMonth).padStart(2, '0');
        query = query.gte('created_at', `${selectedYear}-${monthStr}-01`);
        if (selectedMonth === 12) {
          query = query.lt('created_at', `${selectedYear + 1}-01-01`);
        } else {
          const nextMonthStr = String(selectedMonth + 1).padStart(2, '0');
          query = query.lt('created_at', `${selectedYear}-${nextMonthStr}-01`);
        }
      }

      // Apply instructor filter
      if (instructorFilter !== 'all') {
        query = query.eq('user_id', instructorFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setExpenseData(data || []);
    } catch (err) {
      console.error('Error fetching expense data:', err);
      throw err;
    }
  };

  const fetchClassTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setClassTypes(data || []);
    } catch (err) {
      console.error('Error fetching class types:', err);
      // Don't throw error - class types are optional
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setInstructors(data || []);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      // Don't throw error - instructors filter is optional
    }
  };

  // Process data for charts
  const monthlyTrendData = useMemo(() => {
    if (!incomeData.length && !expenseData.length) return [];

    const monthlyData = {};
    
    // Process income data
    incomeData.forEach(income => {
      const date = new Date(income.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          income: 0,
          expenses: 0,
          profit: 0,
          transactions: 0
        };
      }
      
      monthlyData[monthKey].income += income.payment || 0;
      monthlyData[monthKey].transactions += 1;
    });

    // Process expense data
    expenseData.forEach(expense => {
      const date = new Date(expense.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          income: 0,
          expenses: 0,
          profit: 0,
          transactions: 0
        };
      }
      
      monthlyData[monthKey].expenses += expense.cost || 0;
    });

    // Calculate profit and format data
    return Object.values(monthlyData)
      .map(item => ({
        ...item,
        profit: item.income - item.expenses,
        monthName: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [incomeData, expenseData]);

  const classTypeDistribution = useMemo(() => {
    if (!incomeData.length) return [];

    const classTypeData = {};
    incomeData.forEach(income => {
      const className = income.class_types?.name || 'Other';
      classTypeData[className] = (classTypeData[className] || 0) + (income.payment || 0);
    });

    return Object.entries(classTypeData)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [incomeData]);

  const instructorPerformance = useMemo(() => {
    if (!incomeData.length) return [];

    const instructorData = {};
    incomeData.forEach(income => {
      const instructorName = income.profiles?.full_name || 'Unknown';
      const instructorId = income.user_id;
      
      if (!instructorData[instructorId]) {
        instructorData[instructorId] = {
          name: instructorName,
          totalIncome: 0,
          workshopCount: 0,
          totalParticipants: 0,
          avgPerWorkshop: 0
        };
      }
      
      instructorData[instructorId].totalIncome += income.payment || 0;
      instructorData[instructorId].workshopCount += 1;
      instructorData[instructorId].totalParticipants += income.guest_count || 0;
    });

    return Object.values(instructorData)
      .map(instructor => ({
        ...instructor,
        avgPerWorkshop: instructor.totalIncome / instructor.workshopCount
      }))
      .sort((a, b) => b.totalIncome - a.totalIncome)
      .slice(0, 10);
  }, [incomeData]);

  const summaryStats = useMemo(() => {
    const totalIncome = incomeData.reduce((sum, income) => sum + (income.payment || 0), 0);
    const totalExpenses = expenseData.reduce((sum, expense) => sum + (expense.cost || 0), 0);
    const totalProfit = totalIncome - totalExpenses;
    const totalWorkshops = incomeData.length;
    const totalParticipants = incomeData.reduce((sum, income) => sum + (income.guest_count || 0), 0);

    return {
      totalIncome,
      totalExpenses,
      totalProfit,
      totalWorkshops,
      totalParticipants,
      avgIncomePerWorkshop: totalWorkshops > 0 ? totalIncome / totalWorkshops : 0,
      profitMargin: totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0
    };
  }, [incomeData, expenseData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAvailableYears = () => {
    const years = new Set();
    [...incomeData, ...expenseData].forEach(item => {
      years.add(new Date(item.created_at).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Alert color="failure" className="mb-6">
          <span className="font-medium">Error loading analytics:</span> {error}
        </Alert>
        <Button onClick={fetchAllAnalyticsData} className="mt-4">
          <HiRefresh className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📊 Enhanced Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive financial insights and performance analytics
          </p>
        </div>
        <Button onClick={fetchAllAnalyticsData} color="gray" size="sm">
          <HiRefresh className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Period
            </label>
            <Select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
              <option value="all">All Time</option>
              <option value="year">Yearly</option>
              <option value="month">Monthly</option>
            </Select>
          </div>

          {timeFilter === 'year' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                {getAvailableYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </div>
          )}

          {timeFilter === 'month' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Year
                </label>
                <Select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Month
                </label>
                <Select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {new Date(2024, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}

          {classTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Class Type
              </label>
              <Select value={classTypeFilter} onChange={(e) => setClassTypeFilter(e.target.value)}>
                <option value="all">All Class Types</option>
                {classTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </Select>
            </div>
          )}

          {profile?.role === 'admin' && instructors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instructor
              </label>
              <Select value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)}>
                <option value="all">All Instructors</option>
                {instructors.map(instructor => (
                  <option key={instructor.id} value={instructor.id}>{instructor.full_name}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <HiCurrencyDollar className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Income</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(summaryStats.totalIncome)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <HiTrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(summaryStats.totalExpenses)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <HiTrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Net Profit</p>
              <p className={`text-lg font-bold ${
                summaryStats.totalProfit >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(summaryStats.totalProfit)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <HiAcademicCap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Workshops</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {summaryStats.totalWorkshops}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <HiUsers className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Participants</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {summaryStats.totalParticipants}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <HiTrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg/Workshop</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(summaryStats.avgIncomePerWorkshop)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <HiStar className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Profit Margin</p>
              <p className={`text-lg font-bold ${
                summaryStats.profitMargin >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {summaryStats.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Financial Trends
            </h3>
            <TrendingUp className="h-5 w-5 text-blue-500" />
          </div>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} name="Income" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No data available for selected period
            </div>
          )}
        </Card>

        {/* Class Type Distribution */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Class Type Distribution
            </h3>
            <PieChartIcon className="h-5 w-5 text-green-500" />
          </div>
          {classTypeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={classTypeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {classTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No class type data available
            </div>
          )}
        </Card>

        {/* Instructor Performance */}
        {profile?.role === 'admin' && instructorPerformance.length > 0 && (
          <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performing Instructors
              </h3>
              <BarChart3 className="h-5 w-5 text-purple-500" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={instructorPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="totalIncome" fill="#8B5CF6" name="Total Income" />
                <Bar dataKey="avgPerWorkshop" fill="#10B981" name="Avg Per Workshop" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Profit Over Time Area Chart */}
        <Card className="lg:col-span-2 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profit Trend Analysis
            </h3>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  name="Monthly Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              No profit data available for selected period
            </div>
          )}
        </Card>
      </div>

      {/* Data Quality Notice */}
      {(incomeData.length === 0 && expenseData.length === 0) && (
        <Card>
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No data available
            </h4>
            <p className="text-gray-500 dark:text-gray-400">
              Start adding income and expense records to see comprehensive analytics
            </p>
          </div>
        </Card>
      )}
    </div>
  );
} 