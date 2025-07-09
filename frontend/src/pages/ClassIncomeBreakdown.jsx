import React, { useEffect, useState } from 'react';
import { Spinner, Alert, Table } from 'flowbite-react';
import supabase from '../supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

export default function ClassIncomeBreakdown() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchIncomes();
    }
  }, [user]);

  const fetchIncomes = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('incomes')
      .select('class_type, payment')
      .eq('user_id', user.id);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Group and sum by class_type
      const totals = {};
      (data || []).forEach((row) => {
        const cls = row.class_type || 'Uncategorized';
        totals[cls] = (totals[cls] || 0) + (row.payment || 0);
      });
      const chartData = Object.entries(totals).map(([classType, total]) => ({ classType, total }));
      setData(chartData);
      setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Class Income Breakdown</h2>
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
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="classType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#34d399" name="Total Payment" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Table>
            <Table.Head>
              <Table.HeadCell>Class Type</Table.HeadCell>
              <Table.HeadCell>Total Payment</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {data.map((row) => (
                <Table.Row key={row.classType}>
                  <Table.Cell>{row.classType}</Table.Cell>
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