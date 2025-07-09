import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Alert, Badge } from 'flowbite-react';
import { HiCalendar, HiRefresh, HiUsers, HiLocationMarker } from 'react-icons/hi';
import { Calendar as CalendarIcon } from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function WorkshopCalendar() {
  const { user, profile } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchWorkshops(),
        fetchIncomes()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkshops = async () => {
    try {
      let query = supabase
        .from('workshops')
        .select(`
          *,
          profiles:instructor_id(full_name, email),
          class_types:class_type_id(name)
        `)
        .order('date', { ascending: true });

      if (profile?.role !== 'admin') {
        query = query.eq('instructor_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) {
        if (error.code === '42P01') {
          console.log('Workshops table not found, using incomes as fallback');
          setWorkshops([]);
          return;
        }
        throw error;
      }

      setWorkshops(data || []);
    } catch (err) {
      console.error('Error fetching workshops:', err);
    }
  };

  const fetchIncomes = async () => {
    try {
      let query = supabase
        .from('incomes')
        .select(`
          *,
          profiles:user_id(full_name, email),
          class_types:class_type_id(name)
        `)
        .order('created_at', { ascending: true });

      if (profile?.role !== 'admin') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setIncomes(data || []);
    } catch (err) {
      console.error('Error fetching incomes:', err);
      throw err;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group events by date
  const getEventsByDate = () => {
    const events = [];
    
    // Add workshops
    workshops.forEach(workshop => {
      events.push({
        ...workshop,
        type: 'workshop',
        displayDate: workshop.date
      });
    });

    // Add income-based events
    incomes.forEach(income => {
      events.push({
        id: `income-${income.id}`,
        name: income.name || 'Workshop',
        date: income.created_at,
        location: income.platform || 'Unknown',
        instructor_name: income.profiles?.full_name || 'Unknown',
        class_type: income.class_types?.name || 'General',
        participants: income.guest_count || 0,
        revenue: income.payment || 0,
        type: 'income-based',
        displayDate: income.created_at
      });
    });

    // Sort by date
    events.sort((a, b) => new Date(a.displayDate) - new Date(b.displayDate));
    
    // Group by date
    const groupedEvents = {};
    events.forEach(event => {
      const dateKey = new Date(event.displayDate).toISOString().split('T')[0];
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    return groupedEvents;
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
          <span className="font-medium">Error loading calendar:</span> {error}
        </Alert>
        <Button onClick={fetchData} className="mt-4">
          <HiRefresh className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const eventsByDate = getEventsByDate();
  const dateKeys = Object.keys(eventsByDate).sort();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            📅 Workshop Calendar
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View your workshop schedule and past events
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={fetchData} color="gray" size="sm">
            <HiRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Calendar Enhancement Notice */}
      <Alert color="info">
        <CalendarIcon className="h-4 w-4" />
        <span className="ml-2">
          <span className="font-medium">Enhanced Calendar View Coming Soon!</span> This is a simplified timeline view. 
          A full interactive calendar with drag-and-drop scheduling will be available after the workshops table is properly set up.
        </span>
      </Alert>

      {/* Timeline View */}
      {dateKeys.length > 0 ? (
        <div className="space-y-6">
          {dateKeys.map(dateKey => (
            <Card key={dateKey} className="hover:shadow-lg transition-shadow duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(dateKey)}
                  </h3>
                  <Badge color="blue" size="sm">
                    {eventsByDate[dateKey].length} event{eventsByDate[dateKey].length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eventsByDate[dateKey].map((event, index) => (
                    <div
                      key={event.id || index}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {event.name}
                          </h4>
                          <Badge 
                            color={event.type === 'income-based' ? 'yellow' : 'green'} 
                            size="sm"
                          >
                            {event.type === 'income-based' ? 'Past' : 'Scheduled'}
                          </Badge>
                        </div>

                        {event.type !== 'income-based' && event.date && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <HiCalendar className="h-3 w-3 mr-1" />
                            {formatTime(event.date)}
                          </p>
                        )}

                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <HiLocationMarker className="h-3 w-3 mr-1" />
                          {event.location || 'TBD'}
                        </p>

                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                          <HiUsers className="h-3 w-3 mr-1" />
                          {event.profiles?.full_name || event.instructor_name || 'Unknown Instructor'}
                        </p>

                        {(event.participants || event.guest_count || event.capacity) && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Participants:</span> {' '}
                            {event.participants || event.guest_count || 0}
                            {event.capacity && ` / ${event.capacity}`}
                          </p>
                        )}

                        {(event.revenue || event.payment || event.price) && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            <span className="font-medium">
                              {event.type === 'income-based' ? 'Revenue' : 'Price'}:
                            </span> {' '}
                            ${event.revenue || event.payment || event.price || 0}
                          </p>
                        )}

                        {(event.class_types?.name || event.class_type) && (
                          <Badge color="purple" size="sm">
                            {event.class_types?.name || event.class_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start adding workshops and income records to see your calendar
            </p>
            <div className="flex justify-center space-x-4">
              <Button color="blue" size="sm" onClick={() => navigate('/add-income')}>
                Add Income Record
              </Button>
              <Button color="gray" size="sm" onClick={() => navigate('/add-expense')}>
                Add Expense
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Future Enhancement Info */}
      <Card>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            🚀 Coming Soon: Enhanced Calendar Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div>
              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">📅 Interactive Calendar</h5>
              <ul className="space-y-1 text-xs">
                <li>• Monthly/weekly/daily views</li>
                <li>• Click to add workshops</li>
                <li>• Drag & drop scheduling</li>
                <li>• Color-coded events</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-2">⚡ Smart Features</h5>
              <ul className="space-y-1 text-xs">
                <li>• Workshop templates</li>
                <li>• Recurring events</li>
                <li>• Capacity management</li>
                <li>• Email notifications</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 