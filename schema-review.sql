-- Comprehensive Schema Review Script
-- This will show us the current state of your Workshop Tracker database

-- ===================================================================
-- TABLE STRUCTURES REVIEW
-- ===================================================================

-- Show all table columns and their properties
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name IN ('clients', 'documents', 'workshops', 'incomes', 'expenses', 'profiles')
ORDER BY t.table_name, c.ordinal_position;

-- ===================================================================
-- FOREIGN KEY CONSTRAINTS REVIEW
-- ===================================================================

-- Show all foreign key relationships
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ===================================================================
-- INDEXES REVIEW
-- ===================================================================

-- Show all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('clients', 'documents', 'workshops', 'incomes', 'expenses', 'profiles')
ORDER BY tablename, indexname;

-- ===================================================================
-- RLS POLICIES REVIEW
-- ===================================================================

-- Show all RLS policies
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

-- ===================================================================
-- DATA COUNTS
-- ===================================================================

-- Show current data counts in each table
SELECT 'clients' as table_name, COUNT(*) as row_count FROM public.clients
UNION ALL
SELECT 'documents' as table_name, COUNT(*) as row_count FROM public.documents
UNION ALL
SELECT 'workshops' as table_name, COUNT(*) as row_count FROM public.workshops
UNION ALL
SELECT 'incomes' as table_name, COUNT(*) as row_count FROM public.incomes
UNION ALL
SELECT 'expenses' as table_name, COUNT(*) as row_count FROM public.expenses
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM public.profiles
ORDER BY table_name; 