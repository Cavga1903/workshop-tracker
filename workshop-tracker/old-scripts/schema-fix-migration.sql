-- Schema Relationship Fix Migration Script
-- This script fixes the specific foreign key relationship errors mentioned in the issues
-- Run this in your Supabase SQL Editor to fix schema cache relationship errors

-- =============================================
-- SCHEMA RELATIONSHIP FIX MIGRATION
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Start transaction to ensure atomicity
BEGIN;

-- =============================================
-- 1. DROP EXISTING CONSTRAINTS (IF ANY)
-- =============================================

-- Drop existing foreign key constraints if they exist (to avoid conflicts)
DO $$
BEGIN
    -- Drop incomes.user_id constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'incomes_user_id_fkey' AND table_name = 'incomes') THEN
        ALTER TABLE incomes DROP CONSTRAINT incomes_user_id_fkey;
        RAISE NOTICE 'Dropped existing incomes.user_id foreign key constraint';
    END IF;

    -- Drop expenses.user_id constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'expenses_user_id_fkey' AND table_name = 'expenses') THEN
        ALTER TABLE expenses DROP CONSTRAINT expenses_user_id_fkey;
        RAISE NOTICE 'Dropped existing expenses.user_id foreign key constraint';
    END IF;

    -- Drop clients.created_by constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'clients_created_by_fkey' AND table_name = 'clients') THEN
        ALTER TABLE clients DROP CONSTRAINT clients_created_by_fkey;
        RAISE NOTICE 'Dropped existing clients.created_by foreign key constraint';
    END IF;

    -- Drop documents.workshop_id constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'documents_workshop_id_fkey' AND table_name = 'documents') THEN
        ALTER TABLE documents DROP CONSTRAINT documents_workshop_id_fkey;
        RAISE NOTICE 'Dropped existing documents.workshop_id foreign key constraint';
    END IF;
END $$;

-- =============================================
-- 2. ENSURE REQUIRED TABLES EXIST
-- =============================================

-- Ensure incomes table exists with correct structure
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    platform TEXT,
    name TEXT NOT NULL,
    class_type TEXT,
    guest_count INTEGER DEFAULT 0,
    payment DECIMAL(10,2) NOT NULL,
    type TEXT,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    cost_per_guest DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    profit DECIMAL(10,2) DEFAULT 0,
    client_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure expenses table exists with correct structure
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    month TEXT NOT NULL,
    name TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    who_paid TEXT NOT NULL,
    category TEXT NOT NULL,
    client_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure clients table exists with correct structure
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

-- Ensure workshops table exists
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

-- Ensure documents table exists with correct structure
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
-- 3. ADD MISSING COLUMNS (IF NEEDED)
-- =============================================

-- Add profit column to incomes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'incomes' AND column_name = 'profit') THEN
        ALTER TABLE incomes ADD COLUMN profit DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added profit column to incomes table';
    END IF;
END $$;

-- Add total_cost column to incomes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'incomes' AND column_name = 'total_cost') THEN
        ALTER TABLE incomes ADD COLUMN total_cost DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added total_cost column to incomes table';
    END IF;
END $$;

-- =============================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- =============================================

-- Add incomes.user_id → auth.users.id constraint
ALTER TABLE incomes 
ADD CONSTRAINT fk_incomes_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add expenses.user_id → auth.users.id constraint
ALTER TABLE expenses 
ADD CONSTRAINT fk_expenses_user_id 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Add clients.created_by → auth.users.id constraint
ALTER TABLE clients 
ADD CONSTRAINT fk_clients_created_by 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE SET NULL;

-- Add documents.workshop_id → workshops.id constraint
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_workshop_id 
FOREIGN KEY (workshop_id) 
REFERENCES workshops(id) 
ON DELETE SET NULL;

-- Add additional helpful constraints
ALTER TABLE documents 
ADD CONSTRAINT fk_documents_uploaded_by 
FOREIGN KEY (uploaded_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE incomes 
ADD CONSTRAINT fk_incomes_client_id 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE SET NULL;

ALTER TABLE expenses 
ADD CONSTRAINT fk_expenses_client_id 
FOREIGN KEY (client_id) 
REFERENCES clients(id) 
ON DELETE SET NULL;

-- =============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Create indexes on foreign key columns
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON incomes(client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month);

CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

CREATE INDEX IF NOT EXISTS idx_documents_workshop_id ON documents(workshop_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);

CREATE INDEX IF NOT EXISTS idx_workshops_instructor_id ON workshops(instructor_id);
CREATE INDEX IF NOT EXISTS idx_workshops_date ON workshops(date);

-- =============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for incomes
DROP POLICY IF EXISTS "Users can manage their own incomes" ON incomes;
CREATE POLICY "Users can manage their own incomes" ON incomes
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for expenses
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;
CREATE POLICY "Users can manage their own expenses" ON expenses
    FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for clients
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can manage clients they created" ON clients;
CREATE POLICY "Users can view all clients" ON clients
    FOR SELECT USING (true);
CREATE POLICY "Users can manage clients they created" ON clients
    FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update clients they created" ON clients
    FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for documents
DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
CREATE POLICY "Users can manage their own documents" ON documents
    FOR ALL USING (auth.uid() = uploaded_by);

-- Create RLS policies for workshops
DROP POLICY IF EXISTS "Users can view workshops" ON workshops;
DROP POLICY IF EXISTS "Users can manage workshops they created" ON workshops;
CREATE POLICY "Users can view workshops" ON workshops
    FOR SELECT USING (true);
CREATE POLICY "Users can manage workshops they created" ON workshops
    FOR INSERT WITH CHECK (auth.uid() = created_by OR auth.uid() = instructor_id);
CREATE POLICY "Users can update workshops they created" ON workshops
    FOR UPDATE USING (auth.uid() = created_by OR auth.uid() = instructor_id);

-- =============================================
-- 7. REFRESH SCHEMA CACHE
-- =============================================

-- Update table statistics to help with schema cache
ANALYZE incomes;
ANALYZE expenses;
ANALYZE clients;
ANALYZE documents;
ANALYZE workshops;

-- Commit the transaction
COMMIT;

-- =============================================
-- 8. VERIFICATION QUERIES
-- =============================================

-- Verify foreign key constraints exist
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('incomes', 'expenses', 'clients', 'documents', 'workshops')
ORDER BY tc.table_name, tc.constraint_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Schema relationship fix migration completed successfully!';
    RAISE NOTICE '📊 All foreign key constraints have been applied';
    RAISE NOTICE '🔒 Row Level Security policies have been updated';
    RAISE NOTICE '⚡ Indexes have been created for performance';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '1. Verify that Enhanced Analytics page works correctly';
    RAISE NOTICE '2. Check that Calendar page loads without errors';
    RAISE NOTICE '3. Test Clients page functionality';
    RAISE NOTICE '4. Verify Documents page works properly';
    RAISE NOTICE '';
    RAISE NOTICE '💡 If you still see relationship errors, try refreshing your browser or restarting your Supabase instance.';
END $$; 