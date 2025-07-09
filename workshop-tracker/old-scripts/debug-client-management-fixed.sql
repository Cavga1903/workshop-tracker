-- ====================================================================
-- CLIENT MANAGEMENT DEBUG - FIXED SYNTAX VERSION
-- Debug script for Client Management API errors (Fixed syntax)
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE 'CLIENT MANAGEMENT DEBUG STARTING...';
  RAISE NOTICE 'Debugging Client Management API errors...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- STEP 1: CHECK CLIENTS TABLE STRUCTURE
-- ====================================================================

-- Check clients table structure
SELECT 
  'CLIENTS_TABLE_STRUCTURE' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Check clients constraints
SELECT 
  'CLIENTS_CONSTRAINTS' as check_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'clients'
ORDER BY tc.constraint_type, tc.constraint_name;

-- ====================================================================
-- STEP 2: CHECK RLS POLICIES
-- ====================================================================

-- Check clients RLS policies
SELECT 
  'CLIENTS_RLS_POLICIES' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'clients';

-- Check profiles RLS policies
SELECT 
  'PROFILES_RLS_POLICIES' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'profiles';

-- ====================================================================
-- STEP 3: CHECK EXISTING DATA
-- ====================================================================

-- Check clients data
SELECT 
  'CLIENTS_DATA_COUNT' as check_name,
  COUNT(*) as total_clients,
  COUNT(created_by) as created_by_filled,
  COUNT(CASE WHEN created_by IS NULL THEN 1 END) as created_by_null,
  COUNT(DISTINCT created_by) as unique_creators
FROM clients;

-- Check profiles data
SELECT 
  'PROFILES_DATA_COUNT' as check_name,
  COUNT(*) as total_profiles,
  COUNT(full_name) as full_name_filled,
  COUNT(email) as email_filled,
  COUNT(CASE WHEN full_name IS NULL THEN 1 END) as full_name_null
FROM profiles;

-- ====================================================================
-- STEP 4: TEST JOIN RELATIONSHIP
-- ====================================================================

-- Test Client-Profile relationship (same as frontend query)
SELECT 
  'CLIENT_PROFILE_JOIN_TEST' as test_name,
  c.id as client_id,
  c.full_name as client_name,
  c.email as client_email,
  c.created_by,
  p.id as profile_id,
  p.full_name as creator_name,
  p.email as creator_email,
  CASE 
    WHEN p.id IS NOT NULL THEN 'JOIN_SUCCESS'
    ELSE 'JOIN_FAILED'
  END as join_status
FROM clients c
LEFT JOIN profiles p ON c.created_by = p.id
ORDER BY c.created_at DESC
LIMIT 5;

-- ====================================================================
-- STEP 5: SIMULATE API QUERY
-- ====================================================================

-- Simulate frontend API query
WITH client_data AS (
  SELECT 
    c.*,
    p.full_name as creator_full_name,
    p.email as creator_email
  FROM clients c
  LEFT JOIN profiles p ON c.created_by = p.id
  ORDER BY c.created_at DESC
)
SELECT 
  'API_QUERY_SIMULATION' as simulation,
  COUNT(*) as total_records,
  COUNT(CASE WHEN creator_full_name IS NOT NULL THEN 1 END) as with_creator_info,
  COUNT(CASE WHEN creator_full_name IS NULL THEN 1 END) as without_creator_info,
  CASE 
    WHEN COUNT(*) > 0 THEN 'DATA_EXISTS'
    ELSE 'NO_DATA'
  END as data_status
FROM client_data;

-- ====================================================================
-- STEP 6: CHECK RLS STATUS
-- ====================================================================

-- Check if RLS is enabled
SELECT 
  'RLS_STATUS' as check_name,
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS_ENABLED'
    ELSE 'RLS_DISABLED'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('clients', 'profiles');

-- ====================================================================
-- STEP 7: CREATE SAMPLE DATA IF NEEDED
-- ====================================================================

-- Create sample data if no data exists
DO $$
DECLARE
  client_count INTEGER;
  profile_count INTEGER;
  first_profile_id UUID;
BEGIN
  -- Check current data count
  SELECT COUNT(*) INTO client_count FROM clients;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE 'CURRENT DATA STATUS:';
  RAISE NOTICE '   - Clients: % records', client_count;
  RAISE NOTICE '   - Profiles: % records', profile_count;
  
  -- Create sample data if profiles exist but no clients
  IF profile_count > 0 AND client_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'CREATING SAMPLE CLIENTS...';
    
    -- Get first profile
    SELECT id INTO first_profile_id FROM profiles ORDER BY created_at ASC LIMIT 1;
    
    -- Create sample clients
    INSERT INTO clients (full_name, email, phone, created_by, company, address, notes)
    VALUES 
      ('Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 123-4567', first_profile_id, 'Art Studio Inc', '123 Main St, City', 'Regular pottery class attendee'),
      ('Michael Chen', 'michael.chen@email.com', '+1 (555) 987-6543', first_profile_id, 'Creative Co', '456 Oak Ave, Town', 'Interested in painting workshops'),
      ('Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', first_profile_id, 'Freelance', '789 Pine Rd, Village', 'Digital art enthusiast');
    
    RAISE NOTICE 'SUCCESS: 3 sample clients created';
  END IF;
END $$;

-- ====================================================================
-- STEP 8: FINAL SIMPLE TEST
-- ====================================================================

-- Simple client query test
SELECT 
  'SIMPLE_CLIENT_QUERY' as final_test,
  id,
  full_name,
  email,
  created_at,
  created_by
FROM clients 
ORDER BY created_at DESC 
LIMIT 3;

-- ====================================================================
-- SUMMARY
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CLIENT MANAGEMENT DEBUG COMPLETE ===';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Check RLS policies above';
  RAISE NOTICE '2. Run fix-client-rls-policies.sql if needed';
  RAISE NOTICE '3. Refresh frontend and test';
  RAISE NOTICE '';
  RAISE NOTICE 'Debug completed at: %', NOW();
END $$; 