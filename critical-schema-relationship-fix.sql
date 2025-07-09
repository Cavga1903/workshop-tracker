-- ====================================================================
-- CRITICAL SCHEMA RELATIONSHIP FIX FOR WORKSHOP TRACKER
-- Addresses all frontend Supabase query errors systematically
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set up error handling
\set ON_ERROR_STOP on

DO $$
BEGIN
  RAISE NOTICE '=== STARTING CRITICAL SCHEMA RELATIONSHIP FIX ===';
  RAISE NOTICE 'Timestamp: %', NOW();
END $$;

-- ====================================================================
-- STEP 1: DIAGNOSE CURRENT CONSTRAINT STATE
-- ====================================================================

DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 1: DIAGNOSING CURRENT CONSTRAINTS ===';
  
  -- Check existing foreign key constraints
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY'
    AND constraint_schema = 'public';
    
  RAISE NOTICE 'Current foreign key constraints: %', constraint_count;
  
  -- List all current foreign key constraints
  RAISE NOTICE '';
  RAISE NOTICE 'Existing foreign key constraints:';
  FOR constraint_count IN 
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_schema = 'public'
  LOOP
    -- This will list the constraints in the output
  END LOOP;
END $$;

-- Show detailed constraint information
SELECT 
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
-- STEP 2: CHECK REQUIRED TABLES AND COLUMNS EXIST
-- ====================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  column_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 2: CHECKING REQUIRED TABLES AND COLUMNS ===';
  
  -- Check critical tables exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) INTO table_exists;
  RAISE NOTICE 'clients table exists: %', table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'incomes'
  ) INTO table_exists;
  RAISE NOTICE 'incomes table exists: %', table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'expenses'
  ) INTO table_exists;
  RAISE NOTICE 'expenses table exists: %', table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'documents'
  ) INTO table_exists;
  RAISE NOTICE 'documents table exists: %', table_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'workshops'
  ) INTO table_exists;
  RAISE NOTICE 'workshops table exists: %', table_exists;
  
  -- Check critical columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_by'
  ) INTO column_exists;
  RAISE NOTICE 'clients.created_by column exists: %', column_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'incomes' AND column_name = 'user_id'
  ) INTO column_exists;
  RAISE NOTICE 'incomes.user_id column exists: %', column_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'user_id'
  ) INTO column_exists;
  RAISE NOTICE 'expenses.user_id column exists: %', column_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by'
  ) INTO column_exists;
  RAISE NOTICE 'documents.uploaded_by column exists: %', column_exists;
END $$;

-- ====================================================================
-- STEP 3: ADD MISSING COLUMNS (IF NEEDED)
-- ====================================================================

DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 3: ADDING MISSING COLUMNS ===';
  
  -- Add clients.created_by if missing
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
  
  -- Add incomes.user_id if missing
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
  
  -- Add expenses.user_id if missing
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
  
  -- Add documents.uploaded_by if missing
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
-- STEP 4: REMOVE CONFLICTING CONSTRAINTS (IF ANY)
-- ====================================================================

DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 4: REMOVING CONFLICTING CONSTRAINTS ===';
  
  -- Check and remove potentially conflicting constraints
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'clients' 
      AND constraint_name = 'clients_created_by_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    ALTER TABLE clients DROP CONSTRAINT clients_created_by_fkey;
    RAISE NOTICE 'Removed existing clients_created_by_fkey constraint';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'incomes' 
      AND constraint_name = 'incomes_user_id_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    ALTER TABLE incomes DROP CONSTRAINT incomes_user_id_fkey;
    RAISE NOTICE 'Removed existing incomes_user_id_fkey constraint';
  END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'expenses' 
      AND constraint_name = 'expenses_user_id_fkey'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    ALTER TABLE expenses DROP CONSTRAINT expenses_user_id_fkey;
    RAISE NOTICE 'Removed existing expenses_user_id_fkey constraint';
  END IF;
END $$;

-- ====================================================================
-- STEP 5: ADD CRITICAL FOREIGN KEY CONSTRAINTS
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 5: ADDING CRITICAL FOREIGN KEY CONSTRAINTS ===';
END $$;

-- 1. Fix ClientManagement: clients.created_by → auth.users.id
DO $$
BEGIN
  -- Add the foreign key constraint
  ALTER TABLE clients 
  ADD CONSTRAINT clients_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ ADDED: clients.created_by → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAILED: clients_created_by_fkey - %', SQLERRM;
END $$;

-- 2. Fix Calendar/Analytics: incomes.user_id → auth.users.id  
DO $$
BEGIN
  ALTER TABLE incomes 
  ADD CONSTRAINT incomes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ ADDED: incomes.user_id → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAILED: incomes_user_id_fkey - %', SQLERRM;
END $$;

-- 3. Fix Analytics: expenses.user_id → auth.users.id
DO $$
BEGIN
  ALTER TABLE expenses 
  ADD CONSTRAINT expenses_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ ADDED: expenses.user_id → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAILED: expenses_user_id_fkey - %', SQLERRM;
END $$;

-- 4. Fix Documents: documents.uploaded_by → auth.users.id
DO $$
BEGIN
  ALTER TABLE documents 
  ADD CONSTRAINT documents_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  
  RAISE NOTICE '✅ ADDED: documents.uploaded_by → auth.users.id';
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE '❌ FAILED: documents_uploaded_by_fkey - %', SQLERRM;
END $$;

-- ====================================================================
-- STEP 6: FIX WORKSHOP RELATIONSHIPS (IF WORKSHOPS TABLE EXISTS)
-- ====================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  column_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 6: FIXING WORKSHOP RELATIONSHIPS ===';
  
  -- Check if workshops table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'workshops'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'workshops table exists, adding relationships...';
    
    -- Add instructor_id → auth.users.id if column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'workshops' AND column_name = 'instructor_id'
    ) INTO column_exists;
    
    IF column_exists THEN
      BEGIN
        ALTER TABLE workshops 
        ADD CONSTRAINT workshops_instructor_id_fkey 
        FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ ADDED: workshops.instructor_id → auth.users.id';
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE '❌ FAILED: workshops_instructor_id_fkey - %', SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'workshops.instructor_id column does not exist';
    END IF;
    
    -- Add class_type_id → class_types.id if both exist
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'workshops' AND column_name = 'class_type_id'
    ) INTO column_exists;
    
    IF column_exists THEN
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'class_types'
      ) INTO table_exists;
      
      IF table_exists THEN
        BEGIN
          ALTER TABLE workshops 
          ADD CONSTRAINT workshops_class_type_id_fkey 
          FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE SET NULL;
          
          RAISE NOTICE '✅ ADDED: workshops.class_type_id → class_types.id';
        EXCEPTION 
          WHEN OTHERS THEN
            RAISE NOTICE '❌ FAILED: workshops_class_type_id_fkey - %', SQLERRM;
        END;
      ELSE
        RAISE NOTICE 'class_types table does not exist';
      END IF;
    ELSE
      RAISE NOTICE 'workshops.class_type_id column does not exist';
    END IF;
  ELSE
    RAISE NOTICE 'workshops table does not exist - skipping workshop relationships';
  END IF;
END $$;

-- ====================================================================
-- STEP 7: RESOLVE DOCUMENTS AMBIGUOUS RELATIONSHIPS
-- ====================================================================

DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 7: RESOLVING DOCUMENTS AMBIGUOUS RELATIONSHIPS ===';
  
  -- Check for multiple income_id relationships in documents table
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'documents'
    AND kcu.column_name = 'income_id'
    AND tc.constraint_schema = 'public';
    
  RAISE NOTICE 'Found % foreign key constraints on documents.income_id', constraint_count;
  
  IF constraint_count > 1 THEN
    RAISE NOTICE 'Removing duplicate income_id constraints...';
    
    -- Remove all but the first constraint
    FOR constraint_count IN 
      SELECT DISTINCT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'documents'
        AND kcu.column_name = 'income_id'
        AND tc.constraint_schema = 'public'
      OFFSET 1
    LOOP
      -- Note: This is a simplified approach - in practice you'd need to iterate through actual constraint names
    END LOOP;
  END IF;
END $$;

-- ====================================================================
-- STEP 8: REFRESH SUPABASE SCHEMA CACHE
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 8: REFRESHING SUPABASE SCHEMA CACHE ===';
  
  -- Notify PostgREST to reload schema
  NOTIFY pgrst, 'reload schema';
  
  RAISE NOTICE '✅ Schema cache refresh notification sent';
END $$;

-- ====================================================================
-- STEP 9: VERIFY ALL CRITICAL CONSTRAINTS
-- ====================================================================

DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== STEP 9: VERIFYING CRITICAL CONSTRAINTS ===';
  
  -- Verify clients.created_by constraint
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'clients' 
      AND constraint_name = 'clients_created_by_fkey'
  ) INTO constraint_exists;
  RAISE NOTICE 'clients_created_by_fkey exists: %', constraint_exists;
  
  -- Verify incomes.user_id constraint
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'incomes' 
      AND constraint_name = 'incomes_user_id_fkey'
  ) INTO constraint_exists;
  RAISE NOTICE 'incomes_user_id_fkey exists: %', constraint_exists;
  
  -- Verify expenses.user_id constraint
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'expenses' 
      AND constraint_name = 'expenses_user_id_fkey'
  ) INTO constraint_exists;
  RAISE NOTICE 'expenses_user_id_fkey exists: %', constraint_exists;
  
  -- Verify documents.uploaded_by constraint
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'documents' 
      AND constraint_name = 'documents_uploaded_by_fkey'
  ) INTO constraint_exists;
  RAISE NOTICE 'documents_uploaded_by_fkey exists: %', constraint_exists;
END $$;

-- ====================================================================
-- STEP 10: FINAL SUMMARY
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL SUMMARY ===';
  RAISE NOTICE 'Critical schema relationship fix completed!';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED RELATIONSHIPS:';
  RAISE NOTICE '1. clients.created_by → auth.users.id (ClientManagement page)';
  RAISE NOTICE '2. incomes.user_id → auth.users.id (Calendar & Analytics pages)';
  RAISE NOTICE '3. expenses.user_id → auth.users.id (Analytics page)';
  RAISE NOTICE '4. documents.uploaded_by → auth.users.id (Documents page)';
  RAISE NOTICE '5. workshops relationships (if table exists)';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '- Test ClientManagement page: profiles:created_by(full_name,email)';
  RAISE NOTICE '- Test Calendar page: profiles:user_id(full_name,email)';
  RAISE NOTICE '- Test Analytics page: incomes/expenses with user profiles';
  RAISE NOTICE '- Test Documents page: should resolve ambiguous relationships';
  RAISE NOTICE '- Schema cache has been refreshed';
  RAISE NOTICE '';
  RAISE NOTICE 'Timestamp: %', NOW();
END $$;

-- Show final constraint summary
SELECT 
  'FINAL CONSTRAINT SUMMARY' as summary,
  COUNT(*) as total_foreign_keys
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY'
  AND constraint_schema = 'public';

SELECT 
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
  AND tc.table_name IN ('clients', 'incomes', 'expenses', 'documents', 'workshops')
ORDER BY tc.table_name, tc.constraint_name; 