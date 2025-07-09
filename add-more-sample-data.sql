-- Additional Sample Data Script
-- Run this AFTER seed-data-corrected.sql to add more realistic data

-- ===================================================================
-- ADD MORE INCOME RECORDS
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
    client_ids UUID[];
    workshop_ids UUID[];
    i INTEGER;
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- Get existing client and workshop IDs
    SELECT array_agg(id) INTO client_ids FROM public.clients;
    SELECT array_agg(id) INTO workshop_ids FROM public.workshops;

    -- Only proceed if we have clients and workshops
    IF array_length(client_ids, 1) > 0 AND array_length(workshop_ids, 1) > 0 THEN
        -- Insert sample incomes (workshop payments)
        FOR i IN 1..20 LOOP
            INSERT INTO public.incomes (
                amount,
                description,
                income_date,
                client_id,
                workshop_id,
                user_id
            ) VALUES (
                (ARRAY[45.00, 60.00, 75.00, 95.00])[1 + (i % 4)], -- Rotate through workshop prices
                'Workshop payment - ' || (ARRAY['Beginner Pottery', 'Advanced Ceramics', 'Kids Art Workshop', 'Adult Painting Class'])[1 + (i % 4)],
                NOW() - INTERVAL (random() * 30)::TEXT || ' days',
                client_ids[1 + (i % array_length(client_ids, 1))],
                workshop_ids[1 + (i % array_length(workshop_ids, 1))],
                current_user_id
            );
        END LOOP;
        
        RAISE NOTICE 'Added % income records', 20;
    ELSE
        RAISE NOTICE 'No clients or workshops found - skipping income records';
    END IF;
END $$;

-- ===================================================================
-- ADD MORE EXPENSE RECORDS
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
    i INTEGER;
    expense_categories TEXT[] := ARRAY['Art Supplies', 'Studio Rent', 'Equipment', 'Marketing', 'Utilities'];
    expense_descriptions TEXT[] := ARRAY[
        'Clay and pottery supplies',
        'Monthly studio rental fee',
        'New pottery wheel',
        'Online advertising',
        'Electricity bill'
    ];
    expense_amounts DECIMAL[] := ARRAY[45.50, 800.00, 1200.00, 150.00, 125.00];
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;

    -- Insert sample expenses
    FOR i IN 1..15 LOOP
        INSERT INTO public.expenses (
            amount,
            description,
            category,
            expense_date,
            user_id
        ) VALUES (
            expense_amounts[1 + (i % array_length(expense_amounts, 1))] + (random() * 50 - 25), -- Add variation
            expense_descriptions[1 + (i % array_length(expense_descriptions, 1))],
            expense_categories[1 + (i % array_length(expense_categories, 1))],
            NOW() - INTERVAL (random() * 30)::TEXT || ' days',
            current_user_id
        );
    END LOOP;

    RAISE NOTICE 'Added % expense records', 15;
END $$;

-- ===================================================================
-- ADD SAMPLE DOCUMENTS
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
    client_ids UUID[];
    income_ids UUID[];
    expense_ids UUID[];
    workshop_ids UUID[];
    i INTEGER;
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- Get arrays of related IDs
    SELECT array_agg(id) INTO client_ids FROM public.clients LIMIT 3;
    SELECT array_agg(id) INTO income_ids FROM public.incomes LIMIT 5;
    SELECT array_agg(id) INTO expense_ids FROM public.expenses LIMIT 5;
    SELECT array_agg(id) INTO workshop_ids FROM public.workshops LIMIT 3;

    -- Insert sample documents
    FOR i IN 1..10 LOOP
        INSERT INTO public.documents (
            file_name,
            file_url,
            file_size,
            file_type,
            document_type,
            description,
            uploaded_by,
            client_id,
            income_id,
            expense_id,
            workshop_id
        ) VALUES (
            'sample_document_' || i || '.pdf',
            'https://example.com/storage/documents/sample_document_' || i || '.pdf',
            (random() * 500000 + 50000)::INTEGER, -- Random file size
            'application/pdf',
            (ARRAY['invoice', 'receipt', 'contract', 'other'])[1 + (i % 4)],
            'Sample document #' || i,
            current_user_id,
            CASE WHEN array_length(client_ids, 1) > 0 AND i % 3 = 0 THEN client_ids[1 + (i % array_length(client_ids, 1))] ELSE NULL END,
            CASE WHEN array_length(income_ids, 1) > 0 AND i % 4 = 0 THEN income_ids[1 + (i % array_length(income_ids, 1))] ELSE NULL END,
            CASE WHEN array_length(expense_ids, 1) > 0 AND i % 5 = 0 THEN expense_ids[1 + (i % array_length(expense_ids, 1))] ELSE NULL END,
            CASE WHEN array_length(workshop_ids, 1) > 0 AND i % 6 = 0 THEN workshop_ids[1 + (i % array_length(workshop_ids, 1))] ELSE NULL END
        );
    END LOOP;

    RAISE NOTICE 'Added % document records', 10;
END $$;

-- ===================================================================
-- FINAL SUMMARY
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '=== ADDITIONAL SAMPLE DATA COMPLETE ===';
    RAISE NOTICE 'Total Clients: %', (SELECT COUNT(*) FROM public.clients);
    RAISE NOTICE 'Total Workshops: %', (SELECT COUNT(*) FROM public.workshops);
    RAISE NOTICE 'Total Incomes: %', (SELECT COUNT(*) FROM public.incomes);
    RAISE NOTICE 'Total Expenses: %', (SELECT COUNT(*) FROM public.expenses);
    RAISE NOTICE 'Total Documents: %', (SELECT COUNT(*) FROM public.documents);
    RAISE NOTICE '';
    RAISE NOTICE 'Revenue: $%', COALESCE((SELECT SUM(amount) FROM public.incomes), 0);
    RAISE NOTICE 'Expenses: $%', COALESCE((SELECT SUM(amount) FROM public.expenses), 0);
    RAISE NOTICE 'Profit: $%', 
        COALESCE((SELECT SUM(amount) FROM public.incomes), 0) - 
        COALESCE((SELECT SUM(amount) FROM public.expenses), 0);
END $$; 