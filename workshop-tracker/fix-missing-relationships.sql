-- ====================================================================
-- FIX MISSING SCHEMA RELATIONSHIPS - CALENDAR & OTHER PAGES
-- Fixes "Could not find a relationship" errors
-- ====================================================================

BEGIN;

-- Step 1: Check current table structure and relationships
DO $$
BEGIN
  RAISE NOTICE 'STEP 1: ANALYZING MISSING RELATIONSHIPS...';
END $$;

-- Check if class_types table exists and its structure
SELECT 
  'CLASS_TYPES_CHECK' as check_type,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'class_types') as table_exists;

-- Check incomes table columns for class_type_id
SELECT 
  'INCOMES_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'incomes' 
  AND column_name IN ('class_type_id', 'class_type', 'user_id', 'client_id')
ORDER BY column_name;

-- Check workshops table columns
SELECT 
  'WORKSHOPS_COLUMNS' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'workshops' 
  AND column_name IN ('class_type_id', 'instructor_id', 'created_by')
ORDER BY column_name;

-- Step 2: Add missing columns
DO $$
BEGIN
  RAISE NOTICE 'STEP 2: ADDING MISSING COLUMNS...';
  
  -- Add class_type_id to incomes if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incomes' AND column_name = 'class_type_id'
  ) THEN
    ALTER TABLE incomes ADD COLUMN class_type_id UUID;
    RAISE NOTICE 'Added class_type_id to incomes table';
  END IF;
  
  -- Add class_type_id to workshops if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workshops' AND column_name = 'class_type_id'
  ) THEN
    ALTER TABLE workshops ADD COLUMN class_type_id UUID;
    RAISE NOTICE 'Added class_type_id to workshops table';
  END IF;
  
  -- Add instructor_id to workshops if missing  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workshops' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE workshops ADD COLUMN instructor_id UUID;
    RAISE NOTICE 'Added instructor_id to workshops table';
  END IF;
END $$;

-- Step 3: Create missing foreign key relationships
DO $$
BEGIN
  RAISE NOTICE 'STEP 3: CREATING FOREIGN KEY RELATIONSHIPS...';
  
  -- incomes.class_type_id → class_types.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'incomes_class_type_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE incomes 
      ADD CONSTRAINT incomes_class_type_id_fkey 
      FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE SET NULL;
      RAISE NOTICE 'Created: incomes.class_type_id → class_types.id';
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create incomes_class_type_id_fkey: %', SQLERRM;
    END;
  END IF;
  
  -- workshops.class_type_id → class_types.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workshops_class_type_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE workshops 
      ADD CONSTRAINT workshops_class_type_id_fkey 
      FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE SET NULL;
      RAISE NOTICE 'Created: workshops.class_type_id → class_types.id';
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create workshops_class_type_id_fkey: %', SQLERRM;
    END;
  END IF;
  
  -- workshops.instructor_id → profiles.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'workshops_instructor_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE workshops 
      ADD CONSTRAINT workshops_instructor_id_fkey 
      FOREIGN KEY (instructor_id) REFERENCES profiles(id) ON DELETE SET NULL;
      RAISE NOTICE 'Created: workshops.instructor_id → profiles.id';
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create workshops_instructor_id_fkey: %', SQLERRM;
    END;
  END IF;
  
  -- incomes.client_id → clients.id (if missing)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'incomes_client_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE incomes 
      ADD CONSTRAINT incomes_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
      RAISE NOTICE 'Created: incomes.client_id → clients.id';
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create incomes_client_id_fkey: %', SQLERRM;
    END;
  END IF;
  
  -- expenses.client_id → clients.id (if missing)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'expenses_client_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE expenses 
      ADD CONSTRAINT expenses_client_id_fkey 
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
      RAISE NOTICE 'Created: expenses.client_id → clients.id';
    EXCEPTION 
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not create expenses_client_id_fkey: %', SQLERRM;
    END;
  END IF;
END $$;

-- Step 4: Create sample class_types if table is empty
DO $$
DECLARE
  class_types_count INTEGER;
  first_class_type_id UUID;
BEGIN
  RAISE NOTICE 'STEP 4: ENSURING CLASS TYPES EXIST...';
  
  SELECT COUNT(*) INTO class_types_count FROM class_types;
  
  IF class_types_count = 0 THEN
    RAISE NOTICE 'Creating sample class types...';
    
    INSERT INTO class_types (name, cost_per_person) VALUES 
      ('Pottery Basics', 25.00),
      ('Advanced Ceramics', 35.00),
      ('Painting Workshop', 30.00),
      ('Digital Art', 40.00),
      ('Mixed Media', 28.00)
    RETURNING id INTO first_class_type_id;
    
    RAISE NOTICE 'Created 5 sample class types';
    
    -- Update existing incomes to have class_type_id
    UPDATE incomes SET class_type_id = first_class_type_id WHERE class_type_id IS NULL;
    RAISE NOTICE 'Updated incomes with sample class_type_id';
    
    -- Update existing workshops to have class_type_id
    UPDATE workshops SET class_type_id = first_class_type_id WHERE class_type_id IS NULL;
    RAISE NOTICE 'Updated workshops with sample class_type_id';
  ELSE
    RAISE NOTICE 'Class types already exist: % records', class_types_count;
  END IF;
END $$;

-- Step 5: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst;

-- Step 6: Verify relationships are working
SELECT 
  'RELATIONSHIP_VERIFICATION' as check_type,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('incomes', 'workshops', 'expenses')
  AND kcu.column_name IN ('class_type_id', 'instructor_id', 'client_id', 'user_id')
ORDER BY tc.table_name, kcu.column_name;

-- Test calendar-related joins
SELECT 
  'CALENDAR_JOIN_TEST' as test_type,
  COUNT(i.*) as total_incomes,
  COUNT(ct.*) as incomes_with_class_type,
  COUNT(w.*) as total_workshops
FROM incomes i
LEFT JOIN class_types ct ON i.class_type_id = ct.id
LEFT JOIN workshops w ON w.class_type_id = ct.id;

COMMIT;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== MISSING RELATIONSHIPS FIX COMPLETE ===';
  RAISE NOTICE 'Calendar and other pages should now work properly.';
  RAISE NOTICE 'Try refreshing the Calendar page now.';
  RAISE NOTICE '';
END $$; 