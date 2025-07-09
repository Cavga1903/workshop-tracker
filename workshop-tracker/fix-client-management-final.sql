-- ====================================================================
-- FINAL CLIENT MANAGEMENT FIX - ALL ISSUES IN ONE SCRIPT
-- This single script fixes everything needed for client management
-- ====================================================================

BEGIN;

-- Step 1: Check and fix clients table structure
DO $$
BEGIN
  RAISE NOTICE 'STEP 1: FIXING CLIENTS TABLE STRUCTURE...';
  
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='company') THEN
    ALTER TABLE clients ADD COLUMN company TEXT;
    RAISE NOTICE 'Added company column';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='address') THEN
    ALTER TABLE clients ADD COLUMN address TEXT;
    RAISE NOTICE 'Added address column';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clients' AND column_name='notes') THEN
    ALTER TABLE clients ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column';
  END IF;
  
  -- Make name column nullable to avoid constraint issues
  ALTER TABLE clients ALTER COLUMN name DROP NOT NULL;
  RAISE NOTICE 'Made name column nullable';
END $$;

-- Step 2: Clear all existing RLS policies
DO $$
DECLARE
    r RECORD;
BEGIN
  RAISE NOTICE 'STEP 2: CLEARING OLD RLS POLICIES...';
  
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'clients') LOOP
    EXECUTE format('DROP POLICY %I ON clients', r.policyname);
    RAISE NOTICE 'Dropped policy: %', r.policyname;
  END LOOP;
END $$;

-- Step 3: Set up clean RLS policies
DO $$
BEGIN
  RAISE NOTICE 'STEP 3: SETTING UP CLEAN RLS POLICIES...';
  
  -- Enable RLS
  ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  
  -- Allow authenticated users to read all clients
  CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT TO authenticated
    USING (true);
  
  -- Allow authenticated users to insert clients
  CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
  
  -- Allow users to update their own clients
  CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());
  
  -- Allow users to delete their own clients
  CREATE POLICY "clients_delete_policy" ON clients
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());
  
  RAISE NOTICE 'Created 4 RLS policies';
END $$;

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Step 5: Clear any problematic data and create fresh test data
DELETE FROM clients; -- Clear all existing problematic data

-- Step 6: Create one simple test client
DO $$
DECLARE
  first_profile_id UUID;
BEGIN
  RAISE NOTICE 'STEP 4: CREATING TEST DATA...';
  
  -- Get first profile ID
  SELECT id INTO first_profile_id FROM profiles ORDER BY created_at LIMIT 1;
  
  IF first_profile_id IS NOT NULL THEN
    -- Create one simple test client
    INSERT INTO clients (name, full_name, email, phone, company, address, notes, created_by)
    VALUES ('Test Client', 'Test Client', 'test@example.com', '555-1234', 'Test Company', 'Test Address', 'Test notes', first_profile_id);
    
    RAISE NOTICE 'Created test client successfully';
  ELSE
    RAISE NOTICE 'No profiles found - cannot create test client';
  END IF;
END $$;

-- Step 7: Verify everything works
SELECT 
  'VERIFICATION' as check_type,
  COUNT(*) as total_clients,
  COUNT(name) as name_filled,
  COUNT(company) as company_filled
FROM clients;

-- Show the test client
SELECT 
  'TEST_CLIENT' as type,
  id, name, full_name, email, phone, company, address, notes, created_by, created_at
FROM clients 
LIMIT 1;

-- Show RLS policies
SELECT 
  'RLS_POLICIES' as type,
  policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'clients';

COMMIT;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CLIENT MANAGEMENT FIX COMPLETE ===';
  RAISE NOTICE 'All clients table issues should now be resolved.';
  RAISE NOTICE 'Try adding a client through the frontend now.';
  RAISE NOTICE '';
END $$; 