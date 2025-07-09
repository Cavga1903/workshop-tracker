-- Check all foreign key constraints in the database
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('clients', 'incomes', 'expenses', 'documents')
ORDER BY tc.table_name, tc.constraint_name;

-- Also check if the specific columns exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name IN ('clients', 'incomes', 'expenses')
    AND column_name IN ('created_by', 'user_id', 'client_id')
ORDER BY table_name, column_name; 