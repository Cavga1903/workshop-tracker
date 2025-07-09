-- Create Documents Storage Bucket (Simplified Version)
-- This avoids permission issues with RLS policies

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

-- Verify the bucket was created
SELECT 
  'BUCKET_CREATED' as status,
  id as bucket_id,
  name as bucket_name,
  public as is_public,
  file_size_limit,
  array_length(allowed_mime_types, 1) as allowed_types_count
FROM storage.buckets 
WHERE id = 'documents';

SELECT 'SUCCESS' as result, 'Documents bucket created successfully' as message; 