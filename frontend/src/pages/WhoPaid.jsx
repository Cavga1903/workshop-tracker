import React, { useEffect, useState, useMemo } from 'react';
import { Card, Button, Alert, Table, Badge, TextInput, Select, Spinner, Dropdown } from 'flowbite-react';
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
  HiChevronDown
} from 'react-icons/hi';
import { Crown, TrendingUp, Calendar, DollarSign, FileText, Download, FileSpreadsheet, FileJson, File } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow, TableCell, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import toast, { Toaster } from 'react-hot-toast';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

export default function WhoPaid() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [minPayment, setMinPayment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'totalPaid', direction: 'desc' });

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Process data for analytics
  const processedData = useMemo(() => {
    if (!expenses.length) return null;

    // Filter expenses based on date range and search
    let filteredExpenses = expenses;

    if (dateRange.start || dateRange.end) {
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.created_at);
        const start = dateRange.start ? new Date(dateRange.start) : new Date('1900-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date();
        return expenseDate >= start && expenseDate <= end;
      });
    }

    if (searchTerm) {
      filteredExpenses = filteredExpenses.filter(expense => 
        expense.who_paid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Group by who_paid
    const groupedData = {};
    filteredExpenses.forEach(expense => {
      const payer = expense.who_paid || 'Unknown';
      if (!groupedData[payer]) {
        groupedData[payer] = {
          name: payer,
          totalPaid: 0,
          paymentCount: 0,
          payments: [],
          avgPayment: 0,
          lastPayment: null
        };
      }
      
      groupedData[payer].totalPaid += expense.cost || 0;
      groupedData[payer].paymentCount += 1;
      groupedData[payer].payments.push(expense);
      
      const paymentDate = new Date(expense.created_at);
      if (!groupedData[payer].lastPayment || paymentDate > new Date(groupedData[payer].lastPayment)) {
        groupedData[payer].lastPayment = expense.created_at;
      }
    });

    // Calculate averages and apply minimum payment filter
    const processedUsers = Object.values(groupedData)
      .map(user => ({
        ...user,
        avgPayment: user.totalPaid / user.paymentCount
      }))
      .filter(user => !minPayment || user.totalPaid >= parseFloat(minPayment));

    // Sort data
    const sortedUsers = [...processedUsers].sort((a, b) => {
      if (sortConfig.direction === 'asc') {
        return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
      }
      return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
    });

    // Get monthly data for charts
    const monthlyData = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const payer = expense.who_paid || 'Unknown';
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey };
      }
      
      monthlyData[monthKey][payer] = (monthlyData[monthKey][payer] || 0) + (expense.cost || 0);
    });

    const monthlyChartData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months

    // Pie chart data
    const pieChartData = sortedUsers.map((user, index) => ({
      name: user.name,
      value: user.totalPaid,
      color: COLORS[index % COLORS.length]
    }));

    // Recent payments (last 5)
    const recentPayments = filteredExpenses
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    return {
      users: sortedUsers,
      topContributors: sortedUsers.slice(0, 3),
      monthlyData: monthlyChartData,
      pieChartData,
      recentPayments,
      totalAmount: sortedUsers.reduce((sum, user) => sum + user.totalPaid, 0),
      totalPayments: sortedUsers.reduce((sum, user) => sum + user.paymentCount, 0)
    };
  }, [expenses, dateRange, minPayment, searchTerm, sortConfig]);

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
    if (!processedData) return null;

    const timestamp = new Date().toISOString();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const summary = {
      exportTimestamp: timestamp,
      exportDate: dateStr,
      filters: {
        dateRange: dateRange.start || dateRange.end ? 
          `${dateRange.start || 'All'} to ${dateRange.end || 'All'}` : 'All dates',
        searchTerm: searchTerm || 'None',
        minPayment: minPayment || 'None'
      },
      totals: {
        totalPaid: processedData.totalAmount,
        totalPayments: processedData.totalPayments,
        contributors: processedData.users.length,
        avgPayment: processedData.totalAmount / processedData.totalPayments
      }
    };

    const contributorsData = processedData.users.map(user => ({
      Name: user.name,
      'Total Paid': user.totalPaid,
      'Payment Count': user.paymentCount,
      'Average Payment': user.avgPayment,
      'Last Payment': user.lastPayment ? new Date(user.lastPayment).toLocaleDateString() : 'N/A'
    }));

    const topContributor = processedData.topContributors[0] || null;

    return {
      summary,
      contributorsData,
      topContributor,
      recentPayments: processedData.recentPayments.slice(0, 5),
      timestamp,
      dateStr
    };
  };

  // Export as CSV
  const exportAsCSV = () => {
    try {
      const data = getExportData();
      if (!data) return;

      const headers = ['Name', 'Total Paid', 'Payment Count', 'Average Payment', 'Last Payment'];
      const rows = data.contributorsData.map(user => [
        user.Name,
        user['Total Paid'],
        user['Payment Count'],
        user['Average Payment'].toFixed(2),
        user['Last Payment']
      ]);

      const csvContent = [
        `# Who Paid Breakdown Report - ${data.dateStr}`,
        `# Export Time: ${data.timestamp}`,
        `# Filters: ${data.summary.filters.dateRange}, Search: ${data.summary.filters.searchTerm}`,
        `# Total Amount: $${data.summary.totals.totalPaid.toFixed(2)}, Contributors: ${data.summary.totals.contributors}`,
        '',
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `who-paid-breakdown-${data.dateStr}.csv`);
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
      if (!data) return;

      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Who Paid Breakdown Report'],
        ['Export Date', data.dateStr],
        ['Export Time', data.timestamp],
        [''],
        ['Summary'],
        ['Total Paid', `$${data.summary.totals.totalPaid.toFixed(2)}`],
        ['Total Payments', data.summary.totals.totalPayments],
        ['Contributors', data.summary.totals.contributors],
        ['Average Payment', `$${data.summary.totals.avgPayment.toFixed(2)}`],
        [''],
        ['Filters Applied'],
        ['Date Range', data.summary.filters.dateRange],
        ['Search Term', data.summary.filters.searchTerm],
        ['Min Payment', data.summary.filters.minPayment],
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

      // Contributors sheet
      const contributorsWs = XLSX.utils.json_to_sheet(data.contributorsData);
      XLSX.utils.book_append_sheet(wb, contributorsWs, 'Contributors');

      // Recent payments sheet
      const recentPaymentsData = data.recentPayments.map(payment => ({
        'Who Paid': payment.who_paid,
        'Amount': payment.cost,
        'Description': payment.name,
        'Category': payment.category,
        'Date': new Date(payment.created_at).toLocaleDateString()
      }));
      const recentWs = XLSX.utils.json_to_sheet(recentPaymentsData);
      XLSX.utils.book_append_sheet(wb, recentWs, 'Recent Payments');

      XLSX.writeFile(wb, `who-paid-breakdown-${data.dateStr}.xlsx`);
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
        <Button onClick={fetchExpenses} className="mt-4">
          <HiRefresh className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!processedData || processedData.users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <HiUsers className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            No payment data found
          </h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Start by adding some expense records to see who paid analysis.
          </p>
        </div>
      </div>
    );
  }

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const thisMonthContributor = processedData.users.find(user => {
    const thisMonth = new Date();
    const userPayments = user.payments.filter(payment => {
      const paymentDate = new Date(payment.created_at);
      return paymentDate.getMonth() === thisMonth.getMonth() && 
             paymentDate.getFullYear() === thisMonth.getFullYear();
    });
    return userPayments.length > 0;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Who Paid Breakdown
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive payment analytics and contributor insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={fetchExpenses} color="gray" size="sm">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(processedData.totalAmount)}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {processedData.totalPayments}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <HiUsers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contributors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {processedData.users.length}
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Payment</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(processedData.totalAmount / processedData.totalPayments)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Contributors */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center space-x-2 mb-6">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Contributors
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {processedData.topContributors.map((contributor, index) => (
            <div key={contributor.name} className="relative">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(contributor.name)}`}>
                    {getInitials(contributor.name)}
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {contributor.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contributor.paymentCount} payments
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(contributor.totalPaid)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last: {formatDate(contributor.lastPayment)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bonus: Who Paid Most This Month */}
      {thisMonthContributor && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Contributor This Month ({currentMonth})
              </h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {thisMonthContributor.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {thisMonthContributor.paymentCount} payments • {formatCurrency(thisMonthContributor.totalPaid)} total
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
          <HiFilter className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <TextInput
              icon={HiSearch}
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Min Payment
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Contributions Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-2 mb-4">
            <HiChartBar className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monthly Contributions
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData.monthlyData}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    const [year, month] = value.split('-');
                    return `${month}/${year.slice(-2)}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(label) => {
                    const [year, month] = label.split('-');
                    return `${month}/${year}`;
                  }}
                />
                <Legend />
                {processedData.users.slice(0, 5).map((user, index) => (
                  <Bar 
                    key={user.name} 
                    dataKey={user.name} 
                    fill={COLORS[index % COLORS.length]}
                    name={user.name}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-2 mb-4">
            <HiChartPie className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Payment Distribution
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {processedData.pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Payment Summary Table */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Payment Summary
          </h3>
          <Badge color="info" size="sm">
            {processedData.users.length} contributors
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <button 
                    onClick={() => handleSort('name')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {sortConfig.key === 'name' ? (
                      sortConfig.direction === 'asc' ? <HiSortAscending className="h-4 w-4" /> : <HiSortDescending className="h-4 w-4" />
                    ) : <HiSortAscending className="h-4 w-4" />}
                  </button>
                </div>
              </Table.HeadCell>
              <Table.HeadCell>
                <div className="flex items-center space-x-1">
                  <span>Total Payment</span>
                  <button 
                    onClick={() => handleSort('totalPaid')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {sortConfig.key === 'totalPaid' ? (
                      sortConfig.direction === 'asc' ? <HiSortAscending className="h-4 w-4" /> : <HiSortDescending className="h-4 w-4" />
                    ) : <HiSortAscending className="h-4 w-4" />}
                  </button>
                </div>
              </Table.HeadCell>
              <Table.HeadCell>
                <div className="flex items-center space-x-1">
                  <span>Number of Payments</span>
                  <button 
                    onClick={() => handleSort('paymentCount')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {sortConfig.key === 'paymentCount' ? (
                      sortConfig.direction === 'asc' ? <HiSortAscending className="h-4 w-4" /> : <HiSortDescending className="h-4 w-4" />
                    ) : <HiSortAscending className="h-4 w-4" />}
                  </button>
                </div>
              </Table.HeadCell>
              <Table.HeadCell>
                <div className="flex items-center space-x-1">
                  <span>Avg Payment</span>
                  <button 
                    onClick={() => handleSort('avgPayment')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {sortConfig.key === 'avgPayment' ? (
                      sortConfig.direction === 'asc' ? <HiSortAscending className="h-4 w-4" /> : <HiSortDescending className="h-4 w-4" />
                    ) : <HiSortAscending className="h-4 w-4" />}
                  </button>
                </div>
              </Table.HeadCell>
              <Table.HeadCell>Last Payment Date</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {processedData.users.map((user, index) => (
                <Table.Row key={user.name} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(user.name)}`}>
                        {getInitials(user.name)}
                      </div>
                      <span>{user.name}</span>
                      {index < 3 && (
                        <Badge color="warning" size="xs">
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell className="font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(user.totalPaid)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="info" size="sm">
                      {user.paymentCount}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    {formatCurrency(user.avgPayment)}
                  </Table.Cell>
                  <Table.Cell className="text-gray-600 dark:text-gray-400">
                    {formatDate(user.lastPayment)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card>

      {/* Recent Payments */}
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center space-x-2 mb-4">
          <HiClock className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Payments
          </h3>
        </div>
        <div className="space-y-4">
          {processedData.recentPayments.map((payment, index) => (
            <div 
              key={payment.id} 
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(payment.who_paid)}`}>
                  {getInitials(payment.who_paid)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {payment.who_paid || 'Unknown'}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {payment.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(payment.cost)}
                </p>
                <Badge color="gray" size="xs">
                  {payment.category}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

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