-- ====================================================================
-- FRONTEND PAGE RELATIONSHIP TESTS
-- Tests the exact queries used by each frontend page
-- ====================================================================

-- Enable error output
SET client_min_messages TO NOTICE;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FRONTEND PAGE RELATIONSHIP TESTS ===';
  RAISE NOTICE 'Testing exact queries used by each page...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- TEST 1: CLIENT MANAGEMENT PAGE
-- Query: profiles:created_by(full_name, email)
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '1️⃣  TESTING CLIENT MANAGEMENT PAGE...';
  RAISE NOTICE 'Query: SELECT clients.*, profiles.full_name, profiles.email FROM clients JOIN profiles ON clients.created_by = profiles.id';
END $$;

-- Test the exact relationship used by ClientManagement.jsx
SELECT 
  'CLIENT_MANAGEMENT_TEST' as test_name,
  c.id as client_id,
  c.full_name as client_name,
  c.email as client_email,
  c.created_by,
  p.full_name as creator_name,
  p.email as creator_email,
  CASE 
    WHEN p.id IS NOT NULL THEN 'RELATIONSHIP_WORKS'
    ELSE 'RELATIONSHIP_FAILED'
  END as status
FROM clients c
LEFT JOIN profiles p ON c.created_by = p.id
LIMIT 5;

-- ====================================================================
-- TEST 2: CALENDAR PAGE (INCOMES)
-- Query: profiles:user_id(full_name, email) + class_types:class_type_id(name)
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  TESTING CALENDAR PAGE (INCOMES)...';
  RAISE NOTICE 'Query: SELECT incomes.*, profiles.full_name, profiles.email, class_types.name FROM incomes JOIN profiles ON incomes.user_id = profiles.id';
END $$;

-- Test the exact relationship used by WorkshopCalendar.jsx for incomes
SELECT 
  'CALENDAR_INCOMES_TEST' as test_name,
  i.id as income_id,
  i.name as income_name,
  i.user_id,
  p.full_name as instructor_name,
  p.email as instructor_email,
  i.class_type_id,
  ct.name as class_type_name,
  CASE 
    WHEN p.id IS NOT NULL THEN 'USER_RELATIONSHIP_WORKS'
    ELSE 'USER_RELATIONSHIP_FAILED'
  END as user_status,
  CASE 
    WHEN ct.id IS NOT NULL OR i.class_type_id IS NULL THEN 'CLASS_TYPE_OK'
    ELSE 'CLASS_TYPE_FAILED'
  END as class_type_status
FROM incomes i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN class_types ct ON i.class_type_id = ct.id
LIMIT 5;

-- ====================================================================
-- TEST 3: ANALYTICS PAGE (INCOMES + EXPENSES)
-- Query: Same as calendar for incomes, plus expenses with profiles:user_id
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  TESTING ANALYTICS PAGE (INCOMES)...';
END $$;

-- Test incomes query used by AnalyticsDashboard.jsx (same as calendar)
SELECT 
  'ANALYTICS_INCOMES_TEST' as test_name,
  COUNT(*) as total_incomes,
  COUNT(p.id) as incomes_with_user_profile,
  COUNT(ct.id) as incomes_with_class_type,
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN 'ALL_USER_RELATIONSHIPS_WORK'
    WHEN COUNT(p.id) > 0 THEN 'SOME_USER_RELATIONSHIPS_WORK'
    ELSE 'NO_USER_RELATIONSHIPS_WORK'
  END as user_relationship_status
FROM incomes i
LEFT JOIN profiles p ON i.user_id = p.id
LEFT JOIN class_types ct ON i.class_type_id = ct.id;

DO $$
BEGIN
  RAISE NOTICE '3️⃣  TESTING ANALYTICS PAGE (EXPENSES)...';
END $$;

-- Test expenses query used by AnalyticsDashboard.jsx
SELECT 
  'ANALYTICS_EXPENSES_TEST' as test_name,
  e.id as expense_id,
  e.name as expense_name,
  e.user_id,
  p.full_name as creator_name,
  p.email as creator_email,
  CASE 
    WHEN p.id IS NOT NULL THEN 'USER_RELATIONSHIP_WORKS'
    ELSE 'USER_RELATIONSHIP_FAILED'
  END as status
FROM expenses e
LEFT JOIN profiles p ON e.user_id = p.id
LIMIT 5;

-- Summary for expenses
SELECT 
  'ANALYTICS_EXPENSES_SUMMARY' as test_name,
  COUNT(*) as total_expenses,
  COUNT(p.id) as expenses_with_user_profile,
  CASE 
    WHEN COUNT(*) = COUNT(p.id) THEN 'ALL_USER_RELATIONSHIPS_WORK'
    WHEN COUNT(p.id) > 0 THEN 'SOME_USER_RELATIONSHIPS_WORK'
    ELSE 'NO_USER_RELATIONSHIPS_WORK'
  END as user_relationship_status
FROM expenses e
LEFT JOIN profiles p ON e.user_id = p.id;

-- ====================================================================
-- TEST 4: DOCUMENTS PAGE
-- Query: Multiple relationships - workshops, incomes, expenses, clients
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣  TESTING DOCUMENTS PAGE...';
  RAISE NOTICE 'Query: SELECT documents.*, workshops.name, incomes.name, expenses.name, clients.full_name FROM documents with multiple JOINs';
END $$;

-- Test the complex multi-relationship query used by Documents.jsx
SELECT 
  'DOCUMENTS_TEST' as test_name,
  d.id as document_id,
  d.file_name,
  d.workshop_id,
  w.name as workshop_name,
  d.income_id,
  i.name as income_name,
  d.expense_id,
  e.name as expense_name,
  d.client_id,
  c.full_name as client_name,
  c.email as client_email,
  CASE 
    WHEN d.workshop_id IS NOT NULL AND w.id IS NULL THEN 'WORKSHOP_RELATIONSHIP_BROKEN'
    WHEN d.income_id IS NOT NULL AND i.id IS NULL THEN 'INCOME_RELATIONSHIP_BROKEN'
    WHEN d.expense_id IS NOT NULL AND e.id IS NULL THEN 'EXPENSE_RELATIONSHIP_BROKEN'
    WHEN d.client_id IS NOT NULL AND c.id IS NULL THEN 'CLIENT_RELATIONSHIP_BROKEN'
    ELSE 'ALL_RELATIONSHIPS_OK'
  END as relationship_status
FROM documents d
LEFT JOIN workshops w ON d.workshop_id = w.id
LEFT JOIN incomes i ON d.income_id = i.id
LEFT JOIN expenses e ON d.expense_id = e.id
LEFT JOIN clients c ON d.client_id = c.id
LIMIT 5;

-- Documents relationship summary
SELECT 
  'DOCUMENTS_SUMMARY' as test_name,
  COUNT(*) as total_documents,
  COUNT(CASE WHEN d.workshop_id IS NOT NULL THEN 1 END) as docs_linked_to_workshops,
  COUNT(CASE WHEN d.workshop_id IS NOT NULL AND w.id IS NOT NULL THEN 1 END) as workshop_links_working,
  COUNT(CASE WHEN d.income_id IS NOT NULL THEN 1 END) as docs_linked_to_incomes,
  COUNT(CASE WHEN d.income_id IS NOT NULL AND i.id IS NOT NULL THEN 1 END) as income_links_working,
  COUNT(CASE WHEN d.expense_id IS NOT NULL THEN 1 END) as docs_linked_to_expenses,
  COUNT(CASE WHEN d.expense_id IS NOT NULL AND e.id IS NOT NULL THEN 1 END) as expense_links_working,
  COUNT(CASE WHEN d.client_id IS NOT NULL THEN 1 END) as docs_linked_to_clients,
  COUNT(CASE WHEN d.client_id IS NOT NULL AND c.id IS NOT NULL THEN 1 END) as client_links_working
FROM documents d
LEFT JOIN workshops w ON d.workshop_id = w.id
LEFT JOIN incomes i ON d.income_id = i.id
LEFT JOIN expenses e ON d.expense_id = e.id
LEFT JOIN clients c ON d.client_id = c.id;

-- ====================================================================
-- TEST 5: WORKSHOP RELATIONSHIPS (if workshops table exists)
-- ====================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'workshops'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '5️⃣  TESTING WORKSHOP RELATIONSHIPS...';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '5️⃣  WORKSHOPS TABLE NOT FOUND - SKIPPING WORKSHOP TESTS';
  END IF;
END $$;

-- Test workshop relationships if table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'workshops'
  ) INTO table_exists;
  
  IF table_exists THEN
    -- Test workshops with instructor and class type relationships
    PERFORM 1; -- This will be replaced with actual query if table exists
  END IF;
END $$;

-- Conditional workshop test query
SELECT 
  'WORKSHOP_TEST' as test_name,
  w.id as workshop_id,
  w.name as workshop_name,
  w.instructor_id,
  p.full_name as instructor_name,
  w.class_type_id,
  ct.name as class_type_name,
  CASE 
    WHEN p.id IS NOT NULL THEN 'INSTRUCTOR_RELATIONSHIP_WORKS'
    ELSE 'INSTRUCTOR_RELATIONSHIP_FAILED'
  END as instructor_status,
  CASE 
    WHEN ct.id IS NOT NULL OR w.class_type_id IS NULL THEN 'CLASS_TYPE_OK'
    ELSE 'CLASS_TYPE_FAILED'
  END as class_type_status
FROM workshops w
LEFT JOIN profiles p ON w.instructor_id = p.id
LEFT JOIN class_types ct ON w.class_type_id = ct.id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workshops')
LIMIT 5;

-- ====================================================================
-- FINAL SUMMARY: CRITICAL RELATIONSHIP STATUS
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL RELATIONSHIP STATUS SUMMARY ===';
END $$;

-- Check if all critical constraints exist
SELECT 
  'CONSTRAINT_STATUS' as summary_type,
  'clients_created_by_fkey' as constraint_name,
  EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'clients' 
      AND constraint_name = 'clients_created_by_fkey'
  ) as constraint_exists
UNION ALL
SELECT 
  'CONSTRAINT_STATUS',
  'incomes_user_id_fkey',
  EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'incomes' 
      AND constraint_name = 'incomes_user_id_fkey'
  )
UNION ALL
SELECT 
  'CONSTRAINT_STATUS',
  'expenses_user_id_fkey',
  EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'expenses' 
      AND constraint_name = 'expenses_user_id_fkey'
  )
UNION ALL
SELECT 
  'CONSTRAINT_STATUS',
  'documents_uploaded_by_fkey',
  EXISTS(
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'documents' 
      AND constraint_name = 'documents_uploaded_by_fkey'
  );

-- Data counts for context
SELECT 
  'DATA_COUNTS' as summary_type,
  'clients' as table_name,
  COUNT(*) as record_count
FROM clients
UNION ALL
SELECT 'DATA_COUNTS', 'incomes', COUNT(*) FROM incomes
UNION ALL
SELECT 'DATA_COUNTS', 'expenses', COUNT(*) FROM expenses  
UNION ALL
SELECT 'DATA_COUNTS', 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'DATA_COUNTS', 'profiles', COUNT(*) FROM profiles;

-- Schema cache refresh
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Frontend page relationship tests completed!';
  RAISE NOTICE '📊 Review the test results above to identify any remaining issues.';
  RAISE NOTICE '🔄 Schema cache has been refreshed.';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Test the actual frontend pages to verify they work!';
END $$; 