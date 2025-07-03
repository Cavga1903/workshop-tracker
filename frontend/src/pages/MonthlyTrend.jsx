import React, { useEffect, useState } from 'react';
import { Spinner, Alert, Table } from 'flowbite-react';
import supabase from '../supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

function getMonthKey(dateStr) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (isNaN(d)) return 'Unknown';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function MonthlyTrend() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    // Fetch user's incomes
    const { data: incomes, error: incomeError } = await supabase
      .from('incomes')
      .select('date, payment')
      .eq('user_id', user.id);
    // Fetch user's expenses
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('month, cost')
      .eq('user_id', user.id);
      if (incomeError || expenseError) {
        setError(incomeError?.message || expenseError?.message);
        setLoading(false);
        return;
      }
      // Aggregate incomes by month
      const incomeByMonth = {};
      (incomes || []).forEach((row) => {
        const key = getMonthKey(row.date);
        incomeByMonth[key] = (incomeByMonth[key] || 0) + (row.payment || 0);
      });
      // Aggregate expenses by month
      const expenseByMonth = {};
      (expenses || []).forEach((row) => {
        // Try to parse month as YYYY-MM, fallback to string
        let key = row.month;
        if (key && key.length === 3) {
          // e.g. 'May' -> '2023-05' (assume current year)
          const now = new Date();
          key = `${now.getFullYear()}-${String(new Date(`${row.month} 1`).getMonth() + 1).padStart(2, '0')}`;
        }
        expenseByMonth[key] = (expenseByMonth[key] || 0) + (row.cost || 0);
      });
      // Merge months
      const allMonths = Array.from(new Set([...Object.keys(incomeByMonth), ...Object.keys(expenseByMonth)])).sort();
      const chartData = allMonths.map((month) => {
        const income = incomeByMonth[month] || 0;
        const expense = expenseByMonth[month] || 0;
        return {
          month,
          income,
          expense,
          profit: income - expense,
        };
      });
      setData(chartData);
      setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Monthly Trend</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner size="xl" />
        </div>
      ) : error ? (
        <Alert color="failure">{error}</Alert>
      ) : (
        <>
          <div className="w-full h-80 mb-8">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#34d399" name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#f87171" name="Expense" />
                <Line type="monotone" dataKey="profit" stroke="#fbbf24" name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Table>
            <Table.Head>
              <Table.HeadCell>Month</Table.HeadCell>
              <Table.HeadCell>Income</Table.HeadCell>
              <Table.HeadCell>Expense</Table.HeadCell>
              <Table.HeadCell>Profit</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {data.map((row) => (
                <Table.Row key={row.month}>
                  <Table.Cell>{row.month}</Table.Cell>
                  <Table.Cell>{row.income}</Table.Cell>
                  <Table.Cell>{row.expense}</Table.Cell>
                  <Table.Cell>{row.profit}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>
      )}
    </div>
  );
} 