-- Fix Documents Name Column Constraint
-- Remove NOT NULL constraint from name column and set default value

-- Remove NOT NULL constraint from name column
ALTER TABLE documents 
ALTER COLUMN name DROP NOT NULL;

-- Set default value for name column based on file_name
ALTER TABLE documents 
ALTER COLUMN name SET DEFAULT 'Unnamed Document';

-- Update existing records that have NULL name values
UPDATE documents 
SET name = COALESCE(file_name, 'Unnamed Document')
WHERE name IS NULL;

-- Alternative approach: Make name column derive from file_name automatically
-- Create a trigger to automatically set name from file_name if name is NULL
CREATE OR REPLACE FUNCTION set_document_name()
RETURNS TRIGGER AS $$
BEGIN
    -- If name is NULL or empty, use file_name
    IF NEW.name IS NULL OR NEW.name = '' THEN
        NEW.name := COALESCE(NEW.file_name, 'Unnamed Document');
    END IF;
    
    -- Set updated_at timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set name before insert or update
DROP TRIGGER IF EXISTS trigger_set_document_name ON documents;
CREATE TRIGGER trigger_set_document_name
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION set_document_name();

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the constraint is removed
SELECT 
    'CONSTRAINT_CHECK' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
    AND table_schema = 'public'
    AND column_name = 'name';

-- Test the setup
SELECT 
    'TRIGGER_CHECK' as check_type,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_document_name';

SELECT 'NAME_CONSTRAINT_FIXED' as status, 'Documents name constraint fixed - uploads should work now' as message; 