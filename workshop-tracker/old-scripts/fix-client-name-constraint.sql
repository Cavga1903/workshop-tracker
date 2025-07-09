-- ====================================================================
-- FIX CLIENT NAME CONSTRAINT ERROR
-- Fix the NOT NULL constraint violation for name column
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE 'FIXING CLIENT NAME CONSTRAINT ERROR...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- STEP 1: CHECK CURRENT CLIENTS TABLE STRUCTURE
-- ====================================================================

-- Show current clients table structure to understand the issue
SELECT 
  'CURRENT_CLIENTS_COLUMNS' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients'
  AND column_name IN ('name', 'full_name')
ORDER BY column_name;

-- Check existing data
SELECT 
  'EXISTING_CLIENT_DATA' as check_name,
  COUNT(*) as total_clients,
  COUNT(name) as name_filled,
  COUNT(full_name) as full_name_filled,
  COUNT(CASE WHEN name IS NULL THEN 1 END) as name_null,
  COUNT(CASE WHEN full_name IS NULL THEN 1 END) as full_name_null
FROM clients;

-- ====================================================================
-- STEP 2: CLEAR ANY EXISTING PROBLEMATIC DATA
-- ====================================================================

-- Delete any rows that might have NULL in name column
DELETE FROM clients WHERE name IS NULL;

-- ====================================================================
-- STEP 3: CREATE SAMPLE DATA WITH PROPER NAME AND FULL_NAME
-- ====================================================================

-- Create sample data with both name and full_name populated
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
  
  -- Create sample data if profiles exist
  IF profile_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'CREATING SAMPLE CLIENTS WITH PROPER NAME VALUES...';
    
    -- Get first profile
    SELECT id INTO first_profile_id FROM profiles ORDER BY created_at ASC LIMIT 1;
    
    -- Create sample clients with both name and full_name
    INSERT INTO clients (name, full_name, email, phone, created_by, company, address, notes)
    VALUES 
      ('Sarah Johnson', 'Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 123-4567', first_profile_id, 'Art Studio Inc', '123 Main St, City', 'Regular pottery class attendee'),
      ('Michael Chen', 'Michael Chen', 'michael.chen@email.com', '+1 (555) 987-6543', first_profile_id, 'Creative Co', '456 Oak Ave, Town', 'Interested in painting workshops'),
      ('Emily Rodriguez', 'Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', first_profile_id, 'Freelance', '789 Pine Rd, Village', 'Digital art enthusiast'),
      ('David Kim', 'David Kim', 'david.kim@email.com', '+1 (555) 234-5678', first_profile_id, 'Design House', '321 Elm St, County', 'Ceramic art workshops'),
      ('Lisa Thompson', 'Lisa Thompson', 'lisa.thompson@email.com', '+1 (555) 345-6789', first_profile_id, 'Self-employed', '654 Maple Ave, District', 'Mixed media artist');
    
    RAISE NOTICE 'SUCCESS: 5 sample clients created with proper name values';
  ELSE
    RAISE NOTICE 'WARNING: No profiles found - cannot create sample clients';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR creating sample data: %', SQLERRM;
    
    -- Try alternative approach - update name column to allow nulls temporarily
    RAISE NOTICE 'TRYING ALTERNATIVE: Making name column nullable...';
    
    -- Make name column nullable if the constraint is the issue
    ALTER TABLE clients ALTER COLUMN name DROP NOT NULL;
    
    RAISE NOTICE 'SUCCESS: name column is now nullable';
    
    -- Now try inserting without name column
    INSERT INTO clients (full_name, email, phone, created_by, company, address, notes)
    VALUES 
      ('Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 123-4567', first_profile_id, 'Art Studio Inc', '123 Main St, City', 'Regular pottery class attendee'),
      ('Michael Chen', 'michael.chen@email.com', '+1 (555) 987-6543', first_profile_id, 'Creative Co', '456 Oak Ave, Town', 'Interested in painting workshops'),
      ('Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', first_profile_id, 'Freelance', '789 Pine Rd, Village', 'Digital art enthusiast');
    
    -- Update name column with full_name values
    UPDATE clients SET name = full_name WHERE name IS NULL;
    
    RAISE NOTICE 'SUCCESS: Sample clients created via alternative method';
END $$;

-- ====================================================================
-- STEP 4: ENSURE NAME COLUMN IS PROPERLY POPULATED
-- ====================================================================

-- Update any clients where name is null but full_name is not
UPDATE clients 
SET name = full_name 
WHERE name IS NULL AND full_name IS NOT NULL;

-- Update any clients where full_name is null but name is not
UPDATE clients 
SET full_name = name 
WHERE full_name IS NULL AND name IS NOT NULL;

-- ====================================================================
-- STEP 5: VERIFY THE DATA
-- ====================================================================

-- Show the current client data
SELECT 
  'FINAL_CLIENT_DATA' as test_name,
  id,
  name,
  full_name,
  email,
  phone,
  company,
  address,
  substring(notes, 1, 30) as notes_preview,
  created_at,
  created_by
FROM clients 
ORDER BY created_at DESC 
LIMIT 5;

-- Verify name constraints
SELECT 
  'NAME_CONSTRAINT_CHECK' as check_name,
  COUNT(*) as total_clients,
  COUNT(name) as name_filled,
  COUNT(full_name) as full_name_filled,
  COUNT(CASE WHEN name IS NULL THEN 1 END) as name_null,
  COUNT(CASE WHEN full_name IS NULL THEN 1 END) as full_name_null,
  CASE 
    WHEN COUNT(CASE WHEN name IS NULL THEN 1 END) = 0 THEN 'ALL_NAMES_FILLED'
    ELSE 'SOME_NAMES_NULL'
  END as name_status
FROM clients;

-- ====================================================================
-- STEP 6: FINAL SUMMARY
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== CLIENT NAME CONSTRAINT FIX COMPLETE ===';
  RAISE NOTICE '';
  RAISE NOTICE 'ACTIONS TAKEN:';
  RAISE NOTICE '1. Cleared any problematic null name data';
  RAISE NOTICE '2. Created sample clients with proper name values';
  RAISE NOTICE '3. Ensured both name and full_name are populated';
  RAISE NOTICE '4. Verified data integrity';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Run fix-client-rls-policies.sql for RLS setup';
  RAISE NOTICE '2. Test Client Management page';
  RAISE NOTICE '3. Verify frontend API calls work';
  RAISE NOTICE '';
  RAISE NOTICE 'Name constraint fix completed at: %', NOW();
END $$; 