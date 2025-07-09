-- ====================================================================
-- CREATE MISSING USER RELATIONSHIP CONSTRAINTS
-- Focused script for the remaining missing constraints
-- ====================================================================

-- 1. Create clients.created_by → auth.users.id constraint
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'clients' 
      AND constraint_name = 'clients_created_by_fkey'
  ) THEN
    -- Try to create the constraint
    BEGIN
      ALTER TABLE clients 
      ADD CONSTRAINT clients_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ SUCCESS: Created clients_created_by_fkey';
    EXCEPTION 
      WHEN foreign_key_violation THEN
        RAISE NOTICE '❌ FAILED: clients_created_by_fkey - Foreign key violation (invalid user IDs exist)';
      WHEN undefined_table THEN
        RAISE NOTICE '❌ FAILED: clients_created_by_fkey - auth.users table not accessible';
      WHEN undefined_column THEN
        RAISE NOTICE '❌ FAILED: clients_created_by_fkey - created_by column does not exist';
      WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: clients_created_by_fkey - %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '✅ EXISTS: clients_created_by_fkey already exists';
  END IF;
END $$;

-- 2. Create incomes.user_id → auth.users.id constraint  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'incomes' 
      AND constraint_name = 'incomes_user_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE incomes 
      ADD CONSTRAINT incomes_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ SUCCESS: Created incomes_user_id_fkey';
    EXCEPTION 
      WHEN foreign_key_violation THEN
        RAISE NOTICE '❌ FAILED: incomes_user_id_fkey - Foreign key violation (invalid user IDs exist)';
      WHEN undefined_table THEN
        RAISE NOTICE '❌ FAILED: incomes_user_id_fkey - auth.users table not accessible';
      WHEN undefined_column THEN
        RAISE NOTICE '❌ FAILED: incomes_user_id_fkey - user_id column does not exist';
      WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: incomes_user_id_fkey - %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '✅ EXISTS: incomes_user_id_fkey already exists';
  END IF;
END $$;

-- 3. Create expenses.user_id → auth.users.id constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'expenses' 
      AND constraint_name = 'expenses_user_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE expenses 
      ADD CONSTRAINT expenses_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
      
      RAISE NOTICE '✅ SUCCESS: Created expenses_user_id_fkey';
    EXCEPTION 
      WHEN foreign_key_violation THEN
        RAISE NOTICE '❌ FAILED: expenses_user_id_fkey - Foreign key violation (invalid user IDs exist)';
      WHEN undefined_table THEN
        RAISE NOTICE '❌ FAILED: expenses_user_id_fkey - auth.users table not accessible';
      WHEN undefined_column THEN
        RAISE NOTICE '❌ FAILED: expenses_user_id_fkey - user_id column does not exist';
      WHEN OTHERS THEN
        RAISE NOTICE '❌ FAILED: expenses_user_id_fkey - %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '✅ EXISTS: expenses_user_id_fkey already exists';
  END IF;
END $$;

-- 4. Verify documents.uploaded_by constraint (should already exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'documents' 
      AND constraint_name = 'documents_uploaded_by_fkey'
  ) THEN
    RAISE NOTICE '✅ CONFIRMED: documents_uploaded_by_fkey exists';
  ELSE
    RAISE NOTICE '⚠️  MISSING: documents_uploaded_by_fkey does not exist';
  END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Final verification of all critical user constraints
SELECT 
  'FINAL VERIFICATION' as status,
  constraint_name,
  table_name,
  'EXISTS' as result
FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' 
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name IN (
    'clients_created_by_fkey',
    'incomes_user_id_fkey', 
    'expenses_user_id_fkey',
    'documents_uploaded_by_fkey'
  )
ORDER BY table_name; 