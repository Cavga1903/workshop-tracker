-- ADD MISSING USER CONSTRAINTS - Target the specific missing relationships
-- This script adds only the critical missing constraints causing the errors

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🎯 Adding missing user relationship constraints...';
    RAISE NOTICE '';
END $$;

-- =============================================
-- Add the 3 critical missing constraints
-- =============================================

-- 1. Add expenses.user_id constraint (Enhanced Analytics error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%expenses%user_id%' 
        AND table_name = 'expenses'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT fk_expenses_user_id_critical 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added expenses.user_id → auth.users.id';
    ELSE
        RAISE NOTICE '⚪ expenses.user_id constraint already exists';
    END IF;
END $$;

-- 2. Add incomes.user_id constraint (Calendar error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%incomes%user_id%' 
        AND table_name = 'incomes'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE incomes ADD CONSTRAINT fk_incomes_user_id_critical 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added incomes.user_id → auth.users.id';
    ELSE
        RAISE NOTICE '⚪ incomes.user_id constraint already exists';
    END IF;
END $$;

-- 3. Add clients.created_by constraint (Clients error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%clients%created_by%' 
        AND table_name = 'clients'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT fk_clients_created_by_critical 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added clients.created_by → auth.users.id';
    ELSE
        RAISE NOTICE '⚪ clients.created_by constraint already exists';
    END IF;
END $$;

-- =============================================
-- Force immediate schema cache refresh
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Forcing immediate schema cache refresh...';
    RAISE NOTICE '';
END $$;

-- Force refresh schema cache
ANALYZE expenses;
ANALYZE incomes; 
ANALYZE clients;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- =============================================
-- Verification
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ VERIFICATION of critical constraints...';
    RAISE NOTICE '';
    
    -- Check expenses.user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_expenses_user_id_critical' 
        AND table_name = 'expenses'
    ) THEN
        RAISE NOTICE '✅ expenses.user_id constraint CONFIRMED';
    ELSE
        RAISE NOTICE '❌ expenses.user_id constraint STILL MISSING';
    END IF;
    
    -- Check incomes.user_id  
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_incomes_user_id_critical' 
        AND table_name = 'incomes'
    ) THEN
        RAISE NOTICE '✅ incomes.user_id constraint CONFIRMED';
    ELSE
        RAISE NOTICE '❌ incomes.user_id constraint STILL MISSING';
    END IF;
    
    -- Check clients.created_by
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_clients_created_by_critical' 
        AND table_name = 'clients'
    ) THEN
        RAISE NOTICE '✅ clients.created_by constraint CONFIRMED';
    ELSE
        RAISE NOTICE '❌ clients.created_by constraint STILL MISSING';
    END IF;
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 CRITICAL CONSTRAINTS ADDED!';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 These specific errors should now be fixed:';
    RAISE NOTICE '   • Enhanced Analytics (expenses.user_id relationship)';
    RAISE NOTICE '   • Calendar (incomes.user_id relationship)';
    RAISE NOTICE '   • Clients (clients.created_by relationship)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '   1. Wait 1 minute for cache refresh';
    RAISE NOTICE '   2. Hard refresh browser (Cmd+Shift+R)';
    RAISE NOTICE '   3. Test Enhanced Analytics, Calendar, and Clients pages';
    RAISE NOTICE '';
END $$; 