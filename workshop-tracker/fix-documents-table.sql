-- Fix Documents Table - Add Missing Columns
-- This will resolve the "description column not found" errors

-- Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'other',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update any existing records that have NULL values
UPDATE documents 
SET 
  description = COALESCE(description, ''),
  document_type = COALESCE(document_type, 'other'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE description IS NULL 
   OR document_type IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Check the final structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify existing documents
SELECT 
  'DOCUMENTS_CHECK' as check_type,
  COUNT(*) as total_documents,
  COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as with_description,
  COUNT(CASE WHEN document_type IS NOT NULL THEN 1 END) as with_document_type
FROM documents;

SELECT 'TABLE_FIXED' as status, 'Documents table structure updated successfully' as message; 