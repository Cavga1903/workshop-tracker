import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Label, TextInput, Select, Alert, Badge, Card } from 'flowbite-react';
import { HiPencil, HiTrash, HiEye, HiPlus } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function IncomeList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);

  // Edit form data
  const [editForm, setEditForm] = useState({
    date: '',
    platform: '',
    classType: '',
    guestCount: '',
    payment: '',
    name: '',
    type: '',
    shippingCost: '',
    costPerGuest: ''
  });

  // Class types for dropdown
  const [classTypes, setClassTypes] = useState([]);

  useEffect(() => {
    if (user) {
      fetchIncomes();
      fetchClassTypes();
    }
  }, [user]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (err) {
      setError('Failed to fetch incomes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleEdit = (income) => {
    setSelectedIncome(income);
    setEditForm({
      date: income.date || '',
      platform: income.platform || '',
      classType: income.class_type || '',
      guestCount: income.guest_count?.toString() || '',
      payment: income.payment?.toString() || '',
      name: income.name || '',
      type: income.type || '',
      shippingCost: income.shipping_cost?.toString() || '',
      costPerGuest: income.cost_per_guest?.toString() || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const guestCount = Number(editForm.guestCount) || 0;
      const costPerGuest = Number(editForm.costPerGuest) || 0;
      const shippingCost = Number(editForm.shippingCost) || 0;
      const payment = Number(editForm.payment) || 0;
      const totalCost = guestCount * costPerGuest + shippingCost;
      const profit = payment - totalCost;

      const updatedData = {
        date: editForm.date,
        platform: editForm.platform,
        class_type: editForm.classType,
        guest_count: guestCount,
        payment: payment,
        name: editForm.name,
        type: editForm.classType,
        shipping_cost: shippingCost,
        cost_per_guest: costPerGuest,
        total_cost: totalCost,
        profit: profit
      };

      const { error } = await supabase
        .from('incomes')
        .update(updatedData)
        .eq('id', selectedIncome.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess('Income updated successfully!');
      setShowEditModal(false);
      fetchIncomes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update income: ' + err.message);
    }
  };

  const handleDelete = (income) => {
    setSelectedIncome(income);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', selectedIncome.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess('Income deleted successfully!');
      setShowDeleteModal(false);
      fetchIncomes();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete income: ' + err.message);
    }
  };

  const handleEditChange = (e) => {
    setEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading incomes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Income Records</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your workshop and class income records
          </p>
        </div>
        <Button
          gradientDuoTone="greenToBlue"
          onClick={() => navigate('/add-income')}
        >
          <HiPlus className="h-5 w-5 mr-2" />
          Add Income
        </Button>
      </div>

      {success && (
        <Alert color="success" onDismiss={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert color="failure" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      {incomes.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <HiPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No income records yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by adding your first income record to track your workshop earnings.
            </p>
            <Button
              gradientDuoTone="greenToBlue"
              onClick={() => navigate('/add-income')}
            >
              Add Your First Income
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Date</Table.HeadCell>
                <Table.HeadCell>Customer/Group</Table.HeadCell>
                <Table.HeadCell>Class Type</Table.HeadCell>
                <Table.HeadCell>Guests</Table.HeadCell>
                <Table.HeadCell>Payment</Table.HeadCell>
                <Table.HeadCell>Profit</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>
                  <span className="sr-only">Actions</span>
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {incomes.map((income) => (
                  <Table.Row key={income.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {formatDate(income.date)}
                    </Table.Cell>
                    <Table.Cell>{income.name}</Table.Cell>
                    <Table.Cell>
                      <Badge color="info" size="sm">
                        {income.class_type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{income.guest_count}</Table.Cell>
                    <Table.Cell className="font-semibold text-green-600">
                      {formatCurrency(income.payment)}
                    </Table.Cell>
                    <Table.Cell className={`font-semibold ${
                      (income.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(income.profit)}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge 
                        color={(income.profit || 0) >= 0 ? 'success' : 'failure'} 
                        size="sm"
                      >
                        {(income.profit || 0) >= 0 ? 'Profitable' : 'Loss'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleEdit(income)}
                        >
                          <HiPencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          color="failure"
                          onClick={() => handleDelete(income)}
                        >
                          <HiTrash className="h-3 w-3" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Card>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} size="2xl">
        <Modal.Header>Edit Income Record</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" value="Date" />
                <TextInput
                  id="date"
                  name="date"
                  type="date"
                  value={editForm.date}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="platform" value="Platform" />
                <TextInput
                  id="platform"
                  name="platform"
                  value={editForm.platform}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="classType" value="Class Type" />
                <Select
                  id="classType"
                  name="classType"
                  value={editForm.classType}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select class type</option>
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
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="guestCount" value="Guest Count" />
                <TextInput
                  id="guestCount"
                  name="guestCount"
                  type="number"
                  value={editForm.guestCount}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment" value="Payment" />
                <TextInput
                  id="payment"
                  name="payment"
                  type="number"
                  step="0.01"
                  value={editForm.payment}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="costPerGuest" value="Cost per Guest" />
                <TextInput
                  id="costPerGuest"
                  name="costPerGuest"
                  type="number"
                  step="0.01"
                  value={editForm.costPerGuest}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="shippingCost" value="Shipping Cost" />
                <TextInput
                  id="shippingCost"
                  name="shippingCost"
                  type="number"
                  step="0.01"
                  value={editForm.shippingCost}
                  onChange={handleEditChange}
                />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button gradientDuoTone="greenToBlue" onClick={handleEditSubmit}>
            Update Income
          </Button>
          <Button color="gray" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <Modal.Header>Confirm Delete</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <HiTrash className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this income record?
            </h3>
            {selectedIncome && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <p><strong>Customer:</strong> {selectedIncome.name}</p>
                <p><strong>Date:</strong> {formatDate(selectedIncome.date)}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedIncome.payment)}</p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={confirmDelete}>
            Yes, delete it
          </Button>
          <Button color="gray" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 