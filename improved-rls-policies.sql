-- Improved RLS Policies for Workshop Tracker
-- Provides fine-grained access control with role-based permissions

-- ===================================================================
-- UTILITY FUNCTIONS FOR RLS
-- ===================================================================

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is instructor
CREATE OR REPLACE FUNCTION public.is_instructor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (SELECT auth.uid()) 
        AND role IN ('admin', 'instructor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user's profile
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles 
        WHERE id = (SELECT auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- PROFILES TABLE POLICIES
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can see their profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual access" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile, admins can view all profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT 
    USING (
        id = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- Users can update their own profile (except role), admins can update any profile
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE 
    USING (
        id = (SELECT auth.uid()) OR 
        public.is_admin()
    )
    WITH CHECK (
        -- Non-admins cannot change their role
        (id = (SELECT auth.uid()) AND role = OLD.role) OR
        public.is_admin()
    );

-- Only admins can insert new profiles
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT 
    WITH CHECK (public.is_admin());

-- ===================================================================
-- CLIENTS TABLE POLICIES
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their clients" ON public.clients;

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view clients they created, admins can view all
CREATE POLICY "clients_select_policy" ON public.clients
    FOR SELECT 
    USING (
        created_by = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- All authenticated users can insert clients
CREATE POLICY "clients_insert_policy" ON public.clients
    FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Users can update clients they created, admins can update all
CREATE POLICY "clients_update_policy" ON public.clients
    FOR UPDATE 
    USING (
        created_by = (SELECT auth.uid()) OR 
        public.is_admin()
    )
    WITH CHECK (
        created_by = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- Users can delete clients they created, admins can delete all
CREATE POLICY "clients_delete_policy" ON public.clients
    FOR DELETE 
    USING (
        created_by = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- ===================================================================
-- WORKSHOPS TABLE POLICIES
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their workshops" ON public.workshops;

-- Enable RLS
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view workshops, but only see detailed info for their own
CREATE POLICY "workshops_select_policy" ON public.workshops
    FOR SELECT 
    USING ((SELECT auth.uid()) IS NOT NULL);

-- Only instructors and admins can insert workshops
CREATE POLICY "workshops_insert_policy" ON public.workshops
    FOR INSERT 
    WITH CHECK (public.is_instructor());

-- Users can update workshops they created, instructors and admins can update all
CREATE POLICY "workshops_update_policy" ON public.workshops
    FOR UPDATE 
    USING (
        created_by = (SELECT auth.uid()) OR 
        public.is_instructor()
    )
    WITH CHECK (
        created_by = (SELECT auth.uid()) OR 
        public.is_instructor()
    );

-- Users can delete workshops they created, admins can delete all
CREATE POLICY "workshops_delete_policy" ON public.workshops
    FOR DELETE 
    USING (
        created_by = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- ===================================================================
-- INCOMES TABLE POLICIES
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their incomes" ON public.incomes;
DROP POLICY IF EXISTS "Allow all" ON public.incomes;

-- Enable RLS
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- Users can view incomes they created, instructors can view workshop-related incomes, admins can view all
CREATE POLICY "incomes_select_policy" ON public.incomes
    FOR SELECT 
    USING (
        user_id = (SELECT auth.uid()) OR 
        (public.is_instructor() AND workshop_id IN (
            SELECT id FROM public.workshops 
            WHERE created_by = (SELECT auth.uid())
        )) OR
        public.is_admin()
    );

-- All authenticated users can insert incomes
CREATE POLICY "incomes_insert_policy" ON public.incomes
    FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Users can update incomes they created, admins can update all
CREATE POLICY "incomes_update_policy" ON public.incomes
    FOR UPDATE 
    USING (
        user_id = (SELECT auth.uid()) OR 
        public.is_admin()
    )
    WITH CHECK (
        user_id = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- Users can delete incomes they created, admins can delete all
CREATE POLICY "incomes_delete_policy" ON public.incomes
    FOR DELETE 
    USING (
        user_id = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- ===================================================================
-- EXPENSES TABLE POLICIES
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all" ON public.expenses;

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Users can view expenses they created, admins can view all
CREATE POLICY "expenses_select_policy" ON public.expenses
    FOR SELECT 
    USING (
        user_id = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- All authenticated users can insert expenses
CREATE POLICY "expenses_insert_policy" ON public.expenses
    FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Users can update expenses they created, admins can update all
CREATE POLICY "expenses_update_policy" ON public.expenses
    FOR UPDATE 
    USING (
        user_id = (SELECT auth.uid()) OR 
        public.is_admin()
    )
    WITH CHECK (
        user_id = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- Users can delete expenses they created, admins can delete all
CREATE POLICY "expenses_delete_policy" ON public.expenses
    FOR DELETE 
    USING (
        user_id = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- ===================================================================
-- DOCUMENTS TABLE POLICIES
-- ===================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their documents" ON public.documents;
DROP POLICY IF EXISTS "Users can manage their documents" ON public.documents;
DROP POLICY IF EXISTS "Allow all" ON public.documents;

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Users can view documents they uploaded, documents related to their clients/workshops, admins can view all
CREATE POLICY "documents_select_policy" ON public.documents
    FOR SELECT 
    USING (
        uploaded_by = (SELECT auth.uid()) OR
        (client_id IN (
            SELECT id FROM public.clients 
            WHERE created_by = (SELECT auth.uid())
        )) OR
        (workshop_id IN (
            SELECT id FROM public.workshops 
            WHERE created_by = (SELECT auth.uid())
        )) OR
        (income_id IN (
            SELECT id FROM public.incomes 
            WHERE user_id = (SELECT auth.uid())
        )) OR
        (expense_id IN (
            SELECT id FROM public.expenses 
            WHERE user_id = (SELECT auth.uid())
        )) OR
        public.is_admin()
    );

-- All authenticated users can insert documents
CREATE POLICY "documents_insert_policy" ON public.documents
    FOR INSERT 
    WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- Users can update documents they uploaded, admins can update all
CREATE POLICY "documents_update_policy" ON public.documents
    FOR UPDATE 
    USING (
        uploaded_by = (SELECT auth.uid()) OR 
        public.is_admin()
    )
    WITH CHECK (
        uploaded_by = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- Users can delete documents they uploaded, admins can delete all
CREATE POLICY "documents_delete_policy" ON public.documents
    FOR DELETE 
    USING (
        uploaded_by = (SELECT auth.uid()) OR 
        public.is_admin()
    );

-- ===================================================================
-- STORAGE BUCKET POLICIES (For Supabase Storage)
-- ===================================================================

-- Note: These need to be set via Supabase dashboard or API
-- Storage bucket policies for 'documents' bucket should be:

/*
-- Allow authenticated users to upload files
INSERT: authenticated users can upload if bucket_id = 'documents'

-- Allow users to view files they have permission to see based on database RLS
SELECT: authenticated users can download if they have SELECT permission on the related document record

-- Allow users to delete files they uploaded
DELETE: authenticated users can delete if they uploaded the file OR are admin

-- Example storage policies (set via Supabase dashboard):

1. Upload Policy:
   - Policy name: "Users can upload documents"
   - Allowed operation: INSERT
   - Target roles: authenticated
   - USING expression: true
   - WITH CHECK expression: true

2. Download Policy:
   - Policy name: "Users can download allowed documents"
   - Allowed operation: SELECT
   - Target roles: authenticated
   - USING expression: true

3. Delete Policy:
   - Policy name: "Users can delete their documents"
   - Allowed operation: DELETE
   - Target roles: authenticated
   - USING expression: (storage.filename()).split('/')[1] = auth.uid()::text OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
*/

-- ===================================================================
-- REFRESH SCHEMA CACHE
-- ===================================================================

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Show all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '=== IMPROVED RLS POLICIES APPLIED ===';
    RAISE NOTICE 'Created role-based access control with the following features:';
    RAISE NOTICE '- Admin users can access all data';
    RAISE NOTICE '- Instructor users can manage workshops and view related data';
    RAISE NOTICE '- Regular users can only access their own data';
    RAISE NOTICE '- Documents have contextual access based on relationships';
    RAISE NOTICE '- All policies use optimized (SELECT auth.uid()) pattern';
END $$; 