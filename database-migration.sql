-- Comprehensive Workshop Tracker Database Migration Script
-- Version 2.0 - Aligned with the current working Supabase schema.
-- This script is designed to be run in the Supabase SQL Editor.

-- ========= 1. EXTENSIONS =========
-- Enable UUID generation for primary keys.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========= 2. TABLES =========

-- Profiles table linked to Supabase's auth users.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  username text UNIQUE,
  avatar_url text,
  phone_number text,
  email text,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user.';

-- Class types for workshops.
CREATE TABLE IF NOT EXISTS public.class_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  cost_per_person numeric,
  created_at timestamp with time zone DEFAULT now(),
  description text, -- Retained from old schema for utility
  is_active boolean DEFAULT true -- Retained from old schema for utility
);
COMMENT ON TABLE public.class_types IS 'Defines the types of workshops available, e.g., Pottery, Painting.';

-- Client information.
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text DEFAULT 'Unknown'::text,
  name text,
  email text,
  phone text,
  company text,
  address text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.clients IS 'Stores information about clients or companies attending workshops.';

-- Workshops schedule and details.
CREATE TABLE IF NOT EXISTS public.workshops (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  date timestamp with time zone,
  class_type_id uuid REFERENCES public.class_types(id) ON DELETE SET NULL,
  instructor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.workshops IS 'Represents a scheduled workshop event.';

-- Expenses tracking.
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month text,
  name text,
  cost numeric,
  who_paid text,
  category text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.expenses IS 'Tracks all expenses related to workshops.';

-- Incomes tracking.
CREATE TABLE IF NOT EXISTS public.incomes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date timestamp with time zone NOT NULL,
  platform text,
  class_type text,
  guest_count integer,
  payment numeric,
  name text,
  type text,
  shipping_cost numeric,
  cost_per_guest numeric,
  total_cost numeric,
  profit numeric,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  class_type_id uuid REFERENCES public.class_types(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.incomes IS 'Tracks all income from workshops and other sources.';

-- Documents storage.
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name character varying,
  file_url text,
  file_size bigint,
  file_type character varying,
  description text,
  document_type character varying DEFAULT 'other'::character varying,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  workshop_id uuid REFERENCES public.workshops(id) ON DELETE SET NULL,
  income_id uuid REFERENCES public.incomes(id) ON DELETE SET NULL,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.documents IS 'Stores metadata for uploaded files like invoices or contracts.';


-- ========= 3. RLS (ROW LEVEL SECURITY) =========
-- Enable RLS for all tables to ensure data privacy.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for incomes and expenses (user-specific data)
CREATE POLICY "Users can manage their own records." ON public.incomes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own records." ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- Policies for documents
CREATE POLICY "Users can manage their own documents." ON public.documents FOR ALL USING (auth.uid() = uploaded_by);

-- Policies for shared data (class_types, clients, workshops)
-- Allow authenticated users to read shared data, but restrict modification to admins or creators.
CREATE POLICY "Authenticated users can view." ON public.class_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view." ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view." ON public.workshops FOR SELECT TO authenticated USING (true);

-- ========= 4. INDEXES FOR PERFORMANCE =========
-- Create indexes on frequently queried columns.
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);
CREATE INDEX IF NOT EXISTS idx_workshops_class_type_id ON public.workshops(class_type_id);
CREATE INDEX IF NOT EXISTS idx_workshops_instructor_id ON public.workshops(instructor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON public.incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_workshop_id ON public.documents(workshop_id);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);


-- ========= 5. FUNCTIONS & TRIGGERS =========
-- Function to automatically update the 'updated_at' timestamp.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for profiles table
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger for documents table
CREATE TRIGGER on_documents_updated
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Print completion message
SELECT 'Database migration script executed successfully.'; 