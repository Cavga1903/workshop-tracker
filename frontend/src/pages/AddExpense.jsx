import React, { useState, useEffect } from 'react';
import { Label, TextInput, Select, Button, Alert, Card, Spinner } from 'flowbite-react';
import { HiCurrencyDollar, HiUser, HiCalendar, HiTag, HiCollection } from 'react-icons/hi';
import { CheckCircle, AlertCircle } from 'lucide-react';
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
  const { user, profile } = useAuth();
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCurrentUserName = () => {
    if (profile?.full_name) return profile.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'Current User';
  };

  useEffect(() => {
    // Pre-select current user as the payer
    if (user && !form.whoPaid) {
      const userName = getCurrentUserName();
      setForm(prev => ({ ...prev, whoPaid: userName }));
    }
  }, [user, profile]);

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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Expense</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Record a new expense for your workshop</p>
      </div>

      {success && (
        <Alert color="success" onDismiss={() => setSuccess(false)} icon={CheckCircle}>
          <span className="font-medium">Success!</span> Expense added successfully!
        </Alert>
      )}

      {error && (
        <Alert color="failure" onDismiss={() => setError(null)} icon={AlertCircle}>
          <span className="font-medium">Error:</span> {error}
        </Alert>
      )}

      <Card>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="month" value="Month *" className="text-sm font-medium" />
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
              <Label htmlFor="name" value="Expense Name *" className="text-sm font-medium" />
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
              <Label htmlFor="cost" value="Cost *" className="text-sm font-medium" />
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
              <Label htmlFor="whoPaid" value="Who Paid *" className="text-sm font-medium" />
              <TextInput 
                id="whoPaid" 
                name="whoPaid" 
                value={form.whoPaid} 
                icon={HiUser}
                readOnly
                disabled
                className="bg-gray-50 dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                All expenses are automatically assigned to you as the payer
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="category" value="Category *" className="text-sm font-medium" />
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

          {/* Preview Card */}
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <HiCurrencyDollar className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Expense Preview
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {form.name || 'Expense Name'} • {form.category || 'Category'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  ${(Number(form.cost) || 0).toFixed(2)}
                </p>
                <p className="text-xs text-red-500 dark:text-red-500">
                  Paid by: {form.whoPaid || getCurrentUserName()}
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
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

      {/* Help Section */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HiUser className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              About "Who Paid"
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              For security reasons, you can only record expenses that you paid for. 
              Other users in the system are visible but cannot be selected as payers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 