-- DIAGNOSTIC CHECK - Run this first to see current state
-- Copy and paste this into your Supabase SQL Editor

-- Check which tables exist
DO $$
DECLARE
    table_exists boolean;
    column_exists boolean;
BEGIN
    RAISE NOTICE '🔍 ==============================================';
    RAISE NOTICE '🔍 DATABASE DIAGNOSTIC CHECK';
    RAISE NOTICE '🔍 ==============================================';
    RAISE NOTICE '';
    
    -- Check table existence
    RAISE NOTICE '📋 TABLE EXISTENCE CHECK:';
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') INTO table_exists;
    RAISE NOTICE '  incomes table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') INTO table_exists;
    RAISE NOTICE '  expenses table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') INTO table_exists;
    RAISE NOTICE '  clients table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') INTO table_exists;
    RAISE NOTICE '  documents table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshops') INTO table_exists;
    RAISE NOTICE '  workshops table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_types') INTO table_exists;
    RAISE NOTICE '  class_types table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') INTO table_exists;
    RAISE NOTICE '  profiles table exists: %', table_exists;
    
    RAISE NOTICE '';
    
    -- Check critical missing columns
    RAISE NOTICE '🔧 MISSING COLUMNS CHECK:';
    
    -- Check incomes.client_id
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'client_id') INTO column_exists;
    RAISE NOTICE '  incomes.client_id exists: %', column_exists;
    
    -- Check clients.created_by
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_by') INTO column_exists;
    RAISE NOTICE '  clients.created_by exists: %', column_exists;
    
    -- Check clients.full_name
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') INTO column_exists;
    RAISE NOTICE '  clients.full_name exists: %', column_exists;
    
    -- Check documents.uploaded_by
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_by') INTO column_exists;
    RAISE NOTICE '  documents.uploaded_by exists: %', column_exists;
    
    -- Check documents.workshop_id
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'workshop_id') INTO column_exists;
    RAISE NOTICE '  documents.workshop_id exists: %', column_exists;
    
    RAISE NOTICE '';
    
    -- Check foreign key constraints
    RAISE NOTICE '🔐 FOREIGN KEY CONSTRAINTS CHECK:';
    
    -- Count total foreign keys
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN ('incomes', 'expenses', 'clients', 'documents', 'workshops');
    
    RAISE NOTICE '  Total foreign key constraints: %', column_exists;
    
    -- Check specific constraints
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%incomes%user_id%' 
        AND constraint_type = 'FOREIGN KEY'
    ) INTO column_exists;
    RAISE NOTICE '  incomes.user_id constraint exists: %', column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%clients%created_by%' 
        AND constraint_type = 'FOREIGN KEY'
    ) INTO column_exists;
    RAISE NOTICE '  clients.created_by constraint exists: %', column_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ DIAGNOSTIC COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 If any critical columns or constraints are missing,';
    RAISE NOTICE '   run the complete-schema-fix.sql script next.';
    RAISE NOTICE '';
END $$; 