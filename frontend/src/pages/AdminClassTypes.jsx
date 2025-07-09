import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal, Label, TextInput, Alert, Spinner } from 'flowbite-react';
import { HiPlus, HiPencil, HiTrash, HiExclamation } from 'react-icons/hi';
import { CheckCircle, AlertCircle, Settings, DollarSign } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

export default function AdminClassTypes() {
  const { user, profile } = useAuth();
  const [classTypes, setClassTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    cost_per_person: ''
  });

  // Check if user has admin privileges
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchClassTypes();
  }, []);

  const fetchClassTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClassTypes(data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const typeData = {
        name: formData.name.trim(),
        cost_per_person: parseFloat(formData.cost_per_person) || 0
      };

      if (editingType) {
        // Update existing class type
        const { error } = await supabase
          .from('class_types')
          .update(typeData)
          .eq('id', editingType.id);

        if (error) throw error;
        toast.success('Class type updated successfully');
      } else {
        // Create new class type
        const { error } = await supabase
          .from('class_types')
          .insert([typeData]);

        if (error) throw error;
        toast.success('Class type created successfully');
      }

      // Reset form and close modal
      setFormData({ name: '', cost_per_person: '' });
      setEditingType(null);
      setShowModal(false);
      fetchClassTypes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classType) => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action');
      return;
    }
    setEditingType(classType);
    setFormData({
      name: classType.name,
      cost_per_person: classType.cost_per_person.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (classType) => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('class_types')
        .delete()
        .eq('id', classType.id);

      if (error) throw error;
      
      toast.success('Class type deleted successfully');
      setDeleteConfirm(null);
      fetchClassTypes();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNewType = () => {
    if (!isAdmin) {
      toast.error('You do not have permission to perform this action');
      return;
    }
    setEditingType(null);
    setFormData({ name: '', cost_per_person: '' });
    setShowModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Form validation helper
  const isFormValid = () => {
    return formData.name.trim().length > 0 && 
           formData.cost_per_person && 
           parseFloat(formData.cost_per_person) >= 0;
  };

  // Access denied for non-admin users
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
        <Card>
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiExclamation className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Admin Access Required
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please contact your system administrator to request admin access.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Class Types Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage class types and their pricing
          </p>
        </div>
        <Button onClick={handleNewType} size="lg" gradientDuoTone="purpleToBlue">
          <HiPlus className="mr-2 h-5 w-5" />
          Add Class Type
        </Button>
      </div>

      {/* Class Types Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Class Types ({classTypes.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner size="lg" />
          </div>
        ) : classTypes.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Class Types Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first class type to get started
            </p>
            <Button onClick={handleNewType} gradientDuoTone="purpleToBlue">
              <HiPlus className="mr-2 h-4 w-4" />
              Add Class Type
            </Button>
          </div>
        ) : (
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Name</Table.HeadCell>
              <Table.HeadCell>Cost Per Person</Table.HeadCell>
              <Table.HeadCell>Created</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {classTypes.map((classType) => (
                <Table.Row key={classType.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {classType.name}
                  </Table.Cell>
                  <Table.Cell className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      {formatCurrency(classType.cost_per_person)}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-gray-500 dark:text-gray-400">
                    {formatDate(classType.created_at)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        color="blue"
                        onClick={() => handleEdit(classType)}
                      >
                        <HiPencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="red"
                        onClick={() => setDeleteConfirm(classType)}
                      >
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <Modal.Header>
          {editingType ? 'Edit Class Type' : 'Add New Class Type'}
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" value="Class Type Name *" />
              <TextInput
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Pottery, Painting, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="cost_per_person" value="Cost Per Person *" />
              <TextInput
                id="cost_per_person"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_person}
                onChange={(e) => setFormData({ ...formData, cost_per_person: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={loading || !isFormValid()}
            gradientDuoTone="purpleToBlue"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {editingType ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                {editingType ? 'Update' : 'Create'} Class Type
              </>
            )}
          </Button>
          <Button color="gray" onClick={() => setShowModal(false)} disabled={loading}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <Modal.Header>Confirm Delete</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <HiExclamation className="mx-auto mb-4 h-14 w-14 text-red-600" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete "{deleteConfirm?.name}"?
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="failure" onClick={() => handleDelete(deleteConfirm)}>
            Yes, Delete
          </Button>
          <Button color="gray" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
} 