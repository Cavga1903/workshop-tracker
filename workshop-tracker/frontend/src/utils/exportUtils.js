import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Column definitions with key and label
 */
export const exportToCSV = (data, filename, columns) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Create CSV header
    const headers = columns.map(col => col.label).join(',');
    
    // Create CSV rows
    const rows = data.map(item => {
      return columns.map(col => {
        let value = item[col.key];
        
        // Handle different data types
        if (value === null || value === undefined) {
          value = '';
        } else if (typeof value === 'string' && value.includes(',')) {
          value = `"${value.replace(/"/g, '""')}"`;
        } else if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        return value;
      }).join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
    
    return true;
  } catch (error) {
    console.error('CSV Export Error:', error);
    return false;
  }
};

/**
 * Export data to Excel format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Column definitions with key and label
 * @param {string} sheetName - Name of the Excel sheet
 */
export const exportToExcel = (data, filename, columns, sheetName = 'Data') => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Prepare data for Excel
    const excelData = data.map(item => {
      const row = {};
      columns.forEach(col => {
        let value = item[col.key];
        
        // Format dates
        if (col.type === 'date' && value) {
          value = new Date(value).toLocaleDateString();
        }
        // Format currency
        else if (col.type === 'currency' && typeof value === 'number') {
          value = `$${value.toFixed(2)}`;
        }
        // Handle objects
        else if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        row[col.label] = value || '';
      });
      return row;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Auto-size columns
    const colWidths = columns.map(col => {
      const maxLength = Math.max(
        col.label.length,
        ...data.map(item => String(item[col.key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Save file
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return true;
  } catch (error) {
    console.error('Excel Export Error:', error);
    return false;
  }
};

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {Array} columns - Column definitions with key and label
 * @param {Object} options - PDF options
 */
export const exportToPDF = (data, filename, columns, options = {}) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const {
      title = 'Data Export',
      orientation = 'landscape',
      pageSize = 'a4',
      fontSize = 8,
      includeSummary = false,
      companyName = 'Kraft Universe Workshop Tracker'
    } = options;

    // Create PDF document
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    });

    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);
    
    // Add company name
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyName, 14, 28);
    
    // Add export date
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // Prepare table data
    const tableColumns = columns.map(col => col.label);
    const tableRows = data.map(item => {
      return columns.map(col => {
        let value = item[col.key];
        
        if (col.type === 'date' && value) {
          value = new Date(value).toLocaleDateString();
        } else if (col.type === 'currency' && typeof value === 'number') {
          value = `$${value.toFixed(2)}`;
        } else if (typeof value === 'object' && value !== null) {
          value = JSON.stringify(value);
        }
        
        return String(value || '');
      });
    });

    // Add table
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 45,
      styles: {
        fontSize,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue header
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Light gray alternate rows
      },
      margin: { top: 45, right: 14, bottom: 20, left: 14 },
    });

    // Add summary if requested
    if (includeSummary && data.length > 0) {
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Records: ${data.length}`, 14, finalY);
      
      // Add financial summary if applicable
      const numericColumns = columns.filter(col => col.type === 'currency');
      if (numericColumns.length > 0) {
        let summaryY = finalY + 6;
        numericColumns.forEach(col => {
          const sum = data.reduce((total, item) => {
            const value = parseFloat(item[col.key]) || 0;
            return total + value;
          }, 0);
          doc.text(`Total ${col.label}: $${sum.toFixed(2)}`, 14, summaryY);
          summaryY += 6;
        });
      }
    }

    // Save PDF
    doc.save(`${filename}.pdf`);
    
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    return false;
  }
};

/**
 * Export financial summary with charts (PDF)
 * @param {Object} summaryData - Financial summary data
 * @param {string} filename - Name of the file
 */
export const exportFinancialSummary = (summaryData, filename) => {
  try {
    const {
      totalIncome = 0,
      totalExpenses = 0,
      totalProfit = 0,
      period = 'All Time',
      incomeRecords = [],
      expenseRecords = []
    } = summaryData;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Summary Report', 14, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Period: ${period}`, 14, 35);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 42);

    // Financial Overview
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Overview', 14, 60);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Income box
    doc.setFillColor(236, 253, 245); // Green background
    doc.rect(14, 70, 180, 15, 'F');
    doc.setTextColor(21, 128, 61);
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 18, 80);
    
    // Expenses box
    doc.setFillColor(254, 242, 242); // Red background
    doc.rect(14, 90, 180, 15, 'F');
    doc.setTextColor(185, 28, 28);
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 18, 100);
    
    // Profit box
    const profitColor = totalProfit >= 0 ? [21, 128, 61] : [185, 28, 28];
    const profitBg = totalProfit >= 0 ? [236, 253, 245] : [254, 242, 242];
    doc.setFillColor(...profitBg);
    doc.rect(14, 110, 180, 15, 'F');
    doc.setTextColor(...profitColor);
    doc.text(`Net Profit: $${totalProfit.toFixed(2)}`, 18, 120);
    
    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Recent Income Records
    if (incomeRecords.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Income Records', 14, 145);
      
      const incomeColumns = ['Date', 'Name', 'Amount', 'Platform'];
      const incomeRows = incomeRecords.slice(0, 10).map(record => [
        new Date(record.date || record.created_at).toLocaleDateString(),
        record.name || 'N/A',
        `$${(record.payment || 0).toFixed(2)}`,
        record.platform || 'N/A'
      ]);

      doc.autoTable({
        head: [incomeColumns],
        body: incomeRows,
        startY: 150,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 14, right: 14 },
      });
    }

    // Recent Expense Records
    if (expenseRecords.length > 0) {
      const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 200;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Recent Expense Records', 14, startY);
      
      const expenseColumns = ['Date', 'Name', 'Amount', 'Category'];
      const expenseRows = expenseRecords.slice(0, 10).map(record => [
        record.month || new Date(record.created_at).toLocaleDateString(),
        record.name || 'N/A',
        `$${(record.cost || 0).toFixed(2)}`,
        record.category || 'N/A'
      ]);

      doc.autoTable({
        head: [expenseColumns],
        body: expenseRows,
        startY: startY + 5,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [239, 68, 68] },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Kraft Universe Workshop Tracker - Financial Report', 14, pageHeight - 10);

    // Save PDF
    doc.save(`${filename}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Financial Summary Export Error:', error);
    return false;
  }
};

/**
 * Get column definitions for different data types
 */
export const getColumnDefinitions = {
  income: [
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'name', label: 'Customer/Group', type: 'text' },
    { key: 'class_type', label: 'Class Type', type: 'text' },
    { key: 'platform', label: 'Platform', type: 'text' },
    { key: 'guest_count', label: 'Guests', type: 'number' },
    { key: 'payment', label: 'Payment', type: 'currency' },
    { key: 'profit', label: 'Profit', type: 'currency' },
  ],
  expense: [
    { key: 'month', label: 'Month', type: 'text' },
    { key: 'name', label: 'Expense Name', type: 'text' },
    { key: 'cost', label: 'Cost', type: 'currency' },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'who_paid', label: 'Who Paid', type: 'text' },
  ],
  client: [
    { key: 'full_name', label: 'Full Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'total_spent', label: 'Total Spent', type: 'currency' },
    { key: 'total_sessions', label: 'Total Sessions', type: 'number' },
    { key: 'created_at', label: 'Created Date', type: 'date' },
  ],
  emailNotification: [
    { key: 'sent_at', label: 'Date & Time', type: 'date' },
    { key: 'record_type', label: 'Type', type: 'text' },
    { key: 'subject', label: 'Subject', type: 'text' },
    { key: 'recipients_count', label: 'Recipients', type: 'number' },
    { key: 'failed_count', label: 'Failed', type: 'number' },
  ]
}; 