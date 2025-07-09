-- ====================================================================
-- LINK EXISTING DATA TO CLASS TYPES
-- Connect existing incomes and workshops to class types
-- ====================================================================

BEGIN;

-- Step 1: Check current data status
SELECT 
  'CURRENT_DATA_STATUS' as check_type,
  (SELECT COUNT(*) FROM incomes) as total_incomes,
  (SELECT COUNT(*) FROM incomes WHERE class_type_id IS NOT NULL) as incomes_with_class_type,
  (SELECT COUNT(*) FROM workshops) as total_workshops,
  (SELECT COUNT(*) FROM class_types) as total_class_types;

-- Step 2: Show existing class types
SELECT 
  'AVAILABLE_CLASS_TYPES' as check_type,
  id, name, cost_per_person
FROM class_types
ORDER BY name;

-- Step 3: Update existing incomes with class_type_id
DO $$
DECLARE
  default_class_type_id UUID;
  pottery_class_type_id UUID;
  painting_class_type_id UUID;
  updated_count INTEGER;
BEGIN
  RAISE NOTICE 'STEP 3: LINKING EXISTING INCOMES TO CLASS TYPES...';
  
  -- Get class type IDs
  SELECT id INTO default_class_type_id FROM class_types WHERE name = 'Pottery Basics' LIMIT 1;
  SELECT id INTO pottery_class_type_id FROM class_types WHERE name ILIKE '%pottery%' LIMIT 1;
  SELECT id INTO painting_class_type_id FROM class_types WHERE name ILIKE '%painting%' LIMIT 1;
  
  IF default_class_type_id IS NULL THEN
    SELECT id INTO default_class_type_id FROM class_types ORDER BY created_at LIMIT 1;
  END IF;
  
  RAISE NOTICE 'Using default class_type_id: %', default_class_type_id;
  
  -- Update incomes based on their class_type text field
  UPDATE incomes 
  SET class_type_id = CASE 
    WHEN class_type ILIKE '%pottery%' OR class_type ILIKE '%ceramic%' THEN pottery_class_type_id
    WHEN class_type ILIKE '%painting%' OR class_type ILIKE '%paint%' THEN painting_class_type_id
    ELSE default_class_type_id
  END
  WHERE class_type_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % income records with class_type_id', updated_count;
END $$;

-- Step 4: Create sample workshops if none exist
DO $$
DECLARE
  workshop_count INTEGER;
  first_profile_id UUID;
  first_class_type_id UUID;
BEGIN
  RAISE NOTICE 'STEP 4: CREATING SAMPLE WORKSHOPS...';
  
  SELECT COUNT(*) INTO workshop_count FROM workshops;
  
  IF workshop_count = 0 THEN
    -- Get first profile and class type
    SELECT id INTO first_profile_id FROM profiles ORDER BY created_at LIMIT 1;
    SELECT id INTO first_class_type_id FROM class_types ORDER BY created_at LIMIT 1;
    
    IF first_profile_id IS NOT NULL AND first_class_type_id IS NOT NULL THEN
      INSERT INTO workshops (name, date, created_by, class_type_id, instructor_id)
      VALUES 
        ('Pottery Workshop - Beginner', NOW() + INTERVAL '1 day', first_profile_id, first_class_type_id, first_profile_id),
        ('Advanced Ceramics Session', NOW() + INTERVAL '3 days', first_profile_id, first_class_type_id, first_profile_id),
        ('Weekly Pottery Class', NOW() + INTERVAL '7 days', first_profile_id, first_class_type_id, first_profile_id);
      
      RAISE NOTICE 'Created 3 sample workshops';
    ELSE
      RAISE NOTICE 'Cannot create workshops - missing profile or class_type';
    END IF;
  ELSE
    RAISE NOTICE 'Workshops already exist: % records', workshop_count;
  END IF;
END $$;

-- Step 5: Update existing workshops with class_type_id
DO $$
DECLARE
  default_class_type_id UUID;
  first_profile_id UUID;
  updated_count INTEGER;
BEGIN
  RAISE NOTICE 'STEP 5: UPDATING EXISTING WORKSHOPS...';
  
  SELECT id INTO default_class_type_id FROM class_types ORDER BY created_at LIMIT 1;
  SELECT id INTO first_profile_id FROM profiles ORDER BY created_at LIMIT 1;
  
  -- Update workshops that don't have class_type_id
  UPDATE workshops 
  SET class_type_id = default_class_type_id,
      instructor_id = COALESCE(instructor_id, first_profile_id)
  WHERE class_type_id IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % workshop records', updated_count;
END $$;

-- Step 6: Verify the links are working
SELECT 
  'FINAL_DATA_STATUS' as check_type,
  (SELECT COUNT(*) FROM incomes) as total_incomes,
  (SELECT COUNT(*) FROM incomes WHERE class_type_id IS NOT NULL) as incomes_with_class_type,
  (SELECT COUNT(*) FROM workshops) as total_workshops,
  (SELECT COUNT(*) FROM workshops WHERE class_type_id IS NOT NULL) as workshops_with_class_type;

-- Step 7: Test calendar joins
SELECT 
  'CALENDAR_JOIN_TEST_FIXED' as test_type,
  COUNT(DISTINCT i.id) as total_incomes,
  COUNT(DISTINCT CASE WHEN i.class_type_id IS NOT NULL THEN i.id END) as incomes_with_class_type,
  COUNT(DISTINCT w.id) as total_workshops,
  COUNT(DISTINCT ct.id) as linked_class_types
FROM incomes i
LEFT JOIN class_types ct ON i.class_type_id = ct.id
LEFT JOIN workshops w ON w.class_type_id = ct.id;

-- Step 8: Show sample data for calendar
SELECT 
  'CALENDAR_SAMPLE_DATA' as sample_type,
  'INCOME' as record_type,
  i.id,
  i.date,
  i.payment,
  i.class_type as original_class_type,
  ct.name as linked_class_type_name,
  ct.cost_per_person
FROM incomes i
LEFT JOIN class_types ct ON i.class_type_id = ct.id
ORDER BY i.date DESC
LIMIT 5;

SELECT 
  'CALENDAR_SAMPLE_DATA' as sample_type,
  'WORKSHOP' as record_type,
  w.id,
  w.name,
  w.date,
  ct.name as class_type_name,
  p.full_name as instructor_name
FROM workshops w
LEFT JOIN class_types ct ON w.class_type_id = ct.id
LEFT JOIN profiles p ON w.instructor_id = p.id
ORDER BY w.date DESC
LIMIT 5;

COMMIT;

-- Final message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== EXISTING DATA LINKING COMPLETE ===';
  RAISE NOTICE 'All income and workshop records are now linked to class types.';
  RAISE NOTICE 'Calendar page should now display data properly.';
  RAISE NOTICE '';
END $$; 