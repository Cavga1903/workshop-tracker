import supabase from '../supabase/client';
import toast from 'react-hot-toast';

/**
 * Send email notification for new income or expense record
 * @param {Object} params - Notification parameters
 * @param {string} params.type - 'income' or 'expense'
 * @param {string} params.recordId - ID of the created record
 * @param {string} params.userId - ID of the user who created the record
 * @param {number} params.amount - Amount (payment for income, cost for expense)
 * @param {string} params.name - Name/description of the record
 * @param {string} params.date - Date of the record
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmailNotification = async ({ type, recordId, userId, amount, name, date }) => {
  try {
    // Check if Edge Function is available
    const edgeFunctionUrl = `${supabase.supabaseUrl}/functions/v1/send-notification-email`;
    
    const response = await supabase.functions.invoke('send-notification-email', {
      body: {
        type,
        recordId,
        userId,
        amount,
        name,
        date,
      },
    });

    if (response.error) {
      console.error('Edge Function error:', response.error);
      // Don't show error toast to user - this is a background process
      return false;
    }

    console.log('Email notification sent successfully:', response.data);
    return true;

  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Don't show error toast to user - email notifications are optional
    return false;
  }
};

/**
 * Send notification for new income record
 * @param {Object} incomeRecord - The income record data
 */
export const notifyNewIncome = async (incomeRecord) => {
  return await sendEmailNotification({
    type: 'income',
    recordId: incomeRecord.id,
    userId: incomeRecord.user_id,
    amount: incomeRecord.payment || 0,
    name: incomeRecord.name || 'Workshop Income',
    date: incomeRecord.date || incomeRecord.created_at,
  });
};

/**
 * Send notification for new expense record
 * @param {Object} expenseRecord - The expense record data
 */
export const notifyNewExpense = async (expenseRecord) => {
  return await sendEmailNotification({
    type: 'expense',
    recordId: expenseRecord.id,
    userId: expenseRecord.user_id,
    amount: expenseRecord.cost || 0,
    name: expenseRecord.name || 'Workshop Expense',
    date: expenseRecord.month || expenseRecord.created_at,
  });
};

/**
 * Test email notification system (admin only)
 * @param {string} userRole - Current user's role
 */
export const testEmailNotification = async (userRole) => {
  if (userRole !== 'admin') {
    toast.error('Only administrators can test email notifications');
    return false;
  }

  try {
    const testResult = await sendEmailNotification({
      type: 'income',
      recordId: 'test-record-id',
      userId: 'test-user-id',
      amount: 100,
      name: 'Test Email Notification',
      date: new Date().toISOString(),
    });

    if (testResult) {
      toast.success('Test email notification sent successfully!');
    } else {
      toast.error('Failed to send test email notification');
    }

    return testResult;
  } catch (error) {
    console.error('Test email notification error:', error);
    toast.error('Error testing email notifications');
    return false;
  }
};

/**
 * Get email notification history (admin only)
 * @param {number} limit - Number of records to fetch
 */
export const getEmailNotificationHistory = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('email_notifications')
      .select(`
        *,
        profiles:user_id(full_name, email)
      `)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch email notification history:', error);
    return [];
  }
};

/**
 * Check if email notifications are properly configured
 */
export const checkEmailNotificationConfig = async () => {
  try {
    // Try to ping the Edge Function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/send-notification-email`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${supabase.supabaseKey}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Email notification configuration check failed:', error);
    return false;
  }
}; 