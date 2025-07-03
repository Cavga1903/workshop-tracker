import React from 'react';
import { Card } from 'flowbite-react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Users, 
  Globe,
  Target
} from 'lucide-react';

export default function QuickMetricsCards() {
  const metrics = [
    {
      id: 1,
      title: 'Total Income This Year',
      value: '$45,230',
      change: '+18%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'green'
    },
    {
      id: 2,
      title: 'Total Expenses This Year',
      value: '$12,450',
      change: '+5%',
      changeType: 'increase',
      icon: TrendingDown,
      color: 'red'
    },
    {
      id: 3,
      title: 'Net Profit',
      value: '$32,780',
      change: '+23%',
      changeType: 'increase',
      icon: Target,
      color: 'blue'
    },
    {
      id: 4,
      title: 'Most Popular Workshop',
      value: 'Terrarium Design',
      subtitle: '67% attendance rate',
      icon: Globe,
      color: 'purple'
    },
    {
      id: 5,
      title: 'Total Workshops',
      value: '89',
      change: '+12',
      changeType: 'increase',
      icon: Calendar,
      color: 'orange'
    },
    {
      id: 6,
      title: 'Total Participants',
      value: '1,247',
      change: '+156',
      changeType: 'increase',
      icon: Users,
      color: 'indigo'
    }
  ];

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Quick Metrics
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric) => (
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