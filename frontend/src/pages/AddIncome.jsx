import React, { useState, useEffect } from 'react';
import { Label, TextInput, Select, Button, Alert, Card } from 'flowbite-react';
import { HiCash, HiUserGroup, HiCurrencyDollar, HiTruck } from 'react-icons/hi';
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
        <h2 className="text-3xl font-bold text-gray-900">Add New Income</h2>
        <p className="mt-2 text-gray-600">Record a new workshop or class income</p>
      </div>

      {success && (
        <Alert color="success" onDismiss={() => setSuccess(false)}>
          Income added successfully!
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
              <Label htmlFor="date" value="Date" />
              <TextInput
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="platform" value="Platform" />
              <TextInput
                id="platform"
                name="platform"
                icon={HiCash}
                placeholder="e.g., Zoom, In-Person"
                value={form.platform}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="classType" value="Class Type" />
              <Select
                id="classType"
                name="classType"
                value={form.classType}
                onChange={handleChange}
                required
                disabled={loadingClassTypes}
              >
                <option value="">
                  {loadingClassTypes ? 'Loading class types...' : 'Select class type'}
                </option>
                {classTypes.map((ct) => (
                  <option key={ct.id} value={ct.name}>{ct.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="name" value="Customer/Group Name" />
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
              <Label htmlFor="guestCount" value="Number of Guests" />
              <TextInput
                id="guestCount"
                name="guestCount"
                type="number"
                icon={HiUserGroup}
                min="1"
                value={form.guestCount}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="payment" value="Total Payment" />
              <TextInput
                id="payment"
                name="payment"
                type="number"
                icon={HiCurrencyDollar}
                min="0"
                step="0.01"
                value={form.payment}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="costPerGuest" value="Cost per Guest" />
              <TextInput
                id="costPerGuest"
                name="costPerGuest"
                type="number"
                icon={HiCurrencyDollar}
                min="0"
                step="0.01"
                value={form.costPerGuest}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="shippingCost" value="Shipping Cost" />
              <TextInput
                id="shippingCost"
                name="shippingCost"
                type="number"
                icon={HiTruck}
                min="0"
                step="0.01"
                value={form.shippingCost}
                onChange={handleChange}
              />
            </div>
          </div>

          <Card className="bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Cost</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  ${totalCost.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expected Profit</p>
                <p className={`text-lg font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profit.toFixed(2)}
                </p>
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="submit"
              size="lg"
              gradientDuoTone="greenToBlue"
              className="w-full md:w-auto"
              isProcessing={loading}
              disabled={loading}
            >
              {loading ? 'Adding Income...' : 'Add Income'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 