-- SAFE SCHEMA FIX FOR WORKSHOP TRACKER
-- This script safely adds missing columns and constraints without conflicts
-- Run this in your Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Start transaction
BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🔧 SAFE SCHEMA FIX - Starting...';
    RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 1: ADD MISSING COLUMNS ONLY
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Adding missing columns...';
    RAISE NOTICE '';
END $$;

-- Add missing columns to incomes table
DO $$
BEGIN
    -- Add client_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'client_id') THEN
        ALTER TABLE incomes ADD COLUMN client_id UUID;
        RAISE NOTICE '✅ Added client_id to incomes table';
    ELSE
        RAISE NOTICE '⚪ incomes.client_id already exists';
    END IF;
    
    -- Add profit if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'profit') THEN
        ALTER TABLE incomes ADD COLUMN profit DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added profit to incomes table';
    ELSE
        RAISE NOTICE '⚪ incomes.profit already exists';
    END IF;
    
    -- Add total_cost if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'total_cost') THEN
        ALTER TABLE incomes ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added total_cost to incomes table';
    ELSE
        RAISE NOTICE '⚪ incomes.total_cost already exists';
    END IF;
    
    -- Add cost_per_guest if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'cost_per_guest') THEN
        ALTER TABLE incomes ADD COLUMN cost_per_guest DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added cost_per_guest to incomes table';
    ELSE
        RAISE NOTICE '⚪ incomes.cost_per_guest already exists';
    END IF;
    
    -- Add shipping_cost if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'shipping_cost') THEN
        ALTER TABLE incomes ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added shipping_cost to incomes table';
    ELSE
        RAISE NOTICE '⚪ incomes.shipping_cost already exists';
    END IF;
END $$;

-- Add missing columns to expenses table
DO $$
BEGIN
    -- Add client_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'client_id') THEN
        ALTER TABLE expenses ADD COLUMN client_id UUID;
        RAISE NOTICE '✅ Added client_id to expenses table';
    ELSE
        RAISE NOTICE '⚪ expenses.client_id already exists';
    END IF;
END $$;

-- Add missing columns to clients table
DO $$
BEGIN
    -- Add created_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_by') THEN
        ALTER TABLE clients ADD COLUMN created_by UUID;
        RAISE NOTICE '✅ Added created_by to clients table';
    ELSE
        RAISE NOTICE '⚪ clients.created_by already exists';
    END IF;
    
    -- Ensure full_name exists (it should, but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') THEN
        ALTER TABLE clients ADD COLUMN full_name TEXT DEFAULT 'Unknown';
        RAISE NOTICE '✅ Added full_name to clients table';
    ELSE
        RAISE NOTICE '⚪ clients.full_name already exists';
    END IF;
    
    -- Change name column to full_name if name exists instead
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'name') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') THEN
        ALTER TABLE clients RENAME COLUMN name TO full_name;
        RAISE NOTICE '✅ Renamed clients.name to clients.full_name';
    END IF;
END $$;

-- Add missing columns to documents table
DO $$
BEGIN
    -- Add uploaded_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_by') THEN
        ALTER TABLE documents ADD COLUMN uploaded_by UUID;
        RAISE NOTICE '✅ Added uploaded_by to documents table';
    ELSE
        RAISE NOTICE '⚪ documents.uploaded_by already exists';
    END IF;
    
    -- Add workshop_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'workshop_id') THEN
        ALTER TABLE documents ADD COLUMN workshop_id UUID;
        RAISE NOTICE '✅ Added workshop_id to documents table';
    ELSE
        RAISE NOTICE '⚪ documents.workshop_id already exists';
    END IF;
    
    -- Add client_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'client_id') THEN
        ALTER TABLE documents ADD COLUMN client_id UUID;
        RAISE NOTICE '✅ Added client_id to documents table';
    ELSE
        RAISE NOTICE '⚪ documents.client_id already exists';
    END IF;
    
    -- Add income_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'income_id') THEN
        ALTER TABLE documents ADD COLUMN income_id UUID;
        RAISE NOTICE '✅ Added income_id to documents table';
    ELSE
        RAISE NOTICE '⚪ documents.income_id already exists';
    END IF;
    
    -- Add expense_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'expense_id') THEN
        ALTER TABLE documents ADD COLUMN expense_id UUID;
        RAISE NOTICE '✅ Added expense_id to documents table';
    ELSE
        RAISE NOTICE '⚪ documents.expense_id already exists';
    END IF;
END $$;

-- =============================================
-- STEP 2: CREATE MISSING TABLES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🏗️ Creating missing tables...';
    RAISE NOTICE '';
END $$;

-- Create workshops table if missing
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

-- Create profiles table if missing
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    phone_number TEXT,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: SAFELY ADD FOREIGN KEY CONSTRAINTS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔐 Adding missing foreign key constraints...';
    RAISE NOTICE '';
END $$;

-- Add incomes.user_id constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_incomes_user_id' 
        AND table_name = 'incomes'
    ) THEN
        ALTER TABLE incomes ADD CONSTRAINT fk_incomes_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added incomes.user_id foreign key';
    ELSE
        RAISE NOTICE '⚪ incomes.user_id foreign key already exists';
    END IF;
END $$;

-- Add incomes.client_id constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_incomes_client_id' 
        AND table_name = 'incomes'
    ) THEN
        ALTER TABLE incomes ADD CONSTRAINT fk_incomes_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added incomes.client_id foreign key';
    ELSE
        RAISE NOTICE '⚪ incomes.client_id foreign key already exists';
    END IF;
END $$;

-- Add expenses.user_id constraint if missing (this one was causing the error)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_expenses_user_id' 
        AND table_name = 'expenses'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT fk_expenses_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added expenses.user_id foreign key';
    ELSE
        RAISE NOTICE '⚪ expenses.user_id foreign key already exists';
    END IF;
END $$;

-- Add expenses.client_id constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_expenses_client_id' 
        AND table_name = 'expenses'
    ) THEN
        ALTER TABLE expenses ADD CONSTRAINT fk_expenses_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added expenses.client_id foreign key';
    ELSE
        RAISE NOTICE '⚪ expenses.client_id foreign key already exists';
    END IF;
END $$;

-- Add clients.created_by constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_clients_created_by' 
        AND table_name = 'clients'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT fk_clients_created_by 
        FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added clients.created_by foreign key';
    ELSE
        RAISE NOTICE '⚪ clients.created_by foreign key already exists';
    END IF;
END $$;

-- Add documents.uploaded_by constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_documents_uploaded_by' 
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added documents.uploaded_by foreign key';
    ELSE
        RAISE NOTICE '⚪ documents.uploaded_by foreign key already exists';
    END IF;
END $$;

-- Add documents.workshop_id constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_documents_workshop_id' 
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_workshop_id 
        FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added documents.workshop_id foreign key';
    ELSE
        RAISE NOTICE '⚪ documents.workshop_id foreign key already exists';
    END IF;
END $$;

-- Add documents.client_id constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_documents_client_id' 
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added documents.client_id foreign key';
    ELSE
        RAISE NOTICE '⚪ documents.client_id foreign key already exists';
    END IF;
END $$;

-- Add documents.income_id constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_documents_income_id' 
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_income_id 
        FOREIGN KEY (income_id) REFERENCES incomes(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added documents.income_id foreign key';
    ELSE
        RAISE NOTICE '⚪ documents.income_id foreign key already exists';
    END IF;
END $$;

-- Add documents.expense_id constraint if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_documents_expense_id' 
        AND table_name = 'documents'
    ) THEN
        ALTER TABLE documents ADD CONSTRAINT fk_documents_expense_id 
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Added documents.expense_id foreign key';
    ELSE
        RAISE NOTICE '⚪ documents.expense_id foreign key already exists';
    END IF;
END $$;

-- =============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚡ Creating performance indexes...';
    RAISE NOTICE '';
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);

CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_workshop_id ON documents(workshop_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_income_id ON documents(income_id);
CREATE INDEX IF NOT EXISTS idx_documents_expense_id ON documents(expense_id);

-- =============================================
-- STEP 5: REFRESH SCHEMA CACHE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Refreshing schema cache...';
    RAISE NOTICE '';
END $$;

-- Analyze tables to refresh statistics
ANALYZE incomes;
ANALYZE expenses;
ANALYZE clients;
ANALYZE documents;
ANALYZE workshops;
ANALYZE class_types;
ANALYZE profiles;

-- Commit transaction
COMMIT;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 SAFE SCHEMA FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All missing columns have been added safely';
    RAISE NOTICE '✅ All missing foreign key constraints have been added';
    RAISE NOTICE '✅ Performance indexes have been created';
    RAISE NOTICE '✅ Schema cache has been refreshed';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIXED ISSUES:';
    RAISE NOTICE '   • incomes.user_id → auth.users.id relationship';
    RAISE NOTICE '   • incomes.client_id column and relationship';
    RAISE NOTICE '   • clients.created_by → auth.users.id relationship';  
    RAISE NOTICE '   • clients.full_name column ensured';
    RAISE NOTICE '   • documents.workshop_id → workshops.id relationship';
    RAISE NOTICE '   • All other missing relationships';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '   1. Wait 1-2 minutes for cache refresh';
    RAISE NOTICE '   2. Hard refresh browser (Cmd+Shift+R)';
    RAISE NOTICE '   3. Test all pages:';
    RAISE NOTICE '      • Enhanced Analytics';
    RAISE NOTICE '      • Who Paid';
    RAISE NOTICE '      • Documents';
    RAISE NOTICE '      • Calendar';
    RAISE NOTICE '      • Clients';
    RAISE NOTICE '';
    RAISE NOTICE '💡 All relationships should now work correctly!';
    RAISE NOTICE '';
END $$; 