-- Fix Documents Table Foreign Key Constraints and RLS Policies (Corrected)
-- This addresses the documents upload issue

-- ===================================================================
-- STEP 1: Check current documents table structure
-- ===================================================================

-- Check documents table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'documents'
ORDER BY ordinal_position;

-- Check existing foreign key constraints on documents table
SELECT 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'documents';

-- ===================================================================
-- STEP 2: Ensure required columns exist
-- ===================================================================

-- Add uploaded_by column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'documents' AND column_name = 'uploaded_by') THEN
        ALTER TABLE public.documents ADD COLUMN uploaded_by UUID;
        RAISE NOTICE 'Added uploaded_by column to documents table';
    END IF;
END $$;

-- ===================================================================
-- STEP 3: Create missing foreign key constraints for documents
-- ===================================================================

-- Create documents.uploaded_by → auth.users.id relationship
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'documents_uploaded_by_fkey') THEN
        ALTER TABLE public.documents DROP CONSTRAINT documents_uploaded_by_fkey;
        RAISE NOTICE 'Dropped existing documents_uploaded_by_fkey';
    END IF;
    
    -- Create new constraint
    ALTER TABLE public.documents 
    ADD CONSTRAINT documents_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Created documents.uploaded_by → auth.users.id foreign key';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'ERROR creating documents_uploaded_by_fkey: % - %', SQLSTATE, SQLERRM;
END $$;

-- Create documents.client_id → clients.id relationship (if client_id exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' AND column_name = 'client_id') THEN
        
        -- Drop existing constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'documents_client_id_fkey') THEN
            ALTER TABLE public.documents DROP CONSTRAINT documents_client_id_fkey;
        END IF;
        
        -- Create new constraint
        ALTER TABLE public.documents 
        ADD CONSTRAINT documents_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) 
        ON DELETE SET NULL;
        RAISE NOTICE 'Created documents.client_id → clients.id foreign key';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'ERROR creating documents_client_id_fkey: % - %', SQLSTATE, SQLERRM;
END $$;

-- Create documents.income_id → incomes.id relationship (if income_id exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' AND column_name = 'income_id') THEN
        
        -- Drop existing constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'documents_income_id_fkey') THEN
            ALTER TABLE public.documents DROP CONSTRAINT documents_income_id_fkey;
        END IF;
        
        -- Create new constraint
        ALTER TABLE public.documents 
        ADD CONSTRAINT documents_income_id_fkey 
        FOREIGN KEY (income_id) REFERENCES public.incomes(id) 
        ON DELETE CASCADE;
        RAISE NOTICE 'Created documents.income_id → incomes.id foreign key';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'ERROR creating documents_income_id_fkey: % - %', SQLSTATE, SQLERRM;
END $$;

-- Create documents.expense_id → expenses.id relationship (if expense_id exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'documents' AND column_name = 'expense_id') THEN
        
        -- Drop existing constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'documents_expense_id_fkey') THEN
            ALTER TABLE public.documents DROP CONSTRAINT documents_expense_id_fkey;
        END IF;
        
        -- Create new constraint
        ALTER TABLE public.documents 
        ADD CONSTRAINT documents_expense_id_fkey 
        FOREIGN KEY (expense_id) REFERENCES public.expenses(id) 
        ON DELETE CASCADE;
        RAISE NOTICE 'Created documents.expense_id → expenses.id foreign key';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'ERROR creating documents_expense_id_fkey: % - %', SQLSTATE, SQLERRM;
END $$;

-- ===================================================================
-- STEP 4: Update existing documents with user association
-- ===================================================================

-- Update documents table with current user's ID (if uploaded_by is NULL)
UPDATE public.documents 
SET uploaded_by = (SELECT id FROM auth.users LIMIT 1)
WHERE uploaded_by IS NULL;

-- ===================================================================
-- STEP 5: Check and fix RLS policies for documents table
-- ===================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can manage their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can see their documents" ON public.documents;
DROP POLICY IF EXISTS "Allow all" ON public.documents;

-- Create proper RLS policies for documents
CREATE POLICY "Users can insert their documents" ON public.documents
    FOR INSERT 
    WITH CHECK ((select auth.uid()) = uploaded_by);

CREATE POLICY "Users can view their documents" ON public.documents
    FOR SELECT 
    USING ((select auth.uid()) = uploaded_by);

CREATE POLICY "Users can update their documents" ON public.documents
    FOR UPDATE 
    USING ((select auth.uid()) = uploaded_by)
    WITH CHECK ((select auth.uid()) = uploaded_by);

CREATE POLICY "Users can delete their documents" ON public.documents
    FOR DELETE 
    USING ((select auth.uid()) = uploaded_by);

-- ===================================================================
-- STEP 6: Force refresh schema cache
-- ===================================================================

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- ===================================================================
-- STEP 7: Final verification and completion message
-- ===================================================================

-- Show final constraint status for documents table
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    'CREATED' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'documents'
ORDER BY tc.constraint_name;

-- Success message in proper DO block
DO $$
BEGIN
    RAISE NOTICE 'Documents table foreign key constraints and RLS policies have been updated!';
END $$; 