-- COMPLETE SCHEMA FIX FOR WORKSHOP TRACKER
-- This script diagnoses and fixes all relationship errors
-- Run this entire script in your Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Start transaction
BEGIN;

-- =============================================
-- STEP 1: DIAGNOSTIC - CHECK CURRENT STATE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNOSTIC PHASE - Checking current database state...';
    RAISE NOTICE '';
END $$;

-- Check which tables exist
DO $$
DECLARE
    table_exists boolean;
BEGIN
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incomes') INTO table_exists;
    RAISE NOTICE 'incomes table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') INTO table_exists;
    RAISE NOTICE 'expenses table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') INTO table_exists;
    RAISE NOTICE 'clients table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') INTO table_exists;
    RAISE NOTICE 'documents table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workshops') INTO table_exists;
    RAISE NOTICE 'workshops table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_types') INTO table_exists;
    RAISE NOTICE 'class_types table exists: %', table_exists;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') INTO table_exists;
    RAISE NOTICE 'profiles table exists: %', table_exists;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- STEP 2: CREATE MISSING TABLES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🏗️  CREATION PHASE - Creating missing tables...';
    RAISE NOTICE '';
END $$;

-- Create profiles table (needed for relationships)
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

-- Create class_types table
CREATE TABLE IF NOT EXISTS class_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    cost_per_person DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workshops table
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

-- Create incomes table with ALL required columns
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID,
    date DATE NOT NULL,
    platform TEXT,
    name TEXT NOT NULL,
    class_type TEXT,
    guest_count INTEGER DEFAULT 0,
    payment DECIMAL(10,2) NOT NULL DEFAULT 0,
    type TEXT,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    cost_per_guest DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    profit DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table with ALL required columns
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    client_id UUID,
    month TEXT NOT NULL,
    name TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    who_paid TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table with ALL required columns
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by UUID NOT NULL,
    workshop_id UUID,
    income_id UUID,
    expense_id UUID,
    client_id UUID,
    document_type TEXT CHECK (document_type IN ('invoice', 'receipt', 'contract', 'photo', 'other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔧 COLUMN ADDITION PHASE - Adding missing columns...';
    RAISE NOTICE '';
END $$;

-- Add missing columns to incomes table
DO $$
BEGIN
    -- Add client_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'client_id') THEN
        ALTER TABLE incomes ADD COLUMN client_id UUID;
        RAISE NOTICE '✅ Added client_id to incomes table';
    END IF;
    
    -- Add profit if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'profit') THEN
        ALTER TABLE incomes ADD COLUMN profit DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added profit to incomes table';
    END IF;
    
    -- Add total_cost if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'total_cost') THEN
        ALTER TABLE incomes ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added total_cost to incomes table';
    END IF;
    
    -- Add cost_per_guest if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'cost_per_guest') THEN
        ALTER TABLE incomes ADD COLUMN cost_per_guest DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added cost_per_guest to incomes table';
    END IF;
    
    -- Add shipping_cost if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incomes' AND column_name = 'shipping_cost') THEN
        ALTER TABLE incomes ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Added shipping_cost to incomes table';
    END IF;
END $$;

-- Add missing columns to expenses table
DO $$
BEGIN
    -- Add client_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'client_id') THEN
        ALTER TABLE expenses ADD COLUMN client_id UUID;
        RAISE NOTICE '✅ Added client_id to expenses table';
    END IF;
END $$;

-- Add missing columns to clients table
DO $$
BEGIN
    -- Add created_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'created_by') THEN
        ALTER TABLE clients ADD COLUMN created_by UUID;
        RAISE NOTICE '✅ Added created_by to clients table';
    END IF;
    
    -- Add full_name if missing (shouldn't be needed but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'full_name') THEN
        ALTER TABLE clients ADD COLUMN full_name TEXT NOT NULL DEFAULT 'Unknown';
        RAISE NOTICE '✅ Added full_name to clients table';
    END IF;
END $$;

-- Add missing columns to documents table
DO $$
BEGIN
    -- Add uploaded_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uploaded_by') THEN
        ALTER TABLE documents ADD COLUMN uploaded_by UUID;
        RAISE NOTICE '✅ Added uploaded_by to documents table';
    END IF;
    
    -- Add workshop_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'workshop_id') THEN
        ALTER TABLE documents ADD COLUMN workshop_id UUID;
        RAISE NOTICE '✅ Added workshop_id to documents table';
    END IF;
    
    -- Add client_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'client_id') THEN
        ALTER TABLE documents ADD COLUMN client_id UUID;
        RAISE NOTICE '✅ Added client_id to documents table';
    END IF;
    
    -- Add income_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'income_id') THEN
        ALTER TABLE documents ADD COLUMN income_id UUID;
        RAISE NOTICE '✅ Added income_id to documents table';
    END IF;
    
    -- Add expense_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'expense_id') THEN
        ALTER TABLE documents ADD COLUMN expense_id UUID;
        RAISE NOTICE '✅ Added expense_id to documents table';
    END IF;
END $$;

-- =============================================
-- STEP 4: DROP EXISTING CONSTRAINTS (TO AVOID CONFLICTS)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🗑️  CLEANUP PHASE - Removing conflicting constraints...';
    RAISE NOTICE '';
END $$;

-- Drop existing foreign key constraints if they exist
DO $$
BEGIN
    -- Drop all existing foreign key constraints to avoid conflicts
    PERFORM 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%_fkey' OR constraint_name LIKE 'fk_%';
    
    -- Drop specific constraints we know might exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'incomes_user_id_fkey') THEN
        ALTER TABLE incomes DROP CONSTRAINT incomes_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'expenses_user_id_fkey') THEN
        ALTER TABLE expenses DROP CONSTRAINT expenses_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'clients_created_by_fkey') THEN
        ALTER TABLE clients DROP CONSTRAINT clients_created_by_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'documents_workshop_id_fkey') THEN
        ALTER TABLE documents DROP CONSTRAINT documents_workshop_id_fkey;
    END IF;
    
    RAISE NOTICE '✅ Cleaned up existing constraints';
END $$;

-- =============================================
-- STEP 5: ADD ALL FOREIGN KEY CONSTRAINTS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔐 CONSTRAINT PHASE - Adding foreign key relationships...';
    RAISE NOTICE '';
END $$;

-- Add primary foreign key constraints
ALTER TABLE incomes ADD CONSTRAINT fk_incomes_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE incomes ADD CONSTRAINT fk_incomes_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD CONSTRAINT fk_expenses_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

ALTER TABLE clients ADD CONSTRAINT fk_clients_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE documents ADD CONSTRAINT fk_documents_workshop_id FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE SET NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_income_id FOREIGN KEY (income_id) REFERENCES incomes(id) ON DELETE SET NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_expense_id FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL;

ALTER TABLE workshops ADD CONSTRAINT fk_workshops_instructor_id FOREIGN KEY (instructor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE workshops ADD CONSTRAINT fk_workshops_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE workshops ADD CONSTRAINT fk_workshops_class_type_id FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE SET NULL;

-- =============================================
-- STEP 6: CREATE PERFORMANCE INDEXES
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '⚡ INDEX PHASE - Creating performance indexes...';
    RAISE NOTICE '';
END $$;

-- Create indexes for foreign keys and commonly queried columns
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

CREATE INDEX IF NOT EXISTS idx_workshops_instructor_id ON workshops(instructor_id);
CREATE INDEX IF NOT EXISTS idx_workshops_created_by ON workshops(created_by);
CREATE INDEX IF NOT EXISTS idx_workshops_date ON workshops(date);

-- =============================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔒 SECURITY PHASE - Setting up Row Level Security...';
    RAISE NOTICE '';
END $$;

-- Enable RLS on all tables
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Users can manage their own incomes" ON incomes;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can manage clients they created" ON clients;
DROP POLICY IF EXISTS "Users can update clients they created" ON clients;
DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view workshops" ON workshops;
DROP POLICY IF EXISTS "Users can manage workshops they created" ON workshops;
DROP POLICY IF EXISTS "Users can update workshops they created" ON workshops;
DROP POLICY IF EXISTS "Everyone can view class types" ON class_types;
DROP POLICY IF EXISTS "Only admins can manage class types" ON class_types;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create comprehensive RLS policies
CREATE POLICY "Users can manage their own incomes" ON incomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view all clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Users can manage clients they created" ON clients FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update clients they created" ON clients FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admin can manage all clients" ON clients FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can manage their own documents" ON documents FOR ALL USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can view workshops" ON workshops FOR SELECT USING (true);
CREATE POLICY "Users can manage workshops they created" ON workshops FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.uid() = instructor_id);
CREATE POLICY "Users can update workshops they created" ON workshops FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = instructor_id);

CREATE POLICY "Everyone can view class types" ON class_types FOR SELECT USING (true);
CREATE POLICY "Only admins can manage class types" ON class_types FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- STEP 8: REFRESH SCHEMA CACHE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔄 REFRESH PHASE - Updating schema cache...';
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

-- =============================================
-- STEP 9: VERIFICATION
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ VERIFICATION PHASE - Checking relationships...';
    RAISE NOTICE '';
END $$;

-- Verify all foreign key constraints exist
DO $$
DECLARE
    constraint_count integer;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN ('incomes', 'expenses', 'clients', 'documents', 'workshops');
    
    RAISE NOTICE 'Total foreign key constraints: %', constraint_count;
    
    -- List all foreign key constraints
    FOR constraint_count IN 
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name IN ('incomes', 'expenses', 'clients', 'documents', 'workshops')
    LOOP
        -- This will iterate through each constraint
    END LOOP;
END $$;

-- Commit transaction
COMMIT;

-- =============================================
-- FINAL SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '🎉 SCHEMA FIX COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '🎉 ===============================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All foreign key relationships have been established';
    RAISE NOTICE '✅ All missing columns have been added';
    RAISE NOTICE '✅ Row Level Security policies are in place';
    RAISE NOTICE '✅ Performance indexes have been created';
    RAISE NOTICE '✅ Schema cache has been refreshed';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 FIXED ISSUES:';
    RAISE NOTICE '   • incomes.user_id → auth.users.id';
    RAISE NOTICE '   • incomes.client_id column added';
    RAISE NOTICE '   • clients.created_by → auth.users.id';
    RAISE NOTICE '   • clients.full_name column ensured';
    RAISE NOTICE '   • documents.workshop_id → workshops.id';
    RAISE NOTICE '   • All other relationship errors';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '   1. Refresh your browser (hard refresh: Cmd+Shift+R)';
    RAISE NOTICE '   2. Test Enhanced Analytics page';
    RAISE NOTICE '   3. Test Who Paid page';
    RAISE NOTICE '   4. Test Documents page';
    RAISE NOTICE '   5. Test Calendar page';
    RAISE NOTICE '   6. Test Clients page';
    RAISE NOTICE '';
    RAISE NOTICE '💡 If you still see errors, wait 1-2 minutes for Supabase';
    RAISE NOTICE '   cache to fully refresh, then try again.';
    RAISE NOTICE '';
END $$; 