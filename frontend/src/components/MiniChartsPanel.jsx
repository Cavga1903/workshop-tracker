import React from 'react';
import { Card } from 'flowbite-react';
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

export default function MiniChartsPanel() {
  // Mock data for monthly income trend
  const monthlyIncomeData = [
    { month: 'Jul', income: 2400 },
    { month: 'Aug', income: 3200 },
    { month: 'Sep', income: 2800 },
    { month: 'Oct', income: 3600 },
    { month: 'Nov', income: 4200 },
    { month: 'Dec', income: 4800 }
  ];

  // Mock data for workshop popularity
  const classPopularityData = [
    { name: 'Terrarium Design', value: 35, color: '#3B82F6' },
    { name: 'Candle Making', value: 28, color: '#EF4444' },
    { name: 'Botanical Art', value: 20, color: '#10B981' },
    { name: 'Mosaic Crafts', value: 17, color: '#F59E0B' }
  ];

  // Mock data for expense breakdown
  const expenseBreakdownData = [
    { category: 'Art Supplies', amount: 1200 },
    { category: 'Studio Rent', amount: 800 },
    { category: 'Materials', amount: 600 },
    { category: 'Equipment', amount: 400 }
  ];

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
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

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
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Growth</span>
              <span className="text-green-600 dark:text-green-400 font-medium">+18%</span>
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
            </div>
            
            <div className="space-y-1">
              {classPopularityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600 dark:text-gray-400">{item.name}</span>
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
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Total</span>
              <span className="text-gray-900 dark:text-white font-medium">$3,000</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 