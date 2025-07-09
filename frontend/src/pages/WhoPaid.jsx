import React, { useEffect, useState, useMemo } from 'react';
import { Card, Button, Alert, Table, Badge, TextInput, Select, Spinner, Dropdown, Tabs } from 'flowbite-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  HiDownload, 
  HiFilter, 
  HiSearch, 
  HiCalendar, 
  HiCurrencyDollar, 
  HiUsers, 
  HiTrendingUp,
  HiRefresh,
  HiSortAscending,
  HiSortDescending,
  HiUser,
  HiCash,
  HiClock,
  HiChartPie,
  HiChartBar,
  HiChevronDown,
  HiUserGroup,
  HiOfficeBuilding,
  HiCreditCard
} from 'react-icons/hi';
import { Crown, TrendingUp, Calendar, DollarSign, FileText, Download, FileSpreadsheet, FileJson, File, Building, Users } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import toast, { Toaster } from 'react-hot-toast';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export default function WhoPaid() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('internal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [minPayment, setMinPayment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'totalPaid', direction: 'desc' });

  // Data states
  const [internalData, setInternalData] = useState({
    expenses: [],
    incomes: [],
    profiles: []
  });
  const [clientData, setClientData] = useState({
    clients: [],
    clientIncomes: [],
    clientExpenses: []
  });
  const [expenseData, setExpenseData] = useState({
    expenses: [],
    profiles: []
  });

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchInternalData(),
        fetchClientData(),
        fetchExpenseData()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInternalData = async () => {
    try {
      // Fetch expenses for internal contributors
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (expenseError) throw expenseError;

      // Fetch incomes for internal contributors
      const { data: incomes, error: incomeError } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (incomeError) throw incomeError;

      // Fetch all profiles for internal contributors
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      setInternalData({
        expenses: expenses || [],
        incomes: incomes || [],
        profiles: profiles || []
      });
    } catch (err) {
      console.error('Error fetching internal data:', err);
      throw err;
    }
  };

  const fetchClientData = async () => {
    try {
      // Fetch all clients
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientError) {
        // If clients table doesn't exist, return empty data
        console.warn('Clients table not found, using empty data:', clientError);
        setClientData({
          clients: [],
          clientIncomes: [],
          clientExpenses: []
        });
        return;
      }

      // Fetch incomes associated with clients
      const { data: clientIncomes, error: clientIncomeError } = await supabase
        .from('incomes')
        .select('*')
        .not('client_id', 'is', null)
        .order('created_at', { ascending: false });

      if (clientIncomeError) throw clientIncomeError;

      // Fetch expenses associated with clients
      const { data: clientExpenses, error: clientExpenseError } = await supabase
        .from('expenses')
        .select('*')
        .not('client_id', 'is', null)
        .order('created_at', { ascending: false });

      if (clientExpenseError) throw clientExpenseError;

      setClientData({
        clients: clients || [],
        clientIncomes: clientIncomes || [],
        clientExpenses: clientExpenses || []
      });
    } catch (err) {
      console.error('Error fetching client data:', err);
      throw err;
    }
  };

  const fetchExpenseData = async () => {
    try {
      // Check if user is admin to determine data scope
      const isAdmin = profile?.role === 'admin';
      
      // Fetch expenses based on permissions
      let expenseQuery = supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If not admin, only fetch user's own expenses
      if (!isAdmin) {
        expenseQuery = expenseQuery.eq('user_id', user.id);
      }

      const { data: expenses, error: expenseError } = await expenseQuery;
      if (expenseError) throw expenseError;

      // Fetch profiles based on permissions
      let profileQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If not admin, only fetch relevant profiles (users who have expenses)
      if (!isAdmin && expenses?.length > 0) {
        const userIds = [...new Set(expenses.map(e => e.user_id))];
        profileQuery = profileQuery.in('id', userIds);
      }

      const { data: profiles, error: profileError } = await profileQuery;
      if (profileError) throw profileError;

      setExpenseData({
        expenses: expenses || [],
        profiles: profiles || []
      });
    } catch (err) {
      console.error('Error fetching expense data:', err);
      throw err;
    }
  };

  // Process internal contributors data
  const processedInternalData = useMemo(() => {
    if (!internalData.expenses.length && !internalData.incomes.length) return null;

    // Combine expenses and incomes for internal contributors
    const allTransactions = [
      ...internalData.expenses.map(expense => ({
        ...expense,
        type: 'expense',
        amount: expense.cost || 0,
        payer: expense.who_paid || 'Unknown'
      })),
      ...internalData.incomes.map(income => ({
        ...income,
        type: 'income',
        amount: income.payment || 0,
        payer: 'Company Revenue' // Since incomes are company revenue
      }))
    ];

    // Filter by date range and search
    let filteredTransactions = allTransactions;

    if (dateRange.start || dateRange.end) {
      filteredTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date();
        return transactionDate >= start && transactionDate <= end;
      });
    }

    if (searchTerm) {
      filteredTransactions = filteredTransactions.filter(transaction => 
        transaction.payer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group by payer (internal contributors)
    const groupedData = {};
    filteredTransactions.forEach(transaction => {
      const payer = transaction.payer || 'Unknown';
      if (!groupedData[payer]) {
        groupedData[payer] = {
          name: payer,
          totalPaid: 0,
          expenseCount: 0,
          incomeCount: 0,
          transactions: [],
          avgTransaction: 0,
          lastTransaction: null,
          profile: internalData.profiles.find(p => p.full_name === payer) || null
        };
      }
      
      groupedData[payer].totalPaid += transaction.amount || 0;
      if (transaction.type === 'expense') {
        groupedData[payer].expenseCount += 1;
      } else {
        groupedData[payer].incomeCount += 1;
      }
      groupedData[payer].transactions.push(transaction);
      
      const transactionDate = new Date(transaction.created_at);
      if (!groupedData[payer].lastTransaction || transactionDate > new Date(groupedData[payer].lastTransaction)) {
        groupedData[payer].lastTransaction = transaction.created_at;
      }
    });

    // Calculate averages and apply minimum payment filter
    const processedUsers = Object.values(groupedData)
      .map(user => ({
        ...user,
        avgTransaction: user.totalPaid / (user.expenseCount + user.incomeCount)
      }))
      .filter(user => !minPayment || user.totalPaid >= parseFloat(minPayment));

    // Sort data
    const sortedUsers = [...processedUsers].sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });

    return {
      users: sortedUsers,
      topContributors: sortedUsers.slice(0, 3),
      totalAmount: sortedUsers.reduce((sum, user) => sum + user.totalPaid, 0),
      totalTransactions: sortedUsers.reduce((sum, user) => sum + user.expenseCount + user.incomeCount, 0),
      recentTransactions: filteredTransactions
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    };
  }, [internalData, dateRange, minPayment, searchTerm, sortConfig]);

  // Process client data
  const processedClientData = useMemo(() => {
    if (!clientData.clients.length) return null;

    // Filter clients based on search
    let filteredClients = clientData.clients;

    if (searchTerm) {
      filteredClients = filteredClients.filter(client => 
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply minimum payment filter
    if (minPayment) {
      filteredClients = filteredClients.filter(client => 
        client.total_spent >= parseFloat(minPayment)
      );
    }

    // Sort clients
    const sortedClients = [...filteredClients].sort((a, b) => {
      let aValue = a[sortConfig.key] || 0;
      let bValue = b[sortConfig.key] || 0;
      
      if (sortConfig.key === 'totalPaid') {
        aValue = a.total_spent || 0;
        bValue = b.total_spent || 0;
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    return {
      clients: sortedClients,
      topClients: sortedClients.slice(0, 3),
      totalAmount: sortedClients.reduce((sum, client) => sum + (client.total_spent || 0), 0),
      totalSessions: sortedClients.reduce((sum, client) => sum + (client.total_sessions || 0), 0),
      recentClients: clientData.clients
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
    };
  }, [clientData, dateRange, minPayment, searchTerm, sortConfig]);

  // Process expense contributors data
  const processedExpenseData = useMemo(() => {
    if (!expenseData.expenses.length) return null;

    // Filter expenses by date range first
    let filteredExpenses = expenseData.expenses;

    if (dateRange.start || dateRange.end) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.created_at);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date();
        return expenseDate >= start && expenseDate <= end;
      });
    }

    // Group expenses by user_id
    const groupedData = {};
    filteredExpenses.forEach(expense => {
      const userId = expense.user_id;
      if (!groupedData[userId]) {
        const profile = expenseData.profiles.find(p => p.id === userId);
        groupedData[userId] = {
          userId,
          name: profile?.full_name || 'Unknown User',
          email: profile?.email || '',
          role: profile?.role || 'user',
          profile,
          totalExpenses: 0,
          expenseCount: 0,
          avgExpense: 0,
          lastExpenseDate: null,
          expenses: [],
          largestExpense: 0,
          categories: new Set()
        };
      }
      
      groupedData[userId].totalExpenses += expense.cost || 0;
      groupedData[userId].expenseCount += 1;
      groupedData[userId].expenses.push(expense);
      
      if ((expense.cost || 0) > groupedData[userId].largestExpense) {
        groupedData[userId].largestExpense = expense.cost || 0;
      }
      
      if (expense.category) {
        groupedData[userId].categories.add(expense.category);
      }
      
      const expenseDate = new Date(expense.created_at);
      if (!groupedData[userId].lastExpenseDate || expenseDate > new Date(groupedData[userId].lastExpenseDate)) {
        groupedData[userId].lastExpenseDate = expense.created_at;
      }
    });

    // Calculate averages and apply filters
    const processedUsers = Object.values(groupedData)
      .map(user => ({
        ...user,
        avgExpense: user.totalExpenses / user.expenseCount,
        categoriesArray: Array.from(user.categories)
      }))
      .filter(user => !minPayment || user.totalExpenses >= parseFloat(minPayment))
      .filter(user => !searchTerm || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Sort data
    const sortedUsers = [...processedUsers].sort((a, b) => {
      let aValue = a[sortConfig.key] || 0;
      let bValue = b[sortConfig.key] || 0;
      
      if (sortConfig.key === 'totalPaid') {
        aValue = a.totalExpenses;
        bValue = b.totalExpenses;
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    // Prepare chart data
    const pieChartData = sortedUsers.slice(0, 6).map((user, index) => ({
      name: user.name,
      value: user.totalExpenses,
      color: COLORS[index % COLORS.length]
    }));

    const categoryData = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || 'Other';
      categoryData[category] = (categoryData[category] || 0) + (expense.cost || 0);
    });

    const categoryChartData = Object.entries(categoryData).map(([category, amount], index) => ({
      category,
      amount,
      color: COLORS[index % COLORS.length]
    }));

    return {
      users: sortedUsers,
      topContributors: sortedUsers.slice(0, 3),
      totalAmount: sortedUsers.reduce((sum, user) => sum + user.totalExpenses, 0),
      totalExpenses: sortedUsers.reduce((sum, user) => sum + user.expenseCount, 0),
      totalUsers: sortedUsers.length,
      avgExpensePerUser: sortedUsers.length > 0 ? sortedUsers.reduce((sum, user) => sum + user.totalExpenses, 0) / sortedUsers.length : 0,
      recentExpenses: filteredExpenses
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5),
      highValueExpenses: sortedUsers.filter(user => user.totalExpenses > 1000),
      pieChartData,
      categoryChartData
    };
  }, [expenseData, dateRange, minPayment, searchTerm, sortConfig]);

  // Get current processed data based on active tab
  const currentProcessedData = activeTab === 'internal' ? processedInternalData : 
                                activeTab === 'clients' ? processedClientData : 
                                processedExpenseData;

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Check if user has export permissions
  const canExport = () => {
    const userRole = user?.user_metadata?.role || 'user';
    return ['admin', 'analyst'].includes(userRole) || true; // Allow all for now, can be restricted later
  };

  // Get export data with metadata
  const getExportData = () => {
    if (!currentProcessedData) return null;

    const timestamp = new Date().toISOString();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const summary = {
      exportTimestamp: timestamp,
      exportDate: dateStr,
      dataType: activeTab === 'internal' ? 'Internal Contributors' : 
                activeTab === 'clients' ? 'Client Payments' : 'Expense Contributors',
      filters: {
        dateRange: dateRange.start || dateRange.end ? 
          `${dateRange.start || 'All'} to ${dateRange.end || 'All'}` : 'All dates',
        searchTerm: searchTerm || 'None',
        minAmount: minPayment || 'None'
      },
      totals: {
        totalAmount: currentProcessedData.totalAmount,
        totalRecords: activeTab === 'internal' ? currentProcessedData.users?.length : 
                     activeTab === 'clients' ? currentProcessedData.clients?.length : 
                     currentProcessedData.users?.length,
        avgAmount: currentProcessedData.totalAmount / (
          activeTab === 'internal' ? currentProcessedData.totalTransactions : 
          activeTab === 'clients' ? currentProcessedData.totalSessions : 
          currentProcessedData.totalExpenses || 1
        )
      }
    };

    let exportData = [];
    
    if (activeTab === 'internal' && currentProcessedData.users) {
      exportData = currentProcessedData.users.map(user => ({
        Name: user.name,
        Email: user.profile?.email || 'N/A',
        'Total Amount': user.totalPaid,
        'Expense Count': user.expenseCount,
        'Income Count': user.incomeCount,
        'Avg Transaction': user.avgTransaction,
        'Last Transaction': user.lastTransaction ? new Date(user.lastTransaction).toLocaleDateString() : 'N/A'
      }));
    } else if (activeTab === 'clients' && currentProcessedData.clients) {
      exportData = currentProcessedData.clients.map(client => ({
        Name: client.full_name,
        Email: client.email,
        Company: client.company || 'N/A',
        'Total Spent': client.total_spent,
        'Total Sessions': client.total_sessions,
        Status: client.is_active ? 'Active' : 'Inactive',
        'Joined Date': new Date(client.created_at).toLocaleDateString()
      }));
    } else if (activeTab === 'expenses' && currentProcessedData.users) {
      exportData = currentProcessedData.users.map(user => ({
        Name: user.name,
        Email: user.email,
        Role: user.role,
        'Total Expenses': user.totalExpenses,
        'Expense Count': user.expenseCount,
        'Average Expense': user.avgExpense.toFixed(2),
        'Largest Expense': user.largestExpense,
        'Categories': user.categoriesArray?.join(', ') || 'N/A',
        'Last Expense Date': user.lastExpenseDate ? new Date(user.lastExpenseDate).toLocaleDateString() : 'N/A'
      }));
    }

    return {
      summary,
      exportData,
      topRecords: activeTab === 'internal' ? currentProcessedData.topContributors : currentProcessedData.topClients,
      timestamp,
      dateStr
    };
  };

  // Export as CSV
  const exportAsCSV = () => {
    try {
      const data = getExportData();
      if (!data || !data.exportData.length) return;

      const headers = Object.keys(data.exportData[0]);
      const rows = data.exportData.map(record => 
        headers.map(header => record[header])
      );

      const csvContent = [
        `# ${data.summary.dataType} Report - ${data.dateStr}`,
        `# Export Time: ${data.timestamp}`,
        `# Filters: ${data.summary.filters.dateRange}, Search: ${data.summary.filters.searchTerm}`,
        `# Total Amount: $${data.summary.totals.totalAmount.toFixed(2)}, Records: ${data.summary.totals.totalRecords}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const filename = `${activeTab}-contributors-${data.dateStr}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, filename);
      toast.success('Exported as CSV successfully!');
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('CSV export error:', error);
    }
  };

  // Export as Excel
  const exportAsExcel = () => {
    try {
      const data = getExportData();
      if (!data || !data.exportData.length) return;

      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        [`${data.summary.dataType} Report`],
        ['Export Date', data.dateStr],
        ['Export Time', data.timestamp],
        [''],
        ['Summary'],
        ['Total Amount', `$${data.summary.totals.totalAmount.toFixed(2)}`],
        ['Total Records', data.summary.totals.totalRecords],
        ['Average Amount', `$${data.summary.totals.avgAmount.toFixed(2)}`],
        [''],
        ['Filters Applied'],
        ['Date Range', data.summary.filters.dateRange],
        ['Search Term', data.summary.filters.searchTerm],
        ['Min Amount', data.summary.filters.minAmount],
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Main data sheet
      const dataWs = XLSX.utils.json_to_sheet(data.exportData);
      XLSX.utils.book_append_sheet(wb, dataWs, activeTab === 'internal' ? 'Contributors' : 'Clients');

      const filename = `${activeTab}-contributors-${data.dateStr}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success('Exported as Excel successfully!');
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Excel export error:', error);
    }
  };

  // Export as JSON
  const exportAsJSON = () => {
    try {
      const data = getExportData();
      if (!data) return;

      const jsonData = {
        reportTitle: 'Who Paid Breakdown Report',
        exportInfo: data.summary,
        contributors: data.contributorsData,
        topContributor: data.topContributor,
        recentPayments: data.recentPayments,
        chartData: {
          pieChart: processedData.pieChartData,
          monthlyData: processedData.monthlyData
        }
      };

      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
        type: 'application/json;charset=utf-8;' 
      });
      saveAs(blob, `who-paid-breakdown-${data.dateStr}.json`);
      toast.success('Exported as JSON successfully!');
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('JSON export error:', error);
    }
  };

  // Export as Word
  const exportAsWord = async () => {
    try {
      const data = getExportData();
      if (!data) return;

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: 'Who Paid Breakdown Report',
              heading: 'Title'
            }),
            new Paragraph({
              text: `Export Date: ${data.dateStr}`
            }),
            new Paragraph({
              text: `Total Amount: $${data.summary.totals.totalPaid.toFixed(2)}`
            }),
            new Paragraph({
              text: `Contributors: ${data.summary.totals.contributors}`
            }),
            new Paragraph({
              text: `Total Payments: ${data.summary.totals.totalPayments}`
            }),
            new Paragraph({
              text: '',
            }),
            new DocxTable({
              width: {
                size: 100,
                type: WidthType.PERCENTAGE,
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph('Name')] }),
                    new TableCell({ children: [new Paragraph('Total Paid')] }),
                    new TableCell({ children: [new Paragraph('Payments')] }),
                    new TableCell({ children: [new Paragraph('Avg Payment')] }),
                    new TableCell({ children: [new Paragraph('Last Payment')] }),
                  ],
                }),
                ...data.contributorsData.map(user => 
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(user.Name)] }),
                      new TableCell({ children: [new Paragraph(`$${user['Total Paid'].toFixed(2)}`)] }),
                      new TableCell({ children: [new Paragraph(user['Payment Count'].toString())] }),
                      new TableCell({ children: [new Paragraph(`$${user['Average Payment'].toFixed(2)}`)] }),
                      new TableCell({ children: [new Paragraph(user['Last Payment'])] }),
                    ],
                  })
                ),
              ],
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `who-paid-breakdown-${data.dateStr}.docx`);
      toast.success('Exported as Word document successfully!');
    } catch (error) {
      toast.error('Export failed. Please try again.');
      console.error('Word export error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payment analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert color="failure" className="mb-6">
          <span className="font-medium">Error loading data:</span> {error}
        </Alert>
        <Button onClick={fetchAllData} className="mt-4">
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
            Payment Contributors
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Internal staff and external client payment analysis
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchAllData} color="gray" size="sm">
            <HiRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          {/* Export Dropdown */}
          <Dropdown 
            label=""
            dismissOnClick={true}
            renderTrigger={() => (
              <Button 
                gradientDuoTone="purpleToBlue" 
                size="sm"
                disabled={!canExport()}
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
                <HiChevronDown className="ml-2 h-4 w-4" />
              </Button>
            )}
          >
            <div className="py-1">
              <Dropdown.Header>
                <span className="block text-sm font-medium text-gray-900 dark:text-white">
                  Choose export format:
                </span>
              </Dropdown.Header>
              
              <Dropdown.Item onClick={exportAsCSV} className="flex items-center">
                <FileText className="mr-2 h-4 w-4 text-green-500" />
                Export as CSV
              </Dropdown.Item>
              
              <Dropdown.Item onClick={exportAsExcel} className="flex items-center">
                <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-500" />
                Export as Excel (.xlsx)
              </Dropdown.Item>
              
              <Dropdown.Item onClick={exportAsJSON} className="flex items-center">
                <FileJson className="mr-2 h-4 w-4 text-purple-500" />
                Export as JSON
              </Dropdown.Item>
              
              <Dropdown.Item onClick={exportAsWord} className="flex items-center">
                <File className="mr-2 h-4 w-4 text-indigo-500" />
                Export as Word (.docx)
              </Dropdown.Item>
              
              {!canExport() && (
                <Dropdown.Header>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">
                    Export permissions required
                  </span>
                </Dropdown.Header>
              )}
            </div>
          </Dropdown>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('internal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'internal'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HiUserGroup className="h-5 w-5" />
                <span>Internal Contributors</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'clients'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Client Payments</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <HiCreditCard className="h-5 w-5" />
                <span>Expense Contributors</span>
              </div>
            </button>
          </nav>
        </div>
      </Card>

      {/* Summary Cards */}
      {currentProcessedData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(currentProcessedData.totalAmount)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <HiCash className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'internal' ? 'Total Transactions' : 
                   activeTab === 'clients' ? 'Total Sessions' : 'Total Expenses'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'internal' ? currentProcessedData.totalTransactions : 
                   activeTab === 'clients' ? currentProcessedData.totalSessions : 
                   currentProcessedData.totalExpenses}
                </p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                {activeTab === 'internal' ? (
                  <HiUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                ) : activeTab === 'clients' ? (
                  <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <HiUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'internal' ? 'Contributors' : 
                   activeTab === 'clients' ? 'Clients' : 'Expense Contributors'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'internal' ? currentProcessedData.users?.length : 
                   activeTab === 'clients' ? currentProcessedData.clients?.length : 
                   currentProcessedData.users?.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'internal' 
                    ? formatCurrency(currentProcessedData.totalAmount / (currentProcessedData.totalTransactions || 1))
                    : activeTab === 'clients'
                    ? formatCurrency(currentProcessedData.totalAmount / (currentProcessedData.totalSessions || 1))
                    : formatCurrency(currentProcessedData.avgExpensePerUser || 0)
                  }
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Permission Notice for Expenses */}
      {activeTab === 'expenses' && profile?.role !== 'admin' && (
        <Alert color="info" className="mb-6">
          <div className="flex items-center">
            <HiUser className="mr-2 h-4 w-4" />
            <span>
              You are viewing your own expense contributions only. 
              {profile?.role === 'admin' ? '' : ' Admin users can see all expense contributors.'}
            </span>
          </div>
        </Alert>
      )}

      {/* Expense Charts */}
      {activeTab === 'expenses' && currentProcessedData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Contributors Pie Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Expense Contributors
              </h3>
              <HiChartPie className="h-5 w-5 text-blue-500" />
            </div>
            {currentProcessedData.pieChartData && currentProcessedData.pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={currentProcessedData.pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {currentProcessedData.pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                No expense data available for chart
              </div>
            )}
          </Card>

          {/* Expense Categories Bar Chart */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Expenses by Category
              </h3>
              <HiChartBar className="h-5 w-5 text-green-500" />
            </div>
            {currentProcessedData.categoryChartData && currentProcessedData.categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentProcessedData.categoryChartData}>
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="amount" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                No category data available for chart
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Top Contributors/Clients */}
      {currentProcessedData && (
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-2 mb-6">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top {activeTab === 'internal' ? 'Contributors' : 'Clients'}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(activeTab === 'internal' ? currentProcessedData.topContributors : currentProcessedData.topClients)?.map((item, index) => (
              <div key={item.name || item.id} className="relative">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(item.name)}`}>
                      {getInitials(item.name)}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeTab === 'internal' 
                        ? `${item.expenseCount + item.incomeCount} transactions`
                        : `${item.total_sessions} sessions`
                      }
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(activeTab === 'internal' ? item.totalPaid : item.total_spent)}
                    </p>
                    {activeTab === 'clients' && item.company && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {item.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
                      <HiFilter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <TextInput
              icon={HiSearch}
              placeholder={activeTab === 'internal' ? "Search by name..." : 
                          activeTab === 'clients' ? "Search by name, email, or company..." : 
                          "Search by name or email..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {(activeTab === 'internal' || activeTab === 'expenses') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <TextInput
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <TextInput
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Amount
            </label>
            <TextInput
              type="number"
              placeholder="0.00"
              value={minPayment}
              onChange={(e) => setMinPayment(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Data Table */}
      {currentProcessedData && (
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {activeTab === 'internal' ? 'Internal Contributors' : 
               activeTab === 'clients' ? 'Client Overview' : 'Expense Contributors'}
            </h3>
            <Badge color="info" size="sm">
              {activeTab === 'internal' ? currentProcessedData.users?.length : 
               activeTab === 'clients' ? currentProcessedData.clients?.length : 
               currentProcessedData.users?.length} {activeTab === 'internal' ? 'contributors' : 
               activeTab === 'clients' ? 'clients' : 'contributors'}
            </Badge>
          </div>
          {/* Render table based on active tab */}
          {activeTab === 'internal' && currentProcessedData && currentProcessedData.users && currentProcessedData.users.length > 0 && (
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell>Name</Table.HeadCell>
                  <Table.HeadCell>Total Amount</Table.HeadCell>
                  <Table.HeadCell>Expenses</Table.HeadCell>
                  <Table.HeadCell>Incomes</Table.HeadCell>
                  <Table.HeadCell>Avg Transaction</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {currentProcessedData.users.map((user, index) => (
                    <Table.Row key={user.name} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(user.name)}`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <span>{user.name}</span>
                            {user.profile?.email && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">{user.profile.email}</p>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(user.totalPaid)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="failure" size="sm">
                          {user.expenseCount}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="success" size="sm">
                          {user.incomeCount}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(user.avgTransaction)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
          
          {activeTab === 'clients' && currentProcessedData && currentProcessedData.clients && currentProcessedData.clients.length > 0 && (
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell>Name</Table.HeadCell>
                  <Table.HeadCell>Company</Table.HeadCell>
                  <Table.HeadCell>Total Spent</Table.HeadCell>
                  <Table.HeadCell>Sessions</Table.HeadCell>
                  <Table.HeadCell>Status</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {currentProcessedData.clients.map((client, index) => (
                    <Table.Row key={client.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                              <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(client.full_name)}`}>
                          {getInitials(client.full_name)}
                        </div>
                        <div>
                          <span>{client.full_name}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{client.email}</p>
                        </div>
                      </div>
                      </Table.Cell>
                      <Table.Cell className="text-gray-600 dark:text-gray-400">
                        {client.company || 'N/A'}
                      </Table.Cell>
                      <Table.Cell className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(client.total_spent)}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="info" size="sm">
                          {client.total_sessions}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={client.is_active ? "success" : "failure"} size="sm">
                          {client.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
          {activeTab === 'expenses' && currentProcessedData.users && currentProcessedData.users.length > 0 && (
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  <Table.HeadCell>Name</Table.HeadCell>
                  <Table.HeadCell>Total Expenses</Table.HeadCell>
                  <Table.HeadCell>Count</Table.HeadCell>
                  <Table.HeadCell>Average</Table.HeadCell>
                  <Table.HeadCell>Largest Expense</Table.HeadCell>
                  <Table.HeadCell>Categories</Table.HeadCell>
                  <Table.HeadCell>Last Expense</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                  {currentProcessedData.users.map((user, index) => (
                    <Table.Row key={user.userId} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(user.name)}`}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <span>{user.name}</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            <Badge color={user.role === 'admin' ? 'success' : 'info'} size="xs" className="mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(user.totalExpenses)}
                        {user.totalExpenses > 1000 && (
                          <Badge color="warning" size="xs" className="ml-2">
                            High Value
                          </Badge>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="failure" size="sm">
                          {user.expenseCount}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell className="text-gray-600 dark:text-gray-400">
                        {formatCurrency(user.avgExpense)}
                      </Table.Cell>
                      <Table.Cell className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(user.largestExpense)}
                      </Table.Cell>
                      <Table.Cell className="text-gray-600 dark:text-gray-400">
                        <div className="flex flex-wrap gap-1">
                          {user.categoriesArray?.slice(0, 2).map((category, idx) => (
                            <Badge key={idx} color="purple" size="xs">
                              {category}
                            </Badge>
                          ))}
                          {user.categoriesArray?.length > 2 && (
                            <Badge color="gray" size="xs">
                              +{user.categoriesArray.length - 2}
                            </Badge>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="text-gray-600 dark:text-gray-400">
                        {user.lastExpenseDate ? formatDate(user.lastExpenseDate) : 'N/A'}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
        </Card>
      )}

      {/* Empty state */}
      {!currentProcessedData && (
        <Card>
          <div className="text-center py-12">
            {activeTab === 'internal' ? (
              <HiUsers className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            ) : activeTab === 'clients' ? (
              <Building className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            ) : (
              <HiCreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            )}
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No {activeTab === 'internal' ? 'contributor' : 
                   activeTab === 'clients' ? 'client' : 'expense contributor'} data found
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {activeTab === 'internal' 
                ? 'Start by adding some expense and income records to see contributor analysis.'
                : activeTab === 'clients'
                ? 'Start by adding some clients and associating them with income records.'
                : 'Start by adding some expense records to see who contributed expenses.'
              }
            </p>
          </div>
        </Card>
      )}

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />
    </div>
  );
} 