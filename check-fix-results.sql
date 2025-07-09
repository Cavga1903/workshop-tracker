-- Verification script to check if the relationship fixes worked
-- This should show all the foreign key constraints we need

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM 
    information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.constraint_name IN (
        'expenses_user_id_fkey',
        'incomes_user_id_fkey', 
        'clients_created_by_fkey'
    )
ORDER BY tc.table_name;

-- Also check if the columns exist and have data
SELECT 'expenses' as table_name, COUNT(*) as total_rows, 
       COUNT(user_id) as rows_with_user_id
FROM public.expenses
UNION ALL
SELECT 'incomes' as table_name, COUNT(*) as total_rows,
       COUNT(user_id) as rows_with_user_id  
FROM public.incomes
UNION ALL
SELECT 'clients' as table_name, COUNT(*) as total_rows,
       COUNT(created_by) as rows_with_created_by
FROM public.clients; 