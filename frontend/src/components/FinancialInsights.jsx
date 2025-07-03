import React from 'react';
import { Card } from 'flowbite-react';
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

export default function FinancialInsights() {
  const insights = [
    {
      id: 1,
      type: 'positive',
      title: 'Income Growth',
      message: 'Your workshop income increased by 18% compared to last month',
      emoji: '🚀',
      icon: TrendingUp,
      color: 'green',
      action: 'Keep up the great work!'
    },
    {
      id: 2,
      type: 'warning',
      title: 'High Supply Costs',
      message: 'Spending on art supplies and materials is unusually high this month',
      emoji: '🎨',
      icon: AlertTriangle,
      color: 'orange',
      action: 'Review material costs'
    },
    {
      id: 3,
      type: 'suggestion',
      title: 'Popular Workshop Alert',
      message: 'Terrarium workshops have 95% attendance - consider adding more sessions',
      emoji: '🌿',
      icon: Lightbulb,
      color: 'blue',
      action: 'Schedule more sessions'
    },
    {
      id: 4,
      type: 'achievement',
      title: 'Milestone Reached',
      message: 'Congratulations! You\'ve taught 1,000+ creative souls this year',
      emoji: '🎉',
      icon: Star,
      color: 'purple',
      action: 'Celebrate your success!'
    },
    {
      id: 5,
      type: 'info',
      title: 'Seasonal Trend',
      message: 'Holiday craft workshops typically generate 25% more revenue',
      emoji: '🎄',
      icon: Info,
      color: 'indigo',
      action: 'Plan holiday workshops'
    },
    {
      id: 6,
      type: 'suggestion',
      title: 'Optimal Schedule',
      message: 'Weekend workshops have the highest attendance - consider expanding weekend slots',
      emoji: '📅',
      icon: Target,
      color: 'teal',
      action: 'Update schedule'
    }
  ];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          AI Financial Insights
        </h3>
      </div>

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