-- Fix Document Storage: Create missing storage bucket and policies
-- This will resolve the "Bucket not found" errors in document uploads

-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for the documents bucket

-- Policy for authenticated users to upload files
CREATE POLICY "Users can upload documents" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for authenticated users to view documents
CREATE POLICY "Users can view documents" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (bucket_id = 'documents');

-- Policy for users to delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy for users to update their own documents
CREATE POLICY "Users can update own documents" ON storage.objects
  FOR UPDATE 
  TO authenticated
  USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify the setup
SELECT 
  'BUCKET_CHECK' as check_type,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id = 'documents';

-- Check storage policies
SELECT 
  'POLICY_CHECK' as check_type,
  policyname as policy_name,
  cmd as command,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%documents%';

SELECT 'SETUP_COMPLETE' as status, 'Documents storage bucket and policies created' as message; 