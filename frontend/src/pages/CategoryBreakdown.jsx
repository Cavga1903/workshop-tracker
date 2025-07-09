import React, { useEffect, useState } from 'react';
import { Spinner, Alert, Table } from 'flowbite-react';
import supabase from '../supabase/client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#34d399', '#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#f472b6', '#facc15'];

export default function CategoryBreakdown() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('expenses')
      .select('category, cost')
      .eq('user_id', user.id);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Group and sum by category
      const totals = {};
      (data || []).forEach((row) => {
        const cat = row.category || 'Uncategorized';
        totals[cat] = (totals[cat] || 0) + (row.cost || 0);
      });
      const chartData = Object.entries(totals).map(([category, total]) => ({ category, total }));
      setData(chartData);
      setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Category Breakdown</h2>
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
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {data.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Table>
            <Table.Head>
              <Table.HeadCell>Category</Table.HeadCell>
              <Table.HeadCell>Total</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {data.map((row) => (
                <Table.Row key={row.category}>
                  <Table.Cell>{row.category}</Table.Cell>
                  <Table.Cell>{row.total}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </>
      )}
    </div>
  );
} 