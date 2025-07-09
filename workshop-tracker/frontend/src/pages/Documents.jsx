import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, TextInput, Select, Spinner, Table } from 'flowbite-react';
import { HiSearch, HiFilter, HiRefresh, HiFolder, HiDocument } from 'react-icons/hi';
import { FileText, Image, Building, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import DocumentUpload from '../components/DocumentUpload';
import FilePreview from '../components/FilePreview';

export default function Documents() {
  const { user, profile } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSource, setFilterSource] = useState('all');

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          workshops:workshop_id(name),
          incomes:income_id(name),
          expenses:expense_id(name),
          clients:client_id(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // If not admin, only show user's own documents
      if (profile?.role !== 'admin') {
        query = query.eq('uploaded_by', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Fetch profile information for each document
      const documentsWithProfiles = await Promise.all(
        (data || []).map(async (doc) => {
          if (doc.uploaded_by) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', doc.uploaded_by)
              .single();
            
            return { ...doc, profiles: profile };
          }
          return doc;
        })
      );
      
      setDocuments(documentsWithProfiles);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || doc.document_type === filterType;

    const matchesSource = filterSource === 'all' || 
      (filterSource === 'workshop' && doc.workshop_id) ||
      (filterSource === 'income' && doc.income_id) ||
      (filterSource === 'expense' && doc.expense_id) ||
      (filterSource === 'client' && doc.client_id) ||
      (filterSource === 'standalone' && !doc.workshop_id && !doc.income_id && !doc.expense_id && !doc.client_id);

    return matchesSearch && matchesType && matchesSource;
  });

  const getFileIcon = (fileName, documentType) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (documentType === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    return <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSourceInfo = (doc) => {
    if (doc.workshop_id && doc.workshops) {
      return { type: 'Workshop', name: doc.workshops.name, icon: Users };
    }
    if (doc.income_id && doc.incomes) {
      return { type: 'Income', name: doc.incomes.name, icon: FileText };
    }
    if (doc.expense_id && doc.expenses) {
      return { type: 'Expense', name: doc.expenses.name, icon: FileText };
    }
    if (doc.client_id && doc.clients) {
      return { type: 'Client', name: doc.clients.name, icon: Building };
    }
    return { type: 'Standalone', name: 'General Upload', icon: HiDocument };
  };

  const handleUploadComplete = (newDocuments) => {
    fetchDocuments(); // Refresh the list
  };

  const handleDocumentsChange = (updatedDocuments) => {
    setDocuments(updatedDocuments);
  };

  const handleDownload = async (document) => {
    try {
      const response = await fetch(document.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Download failed');
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert color="failure" className="mb-6">
          <span className="font-medium">Error loading documents:</span> {error}
        </Alert>
        <Button onClick={fetchDocuments} className="mt-4">
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
            Document Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload, organize, and manage workshop documents
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={fetchDocuments} color="gray" size="sm">
            <HiRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <DocumentUpload
        documents={documents}
        onUploadComplete={handleUploadComplete}
        onDocumentsChange={handleDocumentsChange}
      />

      {/* Filters */}
      <Card>
        <div className="flex items-center space-x-2 mb-4">
                      <HiFilter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <TextInput
              icon={HiSearch}
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Document Type
            </label>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="invoice">Invoice</option>
              <option value="receipt">Receipt</option>
              <option value="contract">Contract</option>
              <option value="photo">Photo</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Source
            </label>
            <Select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="workshop">Workshop</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="client">Client</option>
              <option value="standalone">Standalone</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Documents
          </h3>
          <Badge color="info" size="sm">
            {filteredDocuments.length} document(s)
          </Badge>
        </div>
        
        {filteredDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Document</Table.HeadCell>
                <Table.HeadCell>Type</Table.HeadCell>
                <Table.HeadCell>Source</Table.HeadCell>
                <Table.HeadCell>Uploaded By</Table.HeadCell>
                <Table.HeadCell>Size</Table.HeadCell>
                <Table.HeadCell>Date</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {filteredDocuments.map((doc) => {
                  const sourceInfo = getSourceInfo(doc);
                  const SourceIcon = sourceInfo.icon;
                  
                  return (
                    <Table.Row key={doc.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-3">
                          <FilePreview
                            fileName={doc.file_name}
                            fileUrl={doc.file_url}
                            fileType={doc.file_type}
                            documentType={doc.document_type}
                          >
                          {getFileIcon(doc.file_name, doc.document_type)}
                          </FilePreview>
                          <div>
                            <span className="font-medium">{doc.file_name}</span>
                            {doc.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="gray" size="sm">
                          {doc.document_type}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center space-x-2">
                          <SourceIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {sourceInfo.type}
                            </span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {sourceInfo.name}
                            </p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {doc.profiles?.full_name || 'Unknown'}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {doc.profiles?.email}
                          </p>
                        </div>
                      </Table.Cell>
                      <Table.Cell className="text-gray-600 dark:text-gray-400">
                        {formatFileSize(doc.file_size)}
                      </Table.Cell>
                      <Table.Cell className="text-gray-600 dark:text-gray-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="sm"
                          color="blue"
                          onClick={() => handleDownload(doc)}
                        >
                          Download
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <HiFolder className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No documents found
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {documents.length === 0 
                ? 'Upload your first document to get started.'
                : 'Try adjusting your filters to see more documents.'
              }
            </p>
          </div>
        )}
      </Card>
    </div>
  );
} 