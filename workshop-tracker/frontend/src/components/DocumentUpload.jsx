import React, { useState, useRef } from 'react';
import { Card, Button, Alert, Badge, Progress, Modal, Label, TextInput, Select, Spinner } from 'flowbite-react';
import { HiUpload, HiTrash, HiDownload, HiEye, HiX, HiDocument, HiFolder } from 'react-icons/hi';
import { FileText, Image, Film, Archive, FileIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import supabase from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';

const DOCUMENT_TYPES = [
  { value: 'invoice', label: 'Invoice', icon: FileText },
  { value: 'receipt', label: 'Receipt', icon: FileText },
  { value: 'contract', label: 'Contract', icon: FileText },
  { value: 'photo', label: 'Photo', icon: Image },
  { value: 'other', label: 'Other', icon: FileIcon }
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv'
];

export default function DocumentUpload({ 
  workshopId = null, 
  incomeId = null, 
  expenseId = null, 
  clientId = null,
  onUploadComplete = () => {},
  documents = [],
  onDocumentsChange = () => {}
}) {
  const { user, profile } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    documentType: 'other',
    description: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const getFileIcon = (fileName, documentType) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (documentType === 'photo' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return <Image className="h-5 w-5 text-blue-500" />;
    }
    if (extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['doc', 'docx'].includes(extension)) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return <FileText className="h-5 w-5 text-green-600" />;
    }
    return <FileIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'File type not supported';
    }
    return null;
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast.error(`Some files were rejected:\n${errors.join('\n')}`);
    }

    setSelectedFiles(validFiles);
    if (validFiles.length > 0) {
      setShowUploadModal(true);
    }
  };

  const uploadFile = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // Save metadata to database
    const documentData = {
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      file_type: file.type,
      uploaded_by: user.id,
      workshop_id: workshopId,
      income_id: incomeId,
      expense_id: expenseId,
      client_id: clientId,
      document_type: uploadForm.documentType,
      description: uploadForm.description || null
    };

    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (docError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents').remove([fileName]);
      throw docError;
    }

    return docData;
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedDocs = [];
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const doc = await uploadFile(file);
        uploadedDocs.push(doc);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      toast.success(`Successfully uploaded ${uploadedDocs.length} document(s)`);
      onUploadComplete(uploadedDocs);
      onDocumentsChange([...documents, ...uploadedDocs]);
      
      // Reset form
      setSelectedFiles([]);
      setUploadForm({ documentType: 'other', description: '' });
      setShowUploadModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      // Extract file path from URL
      const url = new URL(document.file_url);
      const filePath = url.pathname.split('/').pop();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      toast.success('Document deleted successfully');
      onDocumentsChange(documents.filter(doc => doc.id !== document.id));
    } catch (error) {
      toast.error(`Delete failed: ${error.message}`);
      console.error('Delete error:', error);
    }
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

  const isAdmin = profile?.role === 'admin';
  const canDelete = (doc) => isAdmin || doc.uploaded_by === user.id;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <HiFolder className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents
            </h3>
            <Badge color="info" size="sm">
              {documents.length}
            </Badge>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            <HiUpload className="h-4 w-4" />
            <span>Upload Files</span>
          </Button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept={ALLOWED_FILE_TYPES.join(',')}
          className="hidden"
        />

        {/* Documents List */}
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getFileIcon(doc.file_name, doc.document_type)}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {doc.file_name}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Badge color="gray" size="xs">
                        {doc.document_type}
                      </Badge>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => handleDownload(doc)}
                  >
                    <HiDownload className="h-4 w-4" />
                  </Button>
                  {canDelete(doc) && (
                    <Button
                      size="sm"
                      color="failure"
                      onClick={() => handleDelete(doc)}
                    >
                      <HiTrash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <HiDocument className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No documents uploaded
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Upload documents like invoices, receipts, or contracts.
            </p>
          </div>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal show={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <Modal.Header>Upload Documents</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            {/* Selected Files */}
            <div>
              <Label value="Selected Files" />
              <div className="mt-2 space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getFileIcon(file.name, uploadForm.documentType)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      size="xs"
                      color="gray"
                      onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    >
                      <HiX className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Type */}
            <div>
              <Label htmlFor="documentType" value="Document Type" />
              <Select
                id="documentType"
                value={uploadForm.documentType}
                onChange={(e) => setUploadForm(prev => ({ ...prev, documentType: e.target.value }))}
                required
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" value="Description (Optional)" />
              <TextInput
                id="description"
                placeholder="Brief description of the document..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress progress={uploadProgress} color="blue" />
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={handleUpload}
            disabled={!selectedFiles.length || uploading}
            className="flex items-center space-x-2"
          >
            {uploading ? (
              <Spinner size="sm" />
            ) : (
              <HiUpload className="h-4 w-4" />
            )}
            <span>Upload {selectedFiles.length} file(s)</span>
          </Button>
          <Button
            color="gray"
            onClick={() => setShowUploadModal(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
} 