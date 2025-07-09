-- Fix Only Existing Columns in Documents Table
-- First check what columns exist, then fix only those columns

-- Show all columns in documents table
SELECT 
    'CURRENT_COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Fix only the columns that exist and have NOT NULL constraints
DO $$ 
BEGIN
    -- Fix 'name' column if it exists and is NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' 
               AND column_name = 'name' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE documents ALTER COLUMN name DROP NOT NULL;
        ALTER TABLE documents ALTER COLUMN name SET DEFAULT 'Unnamed Document';
        RAISE NOTICE 'Fixed name column constraint';
    END IF;

    -- Fix 'sort' column if it exists and is NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' 
               AND column_name = 'sort' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE documents ALTER COLUMN sort DROP NOT NULL;
        ALTER TABLE documents ALTER COLUMN sort SET DEFAULT 0;
        RAISE NOTICE 'Fixed sort column constraint';
    ELSE
        RAISE NOTICE 'Sort column does not exist or is already nullable';
    END IF;

    -- Fix 'url' column if it exists and is NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' 
               AND column_name = 'url' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE documents ALTER COLUMN url DROP NOT NULL;
        ALTER TABLE documents ALTER COLUMN url SET DEFAULT '';
        RAISE NOTICE 'Fixed url column constraint';
    ELSE
        RAISE NOTICE 'URL column does not exist or is already nullable';
    END IF;

    -- Fix any other commonly problematic columns
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' 
               AND column_name = 'title' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE documents ALTER COLUMN title DROP NOT NULL;
        ALTER TABLE documents ALTER COLUMN title SET DEFAULT 'Untitled';
        RAISE NOTICE 'Fixed title column constraint';
    END IF;

END $$;

-- Update existing NULL records
UPDATE documents 
SET 
    name = COALESCE(name, file_name, 'Unnamed Document')
WHERE name IS NULL;

-- Create a simple trigger for automatic field population
CREATE OR REPLACE FUNCTION set_document_name_only()
RETURNS TRIGGER AS $$
BEGIN
    -- Set name from file_name if not provided
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name := COALESCE(NEW.file_name, 'Unnamed Document');
    END IF;
    
    -- Set updated_at timestamp if column exists
    IF TG_TABLE_NAME = 'documents' THEN
        NEW.updated_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_set_document_name_only ON documents;
CREATE TRIGGER trigger_set_document_name_only
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_document_name_only();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Final verification - show current state
SELECT 
    'FINAL_CHECK' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
    AND table_schema = 'public'
    AND column_name IN ('name', 'sort', 'url', 'file_name', 'description', 'title')
ORDER BY column_name;

SELECT 'EXISTING_CONSTRAINTS_FIXED' as status, 'Only existing column constraints fixed' as message; 