-- ====================================================================
-- DIAGNOSTIC SCRIPT: Check Missing User Relationship Constraints
-- ====================================================================

-- Check if auth.users table is accessible
SELECT 'AUTH USERS TABLE CHECK' as check_type, 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') as auth_users_exists;

-- Check if the critical columns exist
SELECT 'COLUMN EXISTENCE CHECK' as check_type, 
       table_name, 
       column_name,
       data_type,
       is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('clients', 'incomes', 'expenses', 'documents')
  AND column_name IN ('created_by', 'user_id', 'uploaded_by')
ORDER BY table_name, column_name;

-- Check specifically for the missing constraints
SELECT 'MISSING CONSTRAINTS CHECK' as check_type,
       'clients_created_by_fkey' as expected_constraint,
       EXISTS(
         SELECT 1 FROM information_schema.table_constraints 
         WHERE constraint_schema = 'public' 
           AND table_name = 'clients' 
           AND constraint_name = 'clients_created_by_fkey'
       ) as constraint_exists;

SELECT 'MISSING CONSTRAINTS CHECK' as check_type,
       'incomes_user_id_fkey' as expected_constraint,
       EXISTS(
         SELECT 1 FROM information_schema.table_constraints 
         WHERE constraint_schema = 'public' 
           AND table_name = 'incomes' 
           AND constraint_name = 'incomes_user_id_fkey'
       ) as constraint_exists;

SELECT 'MISSING CONSTRAINTS CHECK' as check_type,
       'expenses_user_id_fkey' as expected_constraint,
       EXISTS(
         SELECT 1 FROM information_schema.table_constraints 
         WHERE constraint_schema = 'public' 
           AND table_name = 'expenses' 
           AND constraint_name = 'expenses_user_id_fkey'
       ) as constraint_exists;

SELECT 'MISSING CONSTRAINTS CHECK' as check_type,
       'documents_uploaded_by_fkey' as expected_constraint,
       EXISTS(
         SELECT 1 FROM information_schema.table_constraints 
         WHERE constraint_schema = 'public' 
           AND table_name = 'documents' 
           AND constraint_name = 'documents_uploaded_by_fkey'
       ) as constraint_exists;

-- Check if there are any existing user_id or created_by constraints with different names
SELECT 'EXISTING USER CONSTRAINTS' as check_type,
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
  AND (kcu.column_name IN ('user_id', 'created_by', 'uploaded_by') 
       OR ccu.table_name = 'users')
ORDER BY tc.table_name, tc.constraint_name;

-- Try to manually create one constraint to see the exact error
DO $$
BEGIN
  -- Test creating clients.created_by constraint
  BEGIN
    ALTER TABLE clients 
    ADD CONSTRAINT test_clients_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    
    -- If successful, remove it immediately
    ALTER TABLE clients DROP CONSTRAINT test_clients_created_by_fkey;
    RAISE NOTICE 'TEST SUCCESS: auth.users table is accessible and constraint can be created';
    
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE 'TEST FAILED: Cannot create constraint to auth.users - Error: %', SQLERRM;
  END;
END $$; 