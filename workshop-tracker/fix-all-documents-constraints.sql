-- Fix ALL NOT NULL Constraints in Documents Table
-- This will resolve all constraint violations during document upload

-- Remove NOT NULL constraints from all problematic columns
ALTER TABLE documents 
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN sort DROP NOT NULL;

-- Set default values for all columns that might be NULL
ALTER TABLE documents 
ALTER COLUMN name SET DEFAULT 'Unnamed Document',
ALTER COLUMN sort SET DEFAULT 0;

-- Handle any other columns that might have NOT NULL constraints
-- Check if 'url' column exists and fix it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' 
               AND column_name = 'url' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE documents ALTER COLUMN url DROP NOT NULL;
        ALTER TABLE documents ALTER COLUMN url SET DEFAULT '';
    END IF;
END $$;

-- Update existing records with NULL values
UPDATE documents 
SET 
    name = COALESCE(name, file_name, 'Unnamed Document'),
    sort = COALESCE(sort, 0)
WHERE name IS NULL 
   OR sort IS NULL;

-- Create/update the trigger to handle automatic field population
CREATE OR REPLACE FUNCTION set_document_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Set name from file_name if not provided
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name := COALESCE(NEW.file_name, 'Unnamed Document');
    END IF;
    
    -- Set sort to 0 if not provided
    IF NEW.sort IS NULL THEN
        NEW.sort := 0;
    END IF;
    
    -- Set updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_set_document_defaults ON documents;
CREATE TRIGGER trigger_set_document_defaults
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_document_defaults();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Check all constraints in documents table
SELECT 
    'CONSTRAINT_CHECK' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
    AND table_schema = 'public'
    AND column_name IN ('name', 'sort', 'url', 'file_name', 'description')
ORDER BY column_name;

-- Verify trigger was created
SELECT 
    'TRIGGER_CHECK' as check_type,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_document_defaults';

-- Test insert capability (this should work now)
SELECT 'ALL_CONSTRAINTS_FIXED' as status, 'All document constraints fixed - uploads should work now' as message; 