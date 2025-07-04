import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, Button } from 'flowbite-react';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  MapPin, 
  Bell,
  ChevronRight,
  RefreshCw,
  CalendarX
} from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function UpcomingEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range: from today to next 30 days
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0]; // Today in YYYY-MM-DD format
      const endDate = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      const endDateStr = endDate.toISOString().split('T')[0];

      // Fetch user's upcoming workshops
      const { data: workshops, error: workshopsError } = await supabase
        .from('workshops')
        .select('id, title, date, platform, instructor_id')
        .eq('instructor_id', user.id)
        .gte('date', todayStr)
        .lte('date', endDateStr)
        .order('date', { ascending: true });

      if (workshopsError) throw workshopsError;

      // Fetch participants count for each workshop
      const workshopIds = workshops?.map(w => w.id) || [];
      let participantsData = [];
      let incomesData = [];

      if (workshopIds.length > 0) {
        const { data: participants, error: participantsError } = await supabase
          .from('participants')
          .select('workshop_id')
          .in('workshop_id', workshopIds);

        if (participantsError) throw participantsError;
        participantsData = participants || [];

        // Fetch incomes for pricing information
        const { data: incomes, error: incomesError } = await supabase
          .from('incomes')
          .select('workshop_id, amount')
          .in('workshop_id', workshopIds);

        if (incomesError) throw incomesError;
        incomesData = incomes || [];
      }

      // Count participants per workshop
      const participantCounts = {};
      participantsData.forEach(participant => {
        participantCounts[participant.workshop_id] = (participantCounts[participant.workshop_id] || 0) + 1;
      });

      // Calculate total income per workshop
      const workshopIncomes = {};
      incomesData.forEach(income => {
        workshopIncomes[income.workshop_id] = (workshopIncomes[income.workshop_id] || 0) + (income.amount || 0);
      });

      // Transform data for display
      const transformedEvents = workshops?.map(workshop => {
        const participantCount = participantCounts[workshop.id] || 0;
        const totalIncome = workshopIncomes[workshop.id] || 0;
        
        return {
          id: workshop.id,
          type: 'workshop',
          title: workshop.title || 'Workshop',
          date: workshop.date,
          location: workshop.platform || 'TBD',
          participants: participantCount,
          price: totalIncome,
          eventType: workshop.platform === 'Zoom' ? 'Online' : 'In-person',
          status: getEventStatus(workshop.date, totalIncome),
          icon: Calendar,
          color: getEventColor(workshop.date, totalIncome)
        };
      }) || [];

      setEvents(transformedEvents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (eventDate, payment) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    const timeDiff = eventDateTime - now;
    const hoursUntilEvent = timeDiff / (1000 * 60 * 60);

    if (eventDateTime < now) {
      return 'past';
    } else if (payment === 0) {
      return 'pending';
    } else if (hoursUntilEvent <= 48) {
      return 'urgent';
    } else {
      return 'confirmed';
    }
  };

  const getEventColor = (eventDate, payment) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    const timeDiff = eventDateTime - now;
    const hoursUntilEvent = timeDiff / (1000 * 60 * 60);

    if (eventDateTime < now) {
      return 'gray';
    } else if (payment === 0) {
      return 'orange';
    } else if (hoursUntilEvent <= 48) {
      return 'red';
    } else {
      return 'green';
    }
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
      orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
    };
    return colorMap[color] || colorMap.blue;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      past: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return statusMap[status] || statusMap.confirmed;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getDaysUntil = (dateStr) => {
    const today = new Date();
    const eventDate = new Date(dateStr);
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 0) return 'Past';
    return `${diffDays} days`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Events & Reminders
        </h3>
        <div className="flex justify-center items-center h-32">
          <div className="flex items-center space-x-2">
            <Spinner size="md" />
            <span className="text-gray-500 dark:text-gray-400">Loading events...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Events & Reminders
        </h3>
        <Alert color="failure" className="flex items-center">
          <div className="flex-1">
            <span className="font-medium">Error loading events:</span> {error}
          </div>
          <Button 
            size="sm" 
            color="failure" 
            onClick={fetchEvents}
            className="ml-4"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Events & Reminders
        </h3>
        <Card>
          <div className="text-center py-8">
            <CalendarX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No upcoming events found
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Time to schedule a new workshop!
            </p>
            <Button
              gradientDuoTone="cyanToBlue"
              onClick={() => window.location.href = '/add-income'}
            >
              Schedule Workshop
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Upcoming Events & Reminders
        </h3>
        <button 
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium flex items-center"
          onClick={() => window.location.href = '/incomes'}
        >
          View all
          <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start space-x-4">
              {/* Icon and Date */}
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-lg border-2 ${getColorClasses(event.color)}`}>
                  <event.icon className="h-5 w-5" />
                </div>
              </div>

              {/* Event Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {event.title}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(event.date)} at {formatTime(event.date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    
                    {/* Additional Info */}
                    <div className="flex items-center space-x-4 mt-2">
                      {event.participants > 0 && (
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Users className="h-3 w-3 mr-1" />
                          {event.participants} participants
                        </div>
                      )}
                      {event.price > 0 && (
                        <div className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(event.price)}
                        </div>
                      )}
                      {event.eventType && (
                        <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                          <Bell className="h-3 w-3 mr-1" />
                          {event.eventType}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status and Days Until */}
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {getDaysUntil(event.date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center pt-4">
        <Button
          size="sm"
          color="gray"
          onClick={fetchEvents}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Events
        </Button>
      </div>
    </div>
  );
} 