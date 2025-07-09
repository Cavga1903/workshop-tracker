-- Simple Storage Policies for Documents Bucket
-- This creates basic RLS policies that should work with standard permissions

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to interact with documents bucket
CREATE POLICY "Authenticated users can manage documents" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'documents')
  WITH CHECK (bucket_id = 'documents');

-- Check if policy was created
SELECT 
  schemaname,
  tablename, 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname = 'Authenticated users can manage documents';

SELECT 'POLICY_CREATED' as status, 'Storage policies created successfully' as message; 