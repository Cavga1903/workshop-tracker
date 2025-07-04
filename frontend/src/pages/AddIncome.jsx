import React, { useState, useEffect } from 'react';
import { Label, TextInput, Select, Button, Alert, Card, Spinner } from 'flowbite-react';
import { HiCash, HiUserGroup, HiCurrencyDollar, HiTruck, HiCalendar, HiTag } from 'react-icons/hi';
import { BookOpen, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

const initialState = {
  date: new Date().toISOString().split('T')[0],
  platform: '',
  classType: '',
  guestCount: '',
  payment: '',
  name: '',
  type: 'In Person',
  shippingCost: '0',
  costPerGuest: '',
};

export default function AddIncome() {
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [classTypes, setClassTypes] = useState([]);
  const [loadingClassTypes, setLoadingClassTypes] = useState(true);

  useEffect(() => {
    fetchClassTypes();
  }, []);

  const fetchClassTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setClassTypes(data || []);
    } catch (err) {
      console.error('Error fetching class types:', err);
      setError('Failed to load class types');
    } finally {
      setLoadingClassTypes(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const guestCount = Number(form.guestCount) || 0;
  const costPerGuest = Number(form.costPerGuest) || 0;
  const shippingCost = Number(form.shippingCost) || 0;
  const payment = Number(form.payment) || 0;
  const totalCost = guestCount * costPerGuest + shippingCost;
  const profit = payment - totalCost;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user) {
        throw new Error('You must be logged in to add income');
      }

      // Convert camelCase to snake_case for database
      const incomeData = {
        user_id: user.id,
        date: form.date,
        platform: form.platform,
        class_type: form.classType,
        guest_count: guestCount,
        payment: payment,
        name: form.name,
        type: form.classType,
        shipping_cost: shippingCost,
        cost_per_guest: costPerGuest,
        total_cost: totalCost,
        profit: profit,
      };

      const { error } = await supabase.from('incomes').insert([incomeData]);

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
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Income</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Record a new workshop or class income</p>
      </div>

      {success && (
        <Alert color="success" onDismiss={() => setSuccess(false)} icon={CheckCircle}>
          <span className="font-medium">Success!</span> Income added successfully!
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
              <Label htmlFor="date" value="Date *" className="text-sm font-medium" />
              <TextInput
                id="date"
                name="date"
                type="date"
                icon={HiCalendar}
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="platform" value="Platform *" className="text-sm font-medium" />
              <TextInput
                id="platform"
                name="platform"
                icon={HiCash}
                placeholder="e.g., Zoom, In-Person, Eventbrite"
                value={form.platform}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="classType" value="Class Type *" className="text-sm font-medium" />
              <div className="relative">
                <Select
                  id="classType"
                  name="classType"
                  value={form.classType}
                  onChange={handleChange}
                  required
                  disabled={loadingClassTypes}
                  icon={BookOpen}
                  className="pr-10"
                >
                  <option value="">
                    {loadingClassTypes ? 'Loading class types...' : 'Select class type'}
                  </option>
                  {classTypes.map((ct) => (
                    <option key={ct.id} value={ct.name}>
                      {ct.name}
                    </option>
                  ))}
                </Select>
                {loadingClassTypes && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {classTypes.length > 0 ? `${classTypes.length} class types available` : 'Loading class types...'}
              </p>
            </div>

            <div>
              <Label htmlFor="name" value="Customer/Group Name *" className="text-sm font-medium" />
              <TextInput
                id="name"
                name="name"
                icon={HiUserGroup}
                placeholder="Enter customer or group name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="guestCount" value="Number of Guests *" className="text-sm font-medium" />
              <TextInput
                id="guestCount"
                name="guestCount"
                type="number"
                icon={HiUserGroup}
                min="1"
                placeholder="1"
                value={form.guestCount}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment" value="Total Payment *" className="text-sm font-medium" />
              <TextInput
                id="payment"
                name="payment"
                type="number"
                icon={HiCurrencyDollar}
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.payment}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="costPerGuest" value="Cost per Guest" className="text-sm font-medium" />
              <TextInput
                id="costPerGuest"
                name="costPerGuest"
                type="number"
                icon={HiCurrencyDollar}
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.costPerGuest}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="shippingCost" value="Shipping Cost" className="text-sm font-medium" />
              <TextInput
                id="shippingCost"
                name="shippingCost"
                type="number"
                icon={HiTruck}
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.shippingCost}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Financial Preview Card */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <HiCurrencyDollar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Total Payment
                  </p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${payment.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <HiTruck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Total Cost
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ${totalCost.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${profit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  <TrendingUp className={`h-5 w-5 ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Profit
                  </p>
                  <p className={`text-lg font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${profit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Workshop Details */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Workshop:</span>
                  <span className="ml-2 font-medium">{form.classType || 'Select class type'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Platform:</span>
                  <span className="ml-2 font-medium">{form.platform || 'Enter platform'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Guests:</span>
                  <span className="ml-2 font-medium">{guestCount} people</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Per Guest:</span>
                  <span className="ml-2 font-medium">${costPerGuest.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              size="lg"
              gradientDuoTone="greenToBlue"
              className="w-full md:w-auto"
              isProcessing={loading}
              disabled={loading || loadingClassTypes}
            >
              {loading ? 'Adding Income...' : 'Add Income'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Help Section */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
              About Class Types
            </h3>
            <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
              Class types are loaded from your database. If you don't see the class type you need, 
              please contact an administrator to add it to the system.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 