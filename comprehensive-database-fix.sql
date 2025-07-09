-- Comprehensive Database Fix Script
-- This script addresses relationship errors, cleans up duplicate indexes, and refreshes schema cache

-- ===================================================================
-- STEP 1: Drop duplicate indexes (keeping the "_fixed" versions)
-- ===================================================================

-- Drop original duplicate indexes for clients table
DROP INDEX IF EXISTS idx_clients_created_by;

-- Drop original duplicate indexes for documents table  
DROP INDEX IF EXISTS idx_documents_uploaded_by;
DROP INDEX IF EXISTS idx_documents_workshop_id;

-- Drop original duplicate indexes for expenses table
DROP INDEX IF EXISTS idx_expenses_user_id;

-- Drop original duplicate indexes for incomes table
DROP INDEX IF EXISTS idx_incomes_client_id;
DROP INDEX IF EXISTS idx_incomes_user_id;

-- ===================================================================
-- STEP 2: Ensure all required columns exist
-- ===================================================================

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add user_id to expenses if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expenses' AND column_name = 'user_id') THEN
        ALTER TABLE public.expenses ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to expenses table';
    END IF;
    
    -- Add user_id to incomes if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'incomes' AND column_name = 'user_id') THEN
        ALTER TABLE public.incomes ADD COLUMN user_id UUID;
        RAISE NOTICE 'Added user_id column to incomes table';
    END IF;
    
    -- Add created_by to clients if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'created_by') THEN
        ALTER TABLE public.clients ADD COLUMN created_by UUID;
        RAISE NOTICE 'Added created_by column to clients table';
    END IF;
END $$;

-- ===================================================================
-- STEP 3: Drop and recreate foreign key constraints
-- ===================================================================

-- Drop existing constraints if they exist
DO $$ 
BEGIN
    -- Drop expenses.user_id constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'expenses_user_id_fkey') THEN
        ALTER TABLE public.expenses DROP CONSTRAINT expenses_user_id_fkey;
        RAISE NOTICE 'Dropped existing expenses_user_id_fkey';
    END IF;
    
    -- Drop incomes.user_id constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'incomes_user_id_fkey') THEN
        ALTER TABLE public.incomes DROP CONSTRAINT incomes_user_id_fkey;
        RAISE NOTICE 'Dropped existing incomes_user_id_fkey';
    END IF;
    
    -- Drop clients.created_by constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'clients_created_by_fkey') THEN
        ALTER TABLE public.clients DROP CONSTRAINT clients_created_by_fkey;
        RAISE NOTICE 'Dropped existing clients_created_by_fkey';
    END IF;
END $$;

-- ===================================================================
-- STEP 4: Create fresh foreign key constraints
-- ===================================================================

-- Create expenses.user_id → auth.users.id relationship
DO $$
BEGIN
    ALTER TABLE public.expenses 
    ADD CONSTRAINT expenses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Created expenses.user_id → auth.users.id foreign key';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not create expenses.user_id constraint: %', SQLERRM;
END $$;

-- Create incomes.user_id → auth.users.id relationship  
DO $$
BEGIN
    ALTER TABLE public.incomes 
    ADD CONSTRAINT incomes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) 
    ON DELETE CASCADE;
    RAISE NOTICE 'Created incomes.user_id → auth.users.id foreign key';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not create incomes.user_id constraint: %', SQLERRM;
END $$;

-- Create clients.created_by → auth.users.id relationship
DO $$
BEGIN
    ALTER TABLE public.clients 
    ADD CONSTRAINT clients_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) 
    ON DELETE SET NULL;
    RAISE NOTICE 'Created clients.created_by → auth.users.id foreign key';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not create clients.created_by constraint: %', SQLERRM;
END $$;

-- ===================================================================
-- STEP 5: Update existing data with current user ID
-- ===================================================================

-- Update expenses table with current user's ID (if user_id is NULL)
UPDATE public.expenses 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Update incomes table with current user's ID (if user_id is NULL)
UPDATE public.incomes 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Update clients table with current user's ID (if created_by is NULL)
UPDATE public.clients 
SET created_by = (SELECT id FROM auth.users LIMIT 1)
WHERE created_by IS NULL;

-- ===================================================================
-- STEP 6: Force refresh PostgREST schema cache
-- ===================================================================

-- Send notification to refresh schema cache
NOTIFY pgrst, 'reload schema';

-- ===================================================================
-- STEP 7: Verify constraints were created
-- ===================================================================

DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    -- Count critical foreign key constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_schema = 'public'
      AND constraint_name IN ('expenses_user_id_fkey', 'incomes_user_id_fkey', 'clients_created_by_fkey');
    
    RAISE NOTICE 'Total critical foreign key constraints found: %', constraint_count;
    
    IF constraint_count = 3 THEN
        RAISE NOTICE 'SUCCESS: All critical foreign key constraints are in place!';
    ELSE
        RAISE NOTICE 'WARNING: Only % of 3 critical constraints found', constraint_count;
    END IF;
END $$; 