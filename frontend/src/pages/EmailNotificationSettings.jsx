import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Table, Badge, Spinner } from 'flowbite-react';
import { 
  HiMail, 
  HiPlay, 
  HiRefresh,
  HiCheck,
  HiX,
  HiExclamation,
  HiInformationCircle,
  HiCog,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi';
import { Mail, Send, History, Settings, User, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { 
  testEmailNotification, 
  getEmailNotificationHistory, 
  checkEmailNotificationConfig 
} from '../utils/emailNotifications';
import { exportToCSV, exportToExcel, exportToPDF, getColumnDefinitions } from '../utils/exportUtils';
import toast from 'react-hot-toast';

export default function EmailNotificationSettings() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [emailHistory, setEmailHistory] = useState([]);
  const [configStatus, setConfigStatus] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    if (user) {
      checkConfiguration();
      fetchEmailHistory();
    }
  }, [user]);

  const checkConfiguration = async () => {
    setConfigLoading(true);
    try {
      const isConfigured = await checkEmailNotificationConfig();
      setConfigStatus(isConfigured);
    } catch (error) {
      console.error('Error checking email configuration:', error);
      setConfigStatus(false);
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchEmailHistory = async () => {
    setHistoryLoading(true);
    try {
      const history = await getEmailNotificationHistory(20);
      setEmailHistory(history);
    } catch (error) {
      console.error('Error fetching email history:', error);
      toast.error('Failed to load email history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await testEmailNotification(profile?.role);
      // Refresh history after test
      setTimeout(fetchEmailHistory, 2000);
    } catch (error) {
      console.error('Error testing email:', error);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleExportHistory = async (format) => {
    if (!emailHistory || emailHistory.length === 0) {
      toast.error('No email history to export');
      return;
    }

    const filename = `email-notifications-${new Date().toISOString().split('T')[0]}`;
    const columns = getColumnDefinitions.emailNotification;
    
    try {
      let success = false;
      switch (format) {
        case 'csv':
          success = exportToCSV(emailHistory, filename, columns);
          break;
        case 'excel':
          success = exportToExcel(emailHistory, filename, columns, 'Email Notifications');
          break;
        case 'pdf':
          success = exportToPDF(emailHistory, filename, columns, {
            title: 'Email Notification History',
            includeSummary: true,
          });
          break;
        default:
          throw new Error('Invalid export format');
      }

      if (success) {
        toast.success(`Email history exported to ${format.toUpperCase()} successfully`);
      } else {
        toast.error(`Failed to export to ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Error exporting to ${format.toUpperCase()}: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (successful, failed) => {
    if (failed > 0) {
      return (
        <Badge color="warning" icon={HiExclamation}>
          Partial Success ({successful}/{successful + failed})
        </Badge>
      );
    } else if (successful > 0) {
      return (
        <Badge color="success" icon={HiCheck}>
          Success ({successful})
        </Badge>
      );
    } else {
      return (
        <Badge color="failure" icon={HiX}>
          Failed
        </Badge>
      );
    }
  };

  // Check if user is admin
  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert color="warning" icon={HiInformationCircle}>
          <span className="font-medium">Access Restricted:</span> Only administrators can access email notification settings.
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            Email Notification Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and test email notifications for new income and expense records
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={checkConfiguration} color="gray" size="sm" disabled={configLoading}>
            <HiRefresh className={`mr-2 h-4 w-4 ${configLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>
      </div>

      {/* Configuration Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${
              configLoading 
                ? 'bg-gray-100 dark:bg-gray-800' 
                : configStatus 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
            }`}>
              {configLoading ? (
                <Spinner size="sm" />
              ) : configStatus ? (
                <HiCheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              ) : (
                <HiXCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Email Service Status
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {configLoading 
                  ? 'Checking configuration...' 
                  : configStatus 
                    ? 'Email notifications are properly configured and ready'
                    : 'Email notifications are not configured or unavailable'
                }
              </p>
            </div>
          </div>
          {configStatus && (
            <Button 
              onClick={handleTestEmail} 
              color="blue" 
              size="sm"
              disabled={testingEmail}
              isProcessing={testingEmail}
            >
              <HiPlay className="mr-2 h-4 w-4" />
              {testingEmail ? 'Sending Test...' : 'Send Test Email'}
            </Button>
          )}
        </div>
      </Card>

      {/* Email Configuration Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HiInformationCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              How Email Notifications Work
            </h3>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>• Email notifications are automatically sent when new income or expense records are created</p>
              <p>• Only administrator users receive these notification emails</p>
              <p>• Emails are sent via Supabase Edge Functions using the Resend email service</p>
              <p>• If email sending fails, the application continues to work normally (emails are optional)</p>
              <p>• All notification attempts are logged in the history below</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Email History */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <History className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Email Notification History
            </h3>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchEmailHistory} color="gray" size="sm" disabled={historyLoading}>
              <HiRefresh className={`mr-2 h-4 w-4 ${historyLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {emailHistory.length > 0 && (
              <>
                <Button onClick={() => handleExportHistory('csv')} color="blue" size="sm">
                  Export CSV
                </Button>
                <Button onClick={() => handleExportHistory('excel')} color="blue" size="sm">
                  Export Excel
                </Button>
                <Button onClick={() => handleExportHistory('pdf')} color="blue" size="sm">
                  Export PDF
                </Button>
              </>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : emailHistory.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No email notifications have been sent yet.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Try creating a new income or expense record to test the system.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Head>
                <Table.HeadCell>Date & Time</Table.HeadCell>
                <Table.HeadCell>Type</Table.HeadCell>
                <Table.HeadCell>Subject</Table.HeadCell>
                <Table.HeadCell>Triggered By</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {emailHistory.map((notification) => (
                  <Table.Row key={notification.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {formatDate(notification.sent_at)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge 
                        color={notification.record_type === 'income' ? 'success' : 'failure'}
                        className="capitalize"
                      >
                        {notification.record_type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="max-w-xs truncate">
                      {notification.subject}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {notification.profiles?.full_name || notification.profiles?.email || 'Unknown User'}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {getStatusBadge(notification.recipients_count, notification.failed_count)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>

      {/* Troubleshooting Section */}
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Settings className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Troubleshooting
            </h3>
            <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
              <p><strong>If emails are not working:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check that the Supabase Edge Function is deployed</li>
                <li>Verify that RESEND_API_KEY environment variable is set</li>
                <li>Ensure sender domain is verified in Resend</li>
                <li>Check admin user emails are valid in profiles table</li>
                <li>Look at browser console for error messages</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 