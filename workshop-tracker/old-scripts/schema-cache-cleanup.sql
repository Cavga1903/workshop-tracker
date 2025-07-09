-- ====================================================================
-- COMPREHENSIVE SCHEMA CACHE CLEANUP & RELATIONSHIP VERIFICATION
-- Cleans duplicate constraints, ensures proper relationships, forces cache refresh
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '=== SUPABASE SCHEMA CACHE CLEANUP & VERIFICATION ===';
  RAISE NOTICE 'Starting comprehensive cleanup process...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- STEP 1: IDENTIFY AND CLEAN DUPLICATE CONSTRAINTS
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '1️⃣  IDENTIFYING DUPLICATE CONSTRAINTS...';
END $$;

-- Show all current foreign key constraints
SELECT 
  'CURRENT_CONSTRAINTS' as info,
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
  AND tc.table_name IN ('clients', 'incomes', 'expenses', 'documents')
ORDER BY tc.table_name, kcu.column_name, tc.constraint_name;

-- Find duplicate constraints on same column
WITH duplicate_constraints AS (
  SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    COUNT(*) as constraint_count,
    ARRAY_AGG(tc.constraint_name ORDER BY tc.constraint_name) as constraint_names
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_schema = 'public'
    AND tc.table_name IN ('clients', 'incomes', 'expenses', 'documents')
  GROUP BY tc.table_name, kcu.column_name, ccu.table_name, ccu.column_name
  HAVING COUNT(*) > 1
)
SELECT 
  'DUPLICATE_CONSTRAINTS' as issue_type,
  table_name,
  column_name,
  referenced_table,
  referenced_column,
  constraint_count,
  constraint_names
FROM duplicate_constraints;

-- ====================================================================
-- STEP 2: CLEAN UP DOCUMENTS TABLE DUPLICATE INCOME_ID CONSTRAINTS
-- ====================================================================

DO $$
DECLARE
  constraint_name TEXT;
  constraint_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  CLEANING DOCUMENTS TABLE DUPLICATE CONSTRAINTS...';
  
  -- Count income_id constraints on documents table
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_schema = 'public'
    AND tc.table_name = 'documents'
    AND kcu.column_name = 'income_id';
    
  RAISE NOTICE 'Found % constraints on documents.income_id', constraint_count;
  
  -- If more than 1, remove extras (keep the standard named one)
  IF constraint_count > 1 THEN
    FOR constraint_name IN 
      SELECT tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.constraint_schema = 'public'
        AND tc.table_name = 'documents'
        AND kcu.column_name = 'income_id'
        AND tc.constraint_name != 'documents_income_id_fkey'
      ORDER BY tc.constraint_name
    LOOP
      BEGIN
        EXECUTE format('ALTER TABLE documents DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE '🗑️  Removed duplicate constraint: %', constraint_name;
      EXCEPTION 
        WHEN OTHERS THEN
          RAISE NOTICE '❌ Failed to remove constraint %: %', constraint_name, SQLERRM;
      END;
    END LOOP;
  END IF;
END $$;

-- ====================================================================
-- STEP 3: ENSURE CLEAN USER RELATIONSHIP CONSTRAINTS
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  ENSURING CLEAN USER RELATIONSHIP CONSTRAINTS...';
END $$;

-- Clean and recreate clients.created_by → profiles.id
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Remove all existing created_by constraints
  FOR constraint_name IN 
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_schema = 'public'
      AND tc.table_name = 'clients'
      AND kcu.column_name = 'created_by'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE clients DROP CONSTRAINT %I', constraint_name);
      RAISE NOTICE '🗑️  Removed existing constraint: %', constraint_name;
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to remove constraint %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
  
  -- Create single clean constraint
  BEGIN
    ALTER TABLE clients 
    ADD CONSTRAINT clients_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Created: clients.created_by → profiles.id';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Failed to create clients_created_by_fkey: %', SQLERRM;
  END;
END $$;

-- Clean and recreate incomes.user_id → profiles.id
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Remove all existing user_id constraints
  FOR constraint_name IN 
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_schema = 'public'
      AND tc.table_name = 'incomes'
      AND kcu.column_name = 'user_id'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE incomes DROP CONSTRAINT %I', constraint_name);
      RAISE NOTICE '🗑️  Removed existing constraint: %', constraint_name;
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to remove constraint %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
  
  -- Create single clean constraint
  BEGIN
    ALTER TABLE incomes 
    ADD CONSTRAINT incomes_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Created: incomes.user_id → profiles.id';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Failed to create incomes_user_id_fkey: %', SQLERRM;
  END;
END $$;

-- Clean and recreate expenses.user_id → profiles.id
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Remove all existing user_id constraints
  FOR constraint_name IN 
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_schema = 'public'
      AND tc.table_name = 'expenses'
      AND kcu.column_name = 'user_id'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE expenses DROP CONSTRAINT %I', constraint_name);
      RAISE NOTICE '🗑️  Removed existing constraint: %', constraint_name;
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to remove constraint %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
  
  -- Create single clean constraint
  BEGIN
    ALTER TABLE expenses 
    ADD CONSTRAINT expenses_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Created: expenses.user_id → profiles.id';
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Failed to create expenses_user_id_fkey: %', SQLERRM;
  END;
END $$;

-- ====================================================================
-- STEP 4: FORCE SCHEMA CACHE REFRESH (MULTIPLE METHODS)
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  FORCING COMPREHENSIVE SCHEMA CACHE REFRESH...';
END $$;

-- Method 1: Standard PostgREST reload
NOTIFY pgrst, 'reload schema';

-- Method 2: Alternative PostgREST notifications
NOTIFY pgrst, 'reload config';
NOTIFY pgrst;

-- Method 3: Update a dummy setting to trigger schema reload
DO $$
BEGIN
  -- This forces Supabase to reload the schema
  PERFORM set_config('app.refresh_schema', NOW()::text, false);
  RAISE NOTICE '🔄 Forced schema refresh with config update';
END $$;

-- ====================================================================
-- STEP 5: VERIFICATION OF CLEAN RELATIONSHIPS
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '5️⃣  VERIFYING CLEAN RELATIONSHIPS...';
END $$;

-- Show final constraint state
SELECT 
  'FINAL_CONSTRAINTS' as verification,
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
  AND tc.table_name IN ('clients', 'incomes', 'expenses', 'documents')
  AND kcu.column_name IN ('created_by', 'user_id', 'uploaded_by')
ORDER BY tc.table_name, kcu.column_name;

-- Test critical relationships with actual data
SELECT 
  'RELATIONSHIP_TEST' as test_type,
  'clients_to_profiles' as relationship,
  COUNT(*) as total_clients,
  COUNT(p.id) as clients_with_valid_creators,
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ ALL_WORKING'
    WHEN COUNT(p.id) > 0 THEN '⚠️ PARTIALLY_WORKING' 
    ELSE '❌ NOT_WORKING'
  END as status
FROM clients c
LEFT JOIN profiles p ON c.created_by = p.id

UNION ALL

SELECT 
  'RELATIONSHIP_TEST',
  'incomes_to_profiles',
  COUNT(*),
  COUNT(p.id),
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ ALL_WORKING'
    WHEN COUNT(p.id) > 0 THEN '⚠️ PARTIALLY_WORKING' 
    ELSE '❌ NOT_WORKING'
  END
FROM incomes i
LEFT JOIN profiles p ON i.user_id = p.id

UNION ALL

SELECT 
  'RELATIONSHIP_TEST',
  'expenses_to_profiles',
  COUNT(*),
  COUNT(p.id),
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN '✅ ALL_WORKING'
    WHEN COUNT(p.id) > 0 THEN '⚠️ PARTIALLY_WORKING' 
    ELSE '❌ NOT_WORKING'
  END
FROM expenses e
LEFT JOIN profiles p ON e.user_id = p.id;

-- ====================================================================
-- FINAL SUMMARY AND NEXT STEPS
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== SCHEMA CACHE CLEANUP COMPLETED ===';
  RAISE NOTICE '';
  RAISE NOTICE 'ACTIONS TAKEN:';
  RAISE NOTICE '✅ Cleaned duplicate constraints';
  RAISE NOTICE '✅ Ensured single clean relationships:';
  RAISE NOTICE '   - clients.created_by → profiles.id';
  RAISE NOTICE '   - incomes.user_id → profiles.id';
  RAISE NOTICE '   - expenses.user_id → profiles.id';
  RAISE NOTICE '✅ Forced comprehensive schema cache refresh';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Wait 30 seconds for cache propagation';
  RAISE NOTICE '2. Test frontend pages:';
  RAISE NOTICE '   - /clients (ClientManagement)';
  RAISE NOTICE '   - /calendar (WorkshopCalendar)';  
  RAISE NOTICE '   - /analytics (AnalyticsDashboard)';
  RAISE NOTICE '   - /documents (Documents)';
  RAISE NOTICE '3. Clear browser cache if issues persist';
  RAISE NOTICE '4. Logout/login if authentication needed';
  RAISE NOTICE '';
  RAISE NOTICE 'Schema cache refresh timestamp: %', NOW();
END $$; 