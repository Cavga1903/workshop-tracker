-- ====================================================================
-- ADD MISSING COLUMNS TO CLIENTS TABLE
-- Fix the missing column error for client management
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE 'ADDING MISSING COLUMNS TO CLIENTS TABLE...';
  RAISE NOTICE '';
END $$;

-- ====================================================================
-- STEP 1: CHECK EXISTING COLUMNS
-- ====================================================================

-- Show current clients table structure
SELECT 
  'CURRENT_CLIENTS_STRUCTURE' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- ====================================================================
-- STEP 2: ADD MISSING COLUMNS
-- ====================================================================

-- Add company column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'clients' 
      AND column_name = 'company'
  ) THEN
    ALTER TABLE clients ADD COLUMN company TEXT;
    RAISE NOTICE 'SUCCESS: Added company column to clients table';
  ELSE
    RAISE NOTICE 'INFO: company column already exists';
  END IF;
END $$;

-- Add address column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'clients' 
      AND column_name = 'address'
  ) THEN
    ALTER TABLE clients ADD COLUMN address TEXT;
    RAISE NOTICE 'SUCCESS: Added address column to clients table';
  ELSE
    RAISE NOTICE 'INFO: address column already exists';
  END IF;
END $$;

-- Add notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'clients' 
      AND column_name = 'notes'
  ) THEN
    ALTER TABLE clients ADD COLUMN notes TEXT;
    RAISE NOTICE 'SUCCESS: Added notes column to clients table';
  ELSE
    RAISE NOTICE 'INFO: notes column already exists';
  END IF;
END $$;

-- ====================================================================
-- STEP 3: CREATE SAMPLE DATA NOW
-- ====================================================================

-- Create sample data with all columns
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
    RAISE NOTICE 'CREATING SAMPLE CLIENTS WITH ALL COLUMNS...';
    
    -- Get first profile
    SELECT id INTO first_profile_id FROM profiles ORDER BY created_at ASC LIMIT 1;
    
    -- Create sample clients with all fields
    INSERT INTO clients (full_name, email, phone, created_by, company, address, notes)
    VALUES 
      ('Sarah Johnson', 'sarah.johnson@email.com', '+1 (555) 123-4567', first_profile_id, 'Art Studio Inc', '123 Main St, City', 'Regular pottery class attendee'),
      ('Michael Chen', 'michael.chen@email.com', '+1 (555) 987-6543', first_profile_id, 'Creative Co', '456 Oak Ave, Town', 'Interested in painting workshops'),
      ('Emily Rodriguez', 'emily.rodriguez@email.com', '+1 (555) 456-7890', first_profile_id, 'Freelance', '789 Pine Rd, Village', 'Digital art enthusiast'),
      ('David Kim', 'david.kim@email.com', '+1 (555) 234-5678', first_profile_id, 'Design House', '321 Elm St, County', 'Ceramic art workshops'),
      ('Lisa Thompson', 'lisa.thompson@email.com', '+1 (555) 345-6789', first_profile_id, 'Self-employed', '654 Maple Ave, District', 'Mixed media artist');
    
    RAISE NOTICE 'SUCCESS: 5 sample clients created with all fields';
  ELSE
    RAISE NOTICE 'INFO: Client data already exists or no profiles found';
  END IF;
END $$;

-- ====================================================================
-- STEP 4: VERIFY NEW STRUCTURE
-- ====================================================================

-- Show updated clients table structure
SELECT 
  'UPDATED_CLIENTS_STRUCTURE' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Test the client data
SELECT 
  'SAMPLE_CLIENT_DATA' as test_name,
  id,
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

-- ====================================================================
-- STEP 5: FINAL SUMMARY
-- ====================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MISSING COLUMNS ADDED SUCCESSFULLY ===';
  RAISE NOTICE '';
  RAISE NOTICE 'ADDED COLUMNS:';
  RAISE NOTICE '- company (TEXT)';
  RAISE NOTICE '- address (TEXT)';
  RAISE NOTICE '- notes (TEXT)';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Run fix-client-rls-policies.sql to set up RLS';
  RAISE NOTICE '2. Test Client Management page';
  RAISE NOTICE '3. Verify API calls work properly';
  RAISE NOTICE '';
  RAISE NOTICE 'Column addition completed at: %', NOW();
END $$; 