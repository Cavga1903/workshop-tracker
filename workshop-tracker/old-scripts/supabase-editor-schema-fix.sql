-- ====================================================================
-- CRITICAL SCHEMA RELATIONSHIP FIX FOR WORKSHOP TRACKER
-- SUPABASE SQL EDITOR VERSION (No psql client commands)
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- STEP 1: DIAGNOSE CURRENT CONSTRAINT STATE
-- ====================================================================

-- Show detailed constraint information
SELECT 
  'CURRENT FOREIGN KEY CONSTRAINTS' as info,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ====================================================================
-- STEP 2: ADD MISSING COLUMNS (IF NEEDED)
-- ====================================================================

-- Add clients.created_by if missing
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_by'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE clients ADD COLUMN created_by UUID;
    RAISE NOTICE 'Added clients.created_by column';
  ELSE
    RAISE NOTICE 'clients.created_by column already exists';
  END IF;
END $$;

-- Add incomes.user_id if missing
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'incomes' AND column_name = 'user_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE incomes ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added incomes.user_id column';
  ELSE
    RAISE NOTICE 'incomes.user_id column already exists';
  END IF;
END $$;

-- Add expenses.user_id if missing
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'user_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE expenses ADD COLUMN user_id UUID;
    RAISE NOTICE 'Added expenses.user_id column';
  ELSE
    RAISE NOTICE 'expenses.user_id column already exists';
  END IF;
END $$;

-- Add documents.uploaded_by if missing
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    ALTER TABLE documents ADD COLUMN uploaded_by UUID;
    RAISE NOTICE 'Added documents.uploaded_by column';
  ELSE
    RAISE NOTICE 'documents.uploaded_by column already exists';
  END IF;
END $$;

-- ====================================================================
-- STEP 3: ADD CRITICAL FOREIGN KEY CONSTRAINTS
-- ====================================================================

-- 1. Fix ClientManagement: clients.created_by → auth.users.id
DO $$
BEGIN
  -- Remove existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'clients' 
      AND constraint_name = 'clients_created_by_fkey'
  ) THEN
    ALTER TABLE clients DROP CONSTRAINT clients_created_by_fkey;
    RAISE NOTICE 'Removed existing clients_created_by_fkey constraint';
  END IF;
  
  -- Add the foreign key constraint
  ALTER TABLE clients 
  ADD CONSTRAINT clients_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE 'SUCCESS: clients.created_by → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: clients_created_by_fkey - %', SQLERRM;
END $$;

-- 2. Fix Calendar/Analytics: incomes.user_id → auth.users.id  
DO $$
BEGIN
  -- Remove existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'incomes' 
      AND constraint_name = 'incomes_user_id_fkey'
  ) THEN
    ALTER TABLE incomes DROP CONSTRAINT incomes_user_id_fkey;
    RAISE NOTICE 'Removed existing incomes_user_id_fkey constraint';
  END IF;
  
  ALTER TABLE incomes 
  ADD CONSTRAINT incomes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE 'SUCCESS: incomes.user_id → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: incomes_user_id_fkey - %', SQLERRM;
END $$;

-- 3. Fix Analytics: expenses.user_id → auth.users.id
DO $$
BEGIN
  -- Remove existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'expenses' 
      AND constraint_name = 'expenses_user_id_fkey'
  ) THEN
    ALTER TABLE expenses DROP CONSTRAINT expenses_user_id_fkey;
    RAISE NOTICE 'Removed existing expenses_user_id_fkey constraint';
  END IF;
  
  ALTER TABLE expenses 
  ADD CONSTRAINT expenses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE 'SUCCESS: expenses.user_id → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: expenses_user_id_fkey - %', SQLERRM;
END $$;

-- 4. Fix Documents: documents.uploaded_by → auth.users.id
DO $$
BEGIN
  -- Remove existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'documents' 
      AND constraint_name = 'documents_uploaded_by_fkey'
  ) THEN
    ALTER TABLE documents DROP CONSTRAINT documents_uploaded_by_fkey;
    RAISE NOTICE 'Removed existing documents_uploaded_by_fkey constraint';
  END IF;
  
  ALTER TABLE documents 
  ADD CONSTRAINT documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE 'SUCCESS: documents.uploaded_by → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: documents_uploaded_by_fkey - %', SQLERRM;
END $$;

-- ====================================================================
-- STEP 4: REFRESH SUPABASE SCHEMA CACHE
-- ====================================================================

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- STEP 5: VERIFY ALL CRITICAL CONSTRAINTS
-- ====================================================================

-- Show all foreign key constraints for verification
SELECT 
  'VERIFICATION: CRITICAL CONSTRAINTS' as verification,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column,
  CASE 
    WHEN tc.table_name IN ('clients', 'incomes', 'expenses', 'documents') 
    THEN 'CRITICAL'
    ELSE 'OTHER'
  END as priority
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
  AND tc.table_name IN ('clients', 'incomes', 'expenses', 'documents')
ORDER BY priority DESC, tc.table_name, tc.constraint_name;

-- Final summary message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SCHEMA RELATIONSHIP FIX COMPLETED ===';
  RAISE NOTICE 'The following critical relationships have been fixed:';
  RAISE NOTICE '1. clients.created_by → auth.users.id (ClientManagement page)';
  RAISE NOTICE '2. incomes.user_id → auth.users.id (Calendar & Analytics pages)';
  RAISE NOTICE '3. expenses.user_id → auth.users.id (Analytics page)';
  RAISE NOTICE '4. documents.uploaded_by → auth.users.id (Documents page)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test your frontend pages to verify queries work!';
  RAISE NOTICE 'Schema cache has been refreshed automatically.';
END $$; 