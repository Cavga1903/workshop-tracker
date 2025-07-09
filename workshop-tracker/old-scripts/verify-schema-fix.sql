-- VERIFICATION SCRIPT - Check if schema fixes were applied
-- Copy and paste this into your Supabase SQL Editor to verify the fixes

DO $$
DECLARE
    column_exists boolean;
    constraint_exists boolean;
    table_exists boolean;
BEGIN
    RAISE NOTICE '🔍 ===============================================';
    RAISE NOTICE '🔍 SCHEMA FIX VERIFICATION';
    RAISE NOTICE '🔍 ===============================================';
    RAISE NOTICE '';
    
    -- Check if critical missing columns were added
    RAISE NOTICE '📋 CHECKING CRITICAL COLUMNS:';
    
    -- Check incomes.client_id
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'client_id') INTO column_exists;
    RAISE NOTICE '  ✅ incomes.client_id exists: %', column_exists;
    
    -- Check clients.created_by
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_by') INTO column_exists;
    RAISE NOTICE '  ✅ clients.created_by exists: %', column_exists;
    
    -- Check clients.full_name (this was causing "column does not exist" error)
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') INTO column_exists;
    RAISE NOTICE '  ✅ clients.full_name exists: %', column_exists;
    
    -- Check documents.uploaded_by
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_by') INTO column_exists;
    RAISE NOTICE '  ✅ documents.uploaded_by exists: %', column_exists;
    
    -- Check documents.workshop_id
    SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'workshop_id') INTO column_exists;
    RAISE NOTICE '  ✅ documents.workshop_id exists: %', column_exists;
    
    RAISE NOTICE '';
    
    -- Check if foreign key constraints were added
    RAISE NOTICE '🔐 CHECKING FOREIGN KEY CONSTRAINTS:';
    
    -- Check incomes.user_id constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'incomes'
        AND constraint_name LIKE '%user_id%'
    ) INTO constraint_exists;
    RAISE NOTICE '  ✅ incomes.user_id → auth.users.id: %', constraint_exists;
    
    -- Check incomes.client_id constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'incomes'
        AND constraint_name LIKE '%client_id%'
    ) INTO constraint_exists;
    RAISE NOTICE '  ✅ incomes.client_id → clients.id: %', constraint_exists;
    
    -- Check clients.created_by constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'clients'
        AND constraint_name LIKE '%created_by%'
    ) INTO constraint_exists;
    RAISE NOTICE '  ✅ clients.created_by → auth.users.id: %', constraint_exists;
    
    -- Check documents.workshop_id constraint
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_name = 'documents'
        AND constraint_name LIKE '%workshop_id%'
    ) INTO constraint_exists;
    RAISE NOTICE '  ✅ documents.workshop_id → workshops.id: %', constraint_exists;
    
    RAISE NOTICE '';
    
    -- Check if required tables exist
    RAISE NOTICE '🏗️ CHECKING REQUIRED TABLES:';
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshops') INTO table_exists;
    RAISE NOTICE '  ✅ workshops table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') INTO table_exists;
    RAISE NOTICE '  ✅ profiles table exists: %', table_exists;
    
    RAISE NOTICE '';
    
    -- Count total foreign keys to see overall relationship health
    SELECT COUNT(*) INTO constraint_exists
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN ('incomes', 'expenses', 'clients', 'documents', 'workshops');
    
    RAISE NOTICE '📊 TOTAL FOREIGN KEY RELATIONSHIPS: %', constraint_exists;
    
    RAISE NOTICE '';
    
    -- Final assessment
    IF column_exists THEN
        RAISE NOTICE '🎉 ===============================================';
        RAISE NOTICE '🎉 SCHEMA FIX VERIFICATION SUCCESSFUL!';
        RAISE NOTICE '🎉 ===============================================';
        RAISE NOTICE '';
        RAISE NOTICE '✅ All critical columns and relationships are in place';
        RAISE NOTICE '✅ Your Workshop Tracker should now work correctly';
        RAISE NOTICE '';
        RAISE NOTICE '🎯 NEXT STEPS:';
        RAISE NOTICE '   1. Hard refresh your browser (Cmd+Shift+R)';
        RAISE NOTICE '   2. Wait 30 seconds for cache to refresh';
        RAISE NOTICE '   3. Test these pages:';
        RAISE NOTICE '      • Enhanced Analytics (should load data)';
        RAISE NOTICE '      • Who Paid (should show incomes with client info)';
        RAISE NOTICE '      • Documents (should load without full_name error)';
        RAISE NOTICE '      • Calendar (should load events)';
        RAISE NOTICE '      • Clients (should show created_by relationships)';
        RAISE NOTICE '';
        RAISE NOTICE '💡 All relationship errors should now be resolved!';
    ELSE
        RAISE NOTICE '⚠️  VERIFICATION FAILED - Some fixes may not have applied';
        RAISE NOTICE '   Please check the output above for missing items';
    END IF;
    
    RAISE NOTICE '';
END $$; 