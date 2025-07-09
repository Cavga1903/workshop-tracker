-- Complete Documents Table Fix - Add All Required Columns
-- This will ensure all columns expected by DocumentUpload component exist

-- Add ALL required columns for document uploads
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS workshop_id UUID REFERENCES workshops(id),
ADD COLUMN IF NOT EXISTS income_id UUID REFERENCES incomes(id),
ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES expenses(id),
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50) DEFAULT 'other',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_workshop_id ON documents(workshop_id);
CREATE INDEX IF NOT EXISTS idx_documents_income_id ON documents(income_id);
CREATE INDEX IF NOT EXISTS idx_documents_expense_id ON documents(expense_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- Update any existing records that have NULL values
UPDATE documents 
SET 
  document_type = COALESCE(document_type, 'other'),
  description = COALESCE(description, ''),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE document_type IS NULL 
   OR description IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Show the complete table structure
SELECT 
  'COLUMN_CHECK' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify all required columns exist
SELECT 
  'REQUIRED_COLUMNS_CHECK' as check_type,
  CASE 
    WHEN COUNT(*) = 13 THEN 'ALL_COLUMNS_EXIST'
    ELSE 'MISSING_COLUMNS'
  END as status,
  COUNT(*) as found_columns
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND table_schema = 'public'
  AND column_name IN (
    'file_name', 'file_url', 'file_size', 'file_type', 
    'uploaded_by', 'workshop_id', 'income_id', 'expense_id', 
    'client_id', 'document_type', 'description', 'created_at', 'updated_at'
  );

SELECT 'COMPLETE_TABLE_FIXED' as status, 'All required columns added to documents table' as message; 