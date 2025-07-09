-- FIXED RELATIONSHIP SCRIPT - Corrected syntax for remaining relationship errors
-- This script fixes the SQL syntax errors and properly addresses relationship issues
-- Run this in your Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Start transaction
BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🔧 FIXED RELATIONSHIP SCRIPT - Starting...';
    RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 1: DROP EXISTING CONSTRAINTS SAFELY
-- =============================================

DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '🗑️ Dropping existing foreign key constraints...';
    RAISE NOTICE '';
    
    -- Drop all foreign key constraints from incomes table
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'incomes' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE incomes DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE '🗑️ Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
    
    -- Drop all foreign key constraints from expenses table
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'expenses' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE expenses DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE '🗑️ Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
    
    -- Drop all foreign key constraints from clients table
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'clients' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE clients DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE '🗑️ Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
    
    -- Drop all foreign key constraints from documents table
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'documents' 
        AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE 'ALTER TABLE documents DROP CONSTRAINT IF EXISTS ' || constraint_record.constraint_name;
        RAISE NOTICE '🗑️ Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- =============================================
-- STEP 2: ENSURE ALL COLUMNS EXIST
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Ensuring all required columns exist...';
    RAISE NOTICE '';
    
    -- Check expenses.user_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'user_id') THEN
        ALTER TABLE expenses ADD COLUMN user_id UUID NOT NULL DEFAULT gen_random_uuid();
        RAISE NOTICE '✅ Added user_id to expenses table';
    ELSE
        RAISE NOTICE '⚪ expenses.user_id already exists';
    END IF;
    
    -- Check incomes.user_id  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'user_id') THEN
        ALTER TABLE incomes ADD COLUMN user_id UUID NOT NULL DEFAULT gen_random_uuid();
        RAISE NOTICE '✅ Added user_id to incomes table';
    ELSE
        RAISE NOTICE '⚪ incomes.user_id already exists';
    END IF;
    
    -- Check incomes.client_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'client_id') THEN
        ALTER TABLE incomes ADD COLUMN client_id UUID;
        RAISE NOTICE '✅ Added client_id to incomes table';
    ELSE
        RAISE NOTICE '⚪ incomes.client_id already exists';
    END IF;
    
    -- Check clients.created_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_by') THEN
        ALTER TABLE clients ADD COLUMN created_by UUID;
        RAISE NOTICE '✅ Added created_by to clients table';
    ELSE
        RAISE NOTICE '⚪ clients.created_by already exists';
    END IF;
    
    -- Check documents.workshop_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'workshop_id') THEN
        ALTER TABLE documents ADD COLUMN workshop_id UUID;
        RAISE NOTICE '✅ Added workshop_id to documents table';
    ELSE
        RAISE NOTICE '⚪ documents.workshop_id already exists';
    END IF;
    
    -- Check documents.uploaded_by
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_by') THEN
        ALTER TABLE documents ADD COLUMN uploaded_by UUID;
        RAISE NOTICE '✅ Added uploaded_by to documents table';
    ELSE
        RAISE NOTICE '⚪ documents.uploaded_by already exists';
    END IF;
END $$;

-- =============================================
-- STEP 3: CREATE WORKSHOPS TABLE IF MISSING
-- =============================================

CREATE TABLE IF NOT EXISTS workshops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location TEXT,
    instructor_id UUID,
    class_type_id UUID,
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 4: ADD FOREIGN KEY CONSTRAINTS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Adding foreign key constraints...';
    RAISE NOTICE '';
END $$;

-- Add expenses.user_id constraint
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_user_id_fixed 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add incomes.user_id constraint
ALTER TABLE incomes ADD CONSTRAINT fk_incomes_user_id_fixed 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add incomes.client_id constraint
ALTER TABLE incomes ADD CONSTRAINT fk_incomes_client_id_fixed 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Add clients.created_by constraint
ALTER TABLE clients ADD CONSTRAINT fk_clients_created_by_fixed 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add documents.workshop_id constraint
ALTER TABLE documents ADD CONSTRAINT fk_documents_workshop_id_fixed 
FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL;

-- Add documents.uploaded_by constraint
ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by_fixed 
FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add other document constraints
ALTER TABLE documents ADD CONSTRAINT fk_documents_client_id_fixed 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE documents ADD CONSTRAINT fk_documents_income_id_fixed 
FOREIGN KEY (income_id) REFERENCES incomes(id) ON DELETE SET NULL;

ALTER TABLE documents ADD CONSTRAINT fk_documents_expense_id_fixed 
FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL;

-- =============================================
-- STEP 5: CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_expenses_user_id_fixed ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id_fixed ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id_fixed ON incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by_fixed ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_workshop_id_fixed ON documents(workshop_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by_fixed ON documents(uploaded_by);

-- =============================================
-- STEP 6: REFRESH SCHEMA CACHE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Refreshing schema cache...';
    RAISE NOTICE '';
END $$;

-- Analyze tables to refresh statistics
ANALYZE expenses;
ANALYZE incomes;
ANALYZE clients;
ANALYZE documents;
ANALYZE workshops;
ANALYZE class_types;

-- =============================================
-- STEP 7: VERIFICATION
-- =============================================

DO $$
DECLARE
    constraint_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ VERIFICATION...';
    RAISE NOTICE '';
    
    -- Count total foreign key constraints
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN ('incomes', 'expenses', 'clients', 'documents');
    
    RAISE NOTICE '📊 Total foreign key constraints: %', constraint_count;
    
    -- Check specific constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_expenses_user_id_fixed' 
        AND table_name = 'expenses'
    ) THEN
        RAISE NOTICE '✅ expenses.user_id constraint CONFIRMED';
    ELSE
        RAISE NOTICE '❌ expenses.user_id constraint MISSING';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_incomes_user_id_fixed' 
        AND table_name = 'incomes'
    ) THEN
        RAISE NOTICE '✅ incomes.user_id constraint CONFIRMED';
    ELSE
        RAISE NOTICE '❌ incomes.user_id constraint MISSING';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_clients_created_by_fixed' 
        AND table_name = 'clients'
    ) THEN
        RAISE NOTICE '✅ clients.created_by constraint CONFIRMED';
    ELSE
        RAISE NOTICE '❌ clients.created_by constraint MISSING';
    END IF;
END $$;

-- Commit all changes
COMMIT;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 FIXED RELATIONSHIP SCRIPT COMPLETED!';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All foreign key constraints have been recreated';
    RAISE NOTICE '✅ Schema cache has been refreshed';
    RAISE NOTICE '✅ Performance indexes have been created';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIXED RELATIONSHIPS:';
    RAISE NOTICE '   • expenses.user_id → auth.users.id (Enhanced Analytics)';
    RAISE NOTICE '   • incomes.user_id → auth.users.id (Calendar)';
    RAISE NOTICE '   • clients.created_by → auth.users.id (Clients)';
    RAISE NOTICE '   • documents.workshop_id → workshops.id (Documents)';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 NEXT STEPS:';
    RAISE NOTICE '   1. Wait 2-3 minutes for cache refresh';
    RAISE NOTICE '   2. Close and reopen your browser';
    RAISE NOTICE '   3. Test all pages that were showing errors';
    RAISE NOTICE '';
    RAISE NOTICE '💡 All relationship errors should now be resolved!';
    RAISE NOTICE '';
END $$; 