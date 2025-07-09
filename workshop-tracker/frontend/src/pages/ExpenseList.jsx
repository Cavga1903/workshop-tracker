import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Label, TextInput, Select, Alert, Badge, Card } from 'flowbite-react';
import { HiPencil, HiTrash, HiPlus } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

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

export default function ExpenseList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Edit form data
  const [editForm, setEditForm] = useState({
    month: '',
    name: '',
    cost: '',
    whoPaid: '',
    category: ''
  });

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      setError('Failed to fetch expenses: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setEditForm({
      month: expense.month || '',
      name: expense.name || '',
      cost: expense.cost?.toString() || '',
      whoPaid: expense.who_paid || '',
      category: expense.category || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        month: editForm.month,
        name: editForm.name,
        cost: Number(editForm.cost) || 0,
        who_paid: editForm.whoPaid,
        category: editForm.category
      };

      const { error } = await supabase
        .from('expenses')
        .update(updatedData)
        .eq('id', selectedExpense.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess('Expense updated successfully!');
      setShowEditModal(false);
      fetchExpenses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update expense: ' + err.message);
    }
  };

  const handleDelete = (expense) => {
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', selectedExpense.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess('Expense deleted successfully!');
      setShowDeleteModal(false);
      fetchExpenses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete expense: ' + err.message);
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

  const getCategoryColor = (category) => {
    const colors = {
      'Recurring': 'purple',
      'Shipping': 'blue',
      'Miscellaneous': 'gray',
      'Event & Consumables': 'green'
    };
    return colors[category] || 'gray';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Expense Records</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your workshop and business expense records
          </p>
        </div>
        <Button
          gradientDuoTone="redToOrange"
          onClick={() => navigate('/add-expense')}
        >
          <HiPlus className="h-5 w-5 mr-2" />
          Add Expense
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

      {expenses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <HiPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No expense records yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start by adding your first expense record to track your business costs.
            </p>
            <Button
              gradientDuoTone="redToOrange"
              onClick={() => navigate('/add-expense')}
            >
              Add Your First Expense
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Date</Table.HeadCell>
                <Table.HeadCell>Expense Name</Table.HeadCell>
                <Table.HeadCell>Month</Table.HeadCell>
                <Table.HeadCell>Category</Table.HeadCell>
                <Table.HeadCell>Who Paid</Table.HeadCell>
                <Table.HeadCell>Cost</Table.HeadCell>
                <Table.HeadCell>
                  <span className="sr-only">Actions</span>
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {expenses.map((expense) => (
                  <Table.Row key={expense.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {formatDate(expense.created_at)}
                    </Table.Cell>
                    <Table.Cell>{expense.name}</Table.Cell>
                    <Table.Cell>
                      <Badge color="indigo" size="sm">
                        {expense.month}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={getCategoryColor(expense.category)} size="sm">
                        {expense.category}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{expense.who_paid}</Table.Cell>
                    <Table.Cell className="font-semibold text-red-600">
                      {formatCurrency(expense.cost)}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleEdit(expense)}
                        >
                          <HiPencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="xs"
                          color="failure"
                          onClick={() => handleDelete(expense)}
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
        <Modal.Header>Edit Expense Record</Modal.Header>
        <Modal.Body>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="month" value="Month" />
                <Select
                  id="month"
                  name="month"
                  value={editForm.month}
                  onChange={handleEditChange}
                  required
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
                  value={editForm.name}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost" value="Cost" />
                <TextInput
                  id="cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  value={editForm.cost}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="whoPaid" value="Who Paid" />
                <TextInput
                  id="whoPaid"
                  name="whoPaid"
                  value={editForm.whoPaid}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="category" value="Category" />
                <Select
                  id="category"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button gradientDuoTone="redToOrange" onClick={handleEditSubmit}>
            Update Expense
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
              Are you sure you want to delete this expense record?
            </h3>
            {selectedExpense && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                <p><strong>Expense:</strong> {selectedExpense.name}</p>
                <p><strong>Month:</strong> {selectedExpense.month}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedExpense.cost)}</p>
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