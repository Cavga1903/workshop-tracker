import React, { useState } from 'react';
import { Label, TextInput, Select, Button, Alert, Card } from 'flowbite-react';
import { HiCurrencyDollar, HiUser, HiCalendar, HiTag, HiCollection } from 'react-icons/hi';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

const initialState = {
  month: '',
  name: '',
  cost: '',
  whoPaid: '',
  category: '',
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const categories = [
  'Recurring',
  'Shipping',
  'Miscellaneous',
  'Event & Consumables',
];

export default function AddExpense() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to add expense');
      }

      // Convert camelCase to snake_case for database
      const expenseData = {
        user_id: user.id,
        month: form.month,
        name: form.name,
        cost: Number(form.cost) || 0,
        who_paid: form.whoPaid,
        category: form.category,
      };
      
      const { error } = await supabase.from('expenses').insert([expenseData]);
      
      if (error) throw error;
      
      setSuccess(true);
      setForm(initialState);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Add New Expense</h2>
        <p className="mt-2 text-gray-600">Record a new expense for your workshop</p>
      </div>

      {success && (
        <Alert color="success" onDismiss={() => setSuccess(false)}>
          Expense added successfully!
        </Alert>
      )}

      {error && (
        <Alert color="failure" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="month" value="Month" />
              <Select 
                id="month" 
                name="month" 
                value={form.month} 
                onChange={handleChange} 
                required
                icon={HiCalendar}
              >
                <option value="">Select month</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="name" value="Expense Name" />
              <TextInput 
                id="name" 
                name="name" 
                icon={HiTag}
                placeholder="Enter expense description"
                value={form.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div>
              <Label htmlFor="cost" value="Cost" />
              <TextInput 
                id="cost" 
                name="cost" 
                type="number" 
                icon={HiCurrencyDollar}
                min="0" 
                step="0.01"
                placeholder="0.00"
                value={form.cost} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div>
              <Label htmlFor="whoPaid" value="Who Paid" />
              <TextInput 
                id="whoPaid" 
                name="whoPaid" 
                icon={HiUser}
                placeholder="Enter payer's name"
                value={form.whoPaid} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="category" value="Category" />
              <Select 
                id="category" 
                name="category" 
                value={form.category} 
                onChange={handleChange} 
                required
                icon={HiCollection}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          </div>

          <Card className="bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
                <p className="text-lg font-semibold text-red-600">
                  ${(Number(form.cost) || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expense Impact</p>
                <p className="text-lg font-semibold text-red-600">
                  -${(Number(form.cost) || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              size="lg"
              gradientDuoTone="redToOrange"
              className="w-full md:w-auto"
              isProcessing={loading}
              disabled={loading}
            >
              {loading ? 'Adding Expense...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 