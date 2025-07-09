-- Diagnostic and Fix Script
-- Let's find out why the foreign key constraints aren't being created

-- ===================================================================
-- STEP 1: Check current state
-- ===================================================================

-- Check if columns exist and their data types
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('expenses', 'incomes', 'clients')
    AND column_name IN ('user_id', 'created_by')
ORDER BY table_name, column_name;

-- Check if auth.users table is accessible
SELECT COUNT(*) as auth_users_count FROM auth.users;

-- Check existing foreign key constraints
SELECT 
    tc.table_name,
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
    AND tc.table_name IN ('expenses', 'incomes', 'clients');

-- ===================================================================
-- STEP 2: Check for data issues that might prevent constraint creation
-- ===================================================================

-- Check for NULL or invalid user_id values in expenses
SELECT 'expenses_user_id_issues' as check_name,
       COUNT(*) as total_rows,
       COUNT(user_id) as non_null_user_ids,
       COUNT(*) - COUNT(user_id) as null_user_ids
FROM public.expenses;

-- Check for NULL or invalid user_id values in incomes  
SELECT 'incomes_user_id_issues' as check_name,
       COUNT(*) as total_rows,
       COUNT(user_id) as non_null_user_ids,
       COUNT(*) - COUNT(user_id) as null_user_ids
FROM public.incomes;

-- Check for NULL or invalid created_by values in clients
SELECT 'clients_created_by_issues' as check_name,
       COUNT(*) as total_rows,
       COUNT(created_by) as non_null_created_by,
       COUNT(*) - COUNT(created_by) as null_created_by
FROM public.clients;

-- Check if user_id values actually exist in auth.users
SELECT 'expenses_orphan_user_ids' as check_name,
       COUNT(*) as orphan_count
FROM public.expenses e
LEFT JOIN auth.users u ON e.user_id = u.id
WHERE e.user_id IS NOT NULL AND u.id IS NULL;

SELECT 'incomes_orphan_user_ids' as check_name,
       COUNT(*) as orphan_count  
FROM public.incomes i
LEFT JOIN auth.users u ON i.user_id = u.id
WHERE i.user_id IS NOT NULL AND u.id IS NULL;

-- ===================================================================
-- STEP 3: Force create constraints with detailed error handling
-- ===================================================================

-- Try to create expenses.user_id constraint with detailed error info
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.expenses 
        ADD CONSTRAINT expenses_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'SUCCESS: Created expenses_user_id_fkey constraint';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'INFO: expenses_user_id_fkey constraint already exists';
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'ERROR: Foreign key violation in expenses.user_id - some user_id values do not exist in auth.users';
        WHEN others THEN
            RAISE NOTICE 'ERROR creating expenses_user_id_fkey: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- Try to create incomes.user_id constraint with detailed error info
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.incomes 
        ADD CONSTRAINT incomes_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'SUCCESS: Created incomes_user_id_fkey constraint';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'INFO: incomes_user_id_fkey constraint already exists';
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'ERROR: Foreign key violation in incomes.user_id - some user_id values do not exist in auth.users';
        WHEN others THEN
            RAISE NOTICE 'ERROR creating incomes_user_id_fkey: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- Try to create clients.created_by constraint with detailed error info
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.clients 
        ADD CONSTRAINT clients_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'SUCCESS: Created clients_created_by_fkey constraint';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE 'INFO: clients_created_by_fkey constraint already exists';
        WHEN foreign_key_violation THEN
            RAISE NOTICE 'ERROR: Foreign key violation in clients.created_by - some created_by values do not exist in auth.users';
        WHEN others THEN
            RAISE NOTICE 'ERROR creating clients_created_by_fkey: % - %', SQLSTATE, SQLERRM;
    END;
END $$;

-- ===================================================================
-- STEP 4: Alternative schema cache refresh methods
-- ===================================================================

-- Try multiple ways to refresh the schema cache
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Also try to refresh specific tables
SELECT pg_notify('pgrst', 'reload schema');

-- ===================================================================
-- STEP 5: Final verification
-- ===================================================================

-- Show final constraint status
SELECT 
    tc.table_name,
    tc.constraint_name,
    'CREATED' as status
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.constraint_name IN ('expenses_user_id_fkey', 'incomes_user_id_fkey', 'clients_created_by_fkey')
ORDER BY tc.table_name; 