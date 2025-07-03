import React from 'react';
import { Card } from 'flowbite-react';
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

export default function RecentActivityFeed() {
  const activities = [
    {
      id: 1,
      type: 'income_added',
      title: 'Added income',
      description: 'Terrarium Design Workshop - Evening Session',
      amount: '$300',
      time: '2 hours ago',
      icon: Plus,
      color: 'green'
    },
    {
      id: 2,
      type: 'expense_updated',
      title: 'Updated expense',
      description: 'Art supplies for candle making workshop',
      amount: '$65',
      time: '4 hours ago',
      icon: Edit,
      color: 'blue'
    },
    {
      id: 3,
      type: 'workshop_completed',
      title: 'Workshop completed',
      description: 'Botanical Wall Art Class - 18 participants',
      time: '1 day ago',
      icon: CheckCircle,
      color: 'green'
    },
    {
      id: 4,
      type: 'payment_received',
      title: 'Payment received',
      description: 'Mosaic Magic Workshop - Group booking',
      amount: '$480',
      time: '1 day ago',
      icon: DollarSign,
      color: 'green'
    },
    {
      id: 5,
      type: 'expense_added',
      title: 'Added expense',
      description: 'Clay supplies for pottery workshop',
      amount: '$85',
      time: '2 days ago',
      icon: CreditCard,
      color: 'red'
    },
    {
      id: 6,
      type: 'workshop_scheduled',
      title: 'Workshop scheduled',
      description: 'Holiday Candle Making - December 22',
      time: '2 days ago',
      icon: Calendar,
      color: 'purple'
    },
    {
      id: 7,
      type: 'participant_joined',
      title: 'New participant',
      description: 'Sarah Miller joined Terrarium Design class',
      time: '3 days ago',
      icon: Users,
      color: 'blue'
    },
    {
      id: 8,
      type: 'expense_deleted',
      title: 'Deleted expense',
      description: 'Removed duplicate material cost entry',
      amount: '$25',
      time: '3 days ago',
      icon: Trash2,
      color: 'gray'
    }
  ];

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
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              5
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Income Added
            </div>
          </div>
        </Card>
        
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              3
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Expenses Added
            </div>
          </div>
        </Card>
        
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              2
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Workshops Scheduled
            </div>
          </div>
        </Card>
        
        <Card className="text-center">
          <div className="p-3">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              12
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