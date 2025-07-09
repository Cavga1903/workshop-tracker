-- Workshop Tracker Database Migration Script
-- This script creates the new tables and modifies existing ones for the advanced features
-- IMPORTANT: Run this script in your Supabase SQL Editor

-- =============================================
-- 0. ENABLE REQUIRED EXTENSIONS
-- =============================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. VALIDATION AND CLEANUP
-- =============================================

-- Check if auth.users table exists (should always exist in Supabase)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE EXCEPTION 'auth.users table not found. This script requires Supabase Auth to be enabled.';
    END IF;
END $$;

-- =============================================
-- 2. CREATE CORE TABLES (NO DEPENDENCIES)
-- =============================================

-- Create class_types table first (no dependencies)
CREATE TABLE IF NOT EXISTS class_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    cost_per_person DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (if not exists)
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
-- 3. CREATE DEPENDENT TABLES
-- =============================================

-- Create clients table (depends on auth.users)
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
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workshops table (depends on auth.users and class_types)
CREATE TABLE IF NOT EXISTS workshops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location TEXT,
    instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    class_type_id UUID REFERENCES class_types(id) ON DELETE SET NULL,
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure incomes table has proper foreign key constraints
-- First check if table exists, if not create it
CREATE TABLE IF NOT EXISTS incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    platform TEXT,
    name TEXT NOT NULL,
    class_type TEXT,
    guest_count INTEGER DEFAULT 0,
    payment DECIMAL(10,2) NOT NULL,
    type TEXT,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    cost_per_guest DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure expenses table has proper foreign key constraints
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month TEXT NOT NULL,
    name TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    who_paid TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. ADD CLIENT_ID COLUMNS TO EXISTING TABLES
-- =============================================

-- Add client_id column to incomes table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'incomes' AND column_name = 'client_id') THEN
        ALTER TABLE incomes ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added client_id column to incomes table';
    ELSE
        RAISE NOTICE 'client_id column already exists in incomes table';
    END IF;
END $$;

-- Add client_id column to expenses table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'expenses' AND column_name = 'client_id') THEN
        ALTER TABLE expenses ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added client_id column to expenses table';
    ELSE
        RAISE NOTICE 'client_id column already exists in expenses table';
    END IF;
END $$;

-- =============================================
-- 5. CREATE FINAL DEPENDENT TABLES
-- =============================================

-- Create documents table (depends on all other tables)
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    workshop_id UUID REFERENCES workshops(id) ON DELETE SET NULL,
    income_id UUID REFERENCES incomes(id) ON DELETE SET NULL,
    expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    document_type TEXT CHECK (document_type IN ('invoice', 'receipt', 'contract', 'photo', 'other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workshop_participants table (depends on workshops and clients)
CREATE TABLE IF NOT EXISTS workshop_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
    payment_amount DECIMAL(10,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    attendance_status TEXT DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workshop_id, client_id)
);

-- Create email_notifications table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_type TEXT NOT NULL CHECK (record_type IN ('income', 'expense')),
    record_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    subject TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Indexes for incomes table
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_client_id ON incomes(client_id);

-- Indexes for expenses table
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);

-- Indexes for documents table
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_workshop_id ON documents(workshop_id);
CREATE INDEX IF NOT EXISTS idx_documents_income_id ON documents(income_id);
CREATE INDEX IF NOT EXISTS idx_documents_expense_id ON documents(expense_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);

-- Indexes for workshops table
CREATE INDEX IF NOT EXISTS idx_workshops_date ON workshops(date);
CREATE INDEX IF NOT EXISTS idx_workshops_instructor_id ON workshops(instructor_id);
CREATE INDEX IF NOT EXISTS idx_workshops_class_type_id ON workshops(class_type_id);
CREATE INDEX IF NOT EXISTS idx_workshops_created_by ON workshops(created_by);

-- Indexes for workshop_participants table
CREATE INDEX IF NOT EXISTS idx_workshop_participants_workshop_id ON workshop_participants(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_participants_client_id ON workshop_participants(client_id);

-- Indexes for clients table
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Indexes for email_notifications table
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_record_type ON email_notifications(record_type);

-- =============================================
-- 7. CREATE FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at column
DO $$
BEGIN
    -- Profiles table trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_profiles_updated_at') THEN
        CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON profiles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Incomes table trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_incomes_updated_at') THEN
        CREATE TRIGGER update_incomes_updated_at 
            BEFORE UPDATE ON incomes
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Expenses table trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_expenses_updated_at') THEN
        CREATE TRIGGER update_expenses_updated_at 
            BEFORE UPDATE ON expenses
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Class types table trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_class_types_updated_at') THEN
        CREATE TRIGGER update_class_types_updated_at 
            BEFORE UPDATE ON class_types
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Clients table trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at 
            BEFORE UPDATE ON clients
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- Workshops table trigger
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_workshops_updated_at') THEN
        CREATE TRIGGER update_workshops_updated_at 
            BEFORE UPDATE ON workshops
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Function to update client statistics
CREATE OR REPLACE FUNCTION update_client_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.client_id IS NOT NULL THEN
            UPDATE clients 
            SET 
                total_spent = (
                    SELECT COALESCE(SUM(payment), 0) 
                    FROM incomes 
                    WHERE client_id = NEW.client_id
                ),
                total_sessions = (
                    SELECT COUNT(*) 
                    FROM incomes 
                    WHERE client_id = NEW.client_id
                )
            WHERE id = NEW.client_id;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        IF OLD.client_id IS NOT NULL THEN
            UPDATE clients 
            SET 
                total_spent = (
                    SELECT COALESCE(SUM(payment), 0) 
                    FROM incomes 
                    WHERE client_id = OLD.client_id
                ),
                total_sessions = (
                    SELECT COUNT(*) 
                    FROM incomes 
                    WHERE client_id = OLD.client_id
                )
            WHERE id = OLD.client_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to update client stats when incomes change
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers 
                   WHERE trigger_name = 'update_client_stats_on_income_change') THEN
        CREATE TRIGGER update_client_stats_on_income_change
            AFTER INSERT OR UPDATE OR DELETE ON incomes
            FOR EACH ROW EXECUTE FUNCTION update_client_stats();
    END IF;
END $$;

-- =============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist to avoid conflicts
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
    
    CREATE POLICY "Users can view their own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admins can view all profiles" ON profiles
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
END $$;

-- Enable RLS for incomes table
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Incomes RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own incomes" ON incomes;
    DROP POLICY IF EXISTS "Users can create their own incomes" ON incomes;
    DROP POLICY IF EXISTS "Users can update their own incomes" ON incomes;
    DROP POLICY IF EXISTS "Users can delete their own incomes" ON incomes;
    
    CREATE POLICY "Users can view their own incomes" ON incomes
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own incomes" ON incomes
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own incomes" ON incomes
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own incomes" ON incomes
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Enable RLS for expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Expenses RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can create their own expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
    DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
    
    CREATE POLICY "Users can view their own expenses" ON expenses
        FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create their own expenses" ON expenses
        FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own expenses" ON expenses
        FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own expenses" ON expenses
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Enable RLS for class_types table
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;

-- Class types RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Everyone can view class types" ON class_types;
    DROP POLICY IF EXISTS "Only admins can manage class types" ON class_types;
    
    CREATE POLICY "Everyone can view class types" ON class_types
        FOR SELECT USING (true);

    CREATE POLICY "Only admins can manage class types" ON class_types
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
END $$;

-- Enable RLS for clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Clients RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view all clients" ON clients;
    DROP POLICY IF EXISTS "Users can create clients" ON clients;
    DROP POLICY IF EXISTS "Users can update clients they created" ON clients;
    DROP POLICY IF EXISTS "Admins can manage all clients" ON clients;
    
    CREATE POLICY "Users can view all clients" ON clients
        FOR SELECT USING (true);

    CREATE POLICY "Users can create clients" ON clients
        FOR INSERT WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Users can update clients they created" ON clients
        FOR UPDATE USING (auth.uid() = created_by);

    CREATE POLICY "Admins can manage all clients" ON clients
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
END $$;

-- Enable RLS for documents table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view documents they uploaded" ON documents;
    DROP POLICY IF EXISTS "Users can create documents" ON documents;
    DROP POLICY IF EXISTS "Users can delete documents they uploaded" ON documents;
    DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
    
    CREATE POLICY "Users can view documents they uploaded" ON documents
        FOR SELECT USING (auth.uid() = uploaded_by);

    CREATE POLICY "Users can create documents" ON documents
        FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

    CREATE POLICY "Users can delete documents they uploaded" ON documents
        FOR DELETE USING (auth.uid() = uploaded_by);

    CREATE POLICY "Admins can view all documents" ON documents
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
END $$;

-- Enable RLS for workshops table
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Workshops RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Everyone can view workshops" ON workshops;
    DROP POLICY IF EXISTS "Users can create workshops" ON workshops;
    DROP POLICY IF EXISTS "Users can update workshops they created" ON workshops;
    DROP POLICY IF EXISTS "Instructors can update their workshops" ON workshops;
    DROP POLICY IF EXISTS "Admins can manage all workshops" ON workshops;
    
    CREATE POLICY "Everyone can view workshops" ON workshops
        FOR SELECT USING (true);

    CREATE POLICY "Users can create workshops" ON workshops
        FOR INSERT WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Users can update workshops they created" ON workshops
        FOR UPDATE USING (auth.uid() = created_by);

    CREATE POLICY "Instructors can update their workshops" ON workshops
        FOR UPDATE USING (auth.uid() = instructor_id);

    CREATE POLICY "Admins can manage all workshops" ON workshops
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
END $$;

-- Enable RLS for workshop_participants table
ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;

-- Workshop participants RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Everyone can view workshop participants" ON workshop_participants;
    DROP POLICY IF EXISTS "Users can create workshop participants" ON workshop_participants;
    DROP POLICY IF EXISTS "Admins can manage all workshop participants" ON workshop_participants;
    
    CREATE POLICY "Everyone can view workshop participants" ON workshop_participants
        FOR SELECT USING (true);

    CREATE POLICY "Users can create workshop participants" ON workshop_participants
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM workshops 
                WHERE id = workshop_id AND (created_by = auth.uid() OR instructor_id = auth.uid())
            )
        );

    CREATE POLICY "Admins can manage all workshop participants" ON workshop_participants
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
END $$;

-- Enable RLS for email_notifications table
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Email notifications RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can view all email notifications" ON email_notifications;
    DROP POLICY IF EXISTS "System can insert email notifications" ON email_notifications;
    DROP POLICY IF EXISTS "Users can view their own notifications" ON email_notifications;
    
    CREATE POLICY "Admins can view all email notifications" ON email_notifications
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );

    CREATE POLICY "System can insert email notifications" ON email_notifications
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can view their own notifications" ON email_notifications
        FOR SELECT USING (user_id = auth.uid());
END $$;

-- =============================================
-- 9. CREATE STORAGE BUCKET AND POLICIES
-- =============================================

-- Create storage bucket for documents (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for documents bucket
DO $$
BEGIN
    -- Drop existing storage policies if they exist
    DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view their documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their documents" ON storage.objects;
    DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
    
    CREATE POLICY "Users can upload documents" ON storage.objects
        FOR INSERT WITH CHECK (
            bucket_id = 'documents' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );

    CREATE POLICY "Users can view their documents" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'documents' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );

    CREATE POLICY "Users can delete their documents" ON storage.objects
        FOR DELETE USING (
            bucket_id = 'documents' AND
            auth.uid()::text = (storage.foldername(name))[1]
        );

    CREATE POLICY "Admins can view all documents" ON storage.objects
        FOR SELECT USING (
            bucket_id = 'documents' AND
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
END $$;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
);

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 10. SAMPLE DATA (OPTIONAL)
-- =============================================

-- Insert sample class types (if none exist)
INSERT INTO class_types (name, cost_per_person, description) 
VALUES 
    ('Ceramic Workshop', 45.00, 'Hands-on pottery and ceramic creation'),
    ('Candle Making', 35.00, 'Create custom scented candles'),
    ('Jewelry Making', 50.00, 'Design and craft custom jewelry'),
    ('Painting Workshop', 40.00, 'Acrylic and watercolor painting sessions')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 11. VALIDATION AND COMPLETION
-- =============================================

-- Validate that all tables were created successfully
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    table_name TEXT;
BEGIN
    -- List of expected tables
    FOR table_name IN VALUES ('profiles'), ('incomes'), ('expenses'), ('clients'), ('workshops'), ('documents'), ('workshop_participants'), ('email_notifications'), ('class_types')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = table_name AND table_schema = 'public') THEN
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE WARNING 'The following tables were not created: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'All tables created successfully!';
    END IF;
END $$;

-- MIGRATION COMPLETE
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Workshop Tracker database migration completed successfully!';
    RAISE NOTICE 'New tables created: clients, workshops, documents, workshop_participants';
    RAISE NOTICE 'Modified tables: incomes, expenses (added client_id columns)';
    RAISE NOTICE 'Created indexes, triggers, and RLS policies';
    RAISE NOTICE 'Storage bucket "documents" created for file uploads';
    RAISE NOTICE 'Storage bucket "avatars" created for avatar images';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '';
END $$; 