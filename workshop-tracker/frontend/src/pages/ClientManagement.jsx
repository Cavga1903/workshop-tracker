import React, { useEffect, useState } from 'react';
import { Card, Button, Table, Modal, TextInput, Textarea, Badge, Spinner, Alert } from 'flowbite-react';
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiEye, 
  HiRefresh,
  HiSearch,
  HiUsers,
  HiCurrencyDollar,
  HiMail,
  HiPhone,
  HiOfficeBuilding
} from 'react-icons/hi';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Mail, 
  Phone, 
  Building,
  UserPlus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ClientManagement() {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [clientForm, setClientForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('clients')
        .select(`
          *,
          profiles:created_by(full_name, email)
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      setClients(data || []);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setClientForm({
      full_name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: ''
    });
    setIsEditing(false);
    setSelectedClient(null);
  };

  const handleCreateClient = async () => {
    try {
      const clientData = {
        ...clientForm,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data, ...prev]);
      setShowModal(false);
      resetForm();
      toast.success('Client created successfully');
    } catch (err) {
      toast.error(`Error creating client: ${err.message}`);
    }
  };

  const handleUpdateClient = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientForm)
        .eq('id', selectedClient.id)
        .select()
        .single();

      if (error) throw error;

      setClients(prev => prev.map(client => 
        client.id === selectedClient.id ? data : client
      ));
      setShowModal(false);
      resetForm();
      toast.success('Client updated successfully');
    } catch (err) {
      toast.error(`Error updating client: ${err.message}`);
    }
  };

  const handleDeleteClient = async () => {
    try {
      // Check if client has related records
      const { data: incomes } = await supabase
        .from('incomes')
        .select('id')
        .eq('client_id', selectedClient.id)
        .limit(1);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('id')
        .eq('client_id', selectedClient.id)
        .limit(1);

      if (incomes?.length > 0 || expenses?.length > 0) {
        toast.error('Cannot delete client with existing income or expense records');
        return;
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== selectedClient.id));
      setShowDeleteModal(false);
      setSelectedClient(null);
      toast.success('Client deleted successfully');
    } catch (err) {
      toast.error(`Error deleting client: ${err.message}`);
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setClientForm({
      full_name: client.full_name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      notes: client.notes || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openDetailsModal = async (client) => {
    setSelectedClient(client);
    
    // Fetch related records
    try {
      const [incomeResult, expenseResult] = await Promise.all([
        supabase
          .from('incomes')
          .select('*')
          .eq('client_id', client.id)
          .order('date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
      ]);

      setSelectedClient({
        ...client,
        relatedIncomes: incomeResult.data || [],
        relatedExpenses: expenseResult.data || []
      });
    } catch (err) {
      console.error('Error fetching related records:', err);
    }

    setShowDetailsModal(true);
  };

  const filteredClients = clients.filter(client =>
    client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate summary statistics
  const stats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.is_active !== false).length,
    totalRevenue: clients.reduce((sum, client) => sum + (client.total_spent || 0), 0),
    totalSessions: clients.reduce((sum, client) => sum + (client.total_sessions || 0), 0)
  };

  if (!profile?.role === 'admin') {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Alert color="warning">
          <span className="font-medium">Access Denied:</span> You need admin privileges to manage clients.
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-center items-center h-64">
          <Spinner size="xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Alert color="failure" className="mb-6">
          <span className="font-medium">Error loading clients:</span> {error}
        </Alert>
        <Button onClick={fetchClients} className="mt-4">
          <HiRefresh className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            👥 Client Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage customer records and track client relationships
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={fetchClients} color="gray" size="sm">
            <HiRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreateModal} color="blue" size="sm">
            <HiPlus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Clients</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.totalClients}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active Clients</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.activeClients}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {stats.totalSessions}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <HiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <TextInput
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Clients Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Client</Table.HeadCell>
              <Table.HeadCell>Contact</Table.HeadCell>
              <Table.HeadCell>Company</Table.HeadCell>
              <Table.HeadCell>Stats</Table.HeadCell>
              <Table.HeadCell>Created</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <Table.Row key={client.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {client.full_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {client.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </Table.Cell>
                    
                    <Table.Cell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Mail className="h-3 w-3 mr-1" />
                          {client.email}
                        </div>
                        {client.phone && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3 mr-1" />
                            {client.phone}
                          </div>
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      {client.company ? (
                        <div className="flex items-center text-sm text-gray-900 dark:text-white">
                          <Building className="h-3 w-3 mr-1" />
                          {client.company}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatCurrency(client.total_spent)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {client.total_sessions} sessions
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(client.created_at)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          by {client.profiles?.full_name || 'Unknown'}
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge color={client.is_active !== false ? 'green' : 'red'} size="sm">
                        {client.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          color="blue"
                          onClick={() => openDetailsModal(client)}
                          className="!p-2"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => openEditModal(client)}
                          className="!p-2 !bg-gray-100 dark:!bg-gray-700 hover:!bg-gray-200 dark:hover:!bg-gray-600 !text-gray-700 dark:!text-gray-300"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="red"
                          onClick={() => {
                            setSelectedClient(client);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No clients found matching your search' : 'No clients added yet'}
                    </div>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      </Card>

      {/* Create/Edit Client Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="xl">
        <Modal.Header>
          {isEditing ? 'Edit Client' : 'Add New Client'}
        </Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <TextInput
                value={clientForm.full_name}
                onChange={(e) => setClientForm({...clientForm, full_name: e.target.value})}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <TextInput
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                placeholder="Enter email address"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <TextInput
                value={clientForm.phone}
                onChange={(e) => setClientForm({...clientForm, phone: e.target.value})}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company
              </label>
              <TextInput
                value={clientForm.company}
                onChange={(e) => setClientForm({...clientForm, company: e.target.value})}
                placeholder="Enter company name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <TextInput
                value={clientForm.address}
                onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                placeholder="Enter address"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <Textarea
                value={clientForm.notes}
                onChange={(e) => setClientForm({...clientForm, notes: e.target.value})}
                placeholder="Add notes about this client"
                rows={3}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            color="blue" 
            onClick={isEditing ? handleUpdateClient : handleCreateClient}
            disabled={!clientForm.full_name || !clientForm.email}
          >
            {isEditing ? 'Update Client' : 'Create Client'}
          </Button>
          <Button color="gray" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Client Details Modal */}
      <Modal show={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="2xl">
        <Modal.Header>
          Client Details: {selectedClient?.full_name}
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <div className="space-y-6">
              {/* Client Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.company && (
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{selectedClient.company}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Spent:</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedClient.total_spent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Sessions:</span>
                      <span className="text-sm font-medium">{selectedClient.total_sessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Joined:</span>
                      <span className="text-sm font-medium">{formatDate(selectedClient.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    {selectedClient.notes}
                  </p>
                </div>
              )}

              {/* Related Records */}
              {selectedClient.relatedIncomes && selectedClient.relatedIncomes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Income Records</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedClient.relatedIncomes.slice(0, 5).map((income) => (
                      <div key={income.id} className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900 rounded">
                        <span className="text-sm">{income.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(income.payment)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(income.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.relatedExpenses && selectedClient.relatedExpenses.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Related Expenses</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedClient.relatedExpenses.slice(0, 5).map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900 rounded">
                        <span className="text-sm">{expense.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(expense.cost)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDate(expense.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="md">
        <Modal.Header>
          Confirm Delete
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Trash2 className="mx-auto mb-4 h-14 w-14 text-red-600" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <strong>{selectedClient?.full_name}</strong>?
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              This action cannot be undone. The client record will be permanently removed.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="red" onClick={handleDeleteClient}>
            Yes, Delete
          </Button>
          <Button color="gray" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 