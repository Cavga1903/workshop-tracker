import React, { useEffect, useState } from 'react';
import { Card, Spinner, Alert } from 'flowbite-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function WhoPaid() {
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
      .select('who_paid, cost')
      .eq('user_id', user.id);
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // Group and sum
      const totals = {};
      (data || []).forEach((row) => {
        const who = row.who_paid || 'Unknown';
        totals[who] = (totals[who] || 0) + (row.cost || 0);
      });
      setData(Object.entries(totals));
      setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Who Paid Breakdown</h2>
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Spinner size="xl" />
        </div>
      ) : error ? (
        <Alert color="failure">{error}</Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map(([name, total]) => (
            <Card key={name} className="bg-blue-50 border-blue-300">
              <div className="text-lg font-semibold">{name}</div>
              <div className="text-2xl font-bold">{total}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 