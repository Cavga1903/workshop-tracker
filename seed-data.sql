-- Comprehensive Seed Data Script for Workshop Tracker
-- This creates realistic test data for development and testing

-- ===================================================================
-- SEED DATA FOR CLIENTS
-- ===================================================================

-- First, get the current user ID to use as created_by
DO $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in auth.users table. Please ensure you have at least one authenticated user.';
    END IF;

    -- Insert sample clients
    INSERT INTO public.clients (
        full_name, 
        email, 
        phone, 
        created_by,
        created_at,
        updated_at
    ) VALUES 
    ('Sarah Johnson', 'sarah.johnson@email.com', '+1-555-0101', current_user_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days'),
    ('Michael Chen', 'michael.chen@email.com', '+1-555-0102', current_user_id, NOW() - INTERVAL '28 days', NOW() - INTERVAL '20 days'),
    ('Emily Rodriguez', 'emily.rodriguez@email.com', '+1-555-0103', current_user_id, NOW() - INTERVAL '25 days', NOW() - INTERVAL '15 days'),
    ('David Thompson', 'david.thompson@email.com', '+1-555-0104', current_user_id, NOW() - INTERVAL '22 days', NOW() - INTERVAL '10 days'),
    ('Lisa Wang', 'lisa.wang@email.com', '+1-555-0105', current_user_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 days'),
    ('James Miller', 'james.miller@email.com', '+1-555-0106', current_user_id, NOW() - INTERVAL '18 days', NOW() - INTERVAL '5 days'),
    ('Maria Garcia', 'maria.garcia@email.com', '+1-555-0107', current_user_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
    ('Robert Kim', 'robert.kim@email.com', '+1-555-0108', current_user_id, NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),
    ('Anna Petrov', 'anna.petrov@email.com', '+1-555-0109', current_user_id, NOW() - INTERVAL '10 days', NOW()),
    ('Carlos Santos', 'carlos.santos@email.com', '+1-555-0110', current_user_id, NOW() - INTERVAL '8 days', NOW())
    ON CONFLICT (email) DO NOTHING;

    RAISE NOTICE 'Inserted sample clients';
END $$;

-- ===================================================================
-- SEED DATA FOR WORKSHOPS
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;

    -- Insert sample workshops/class types
    INSERT INTO public.workshops (
        title,
        description,
        price,
        duration_minutes,
        max_participants,
        created_by,
        created_at,
        updated_at
    ) VALUES 
    ('Beginner Pottery', 'Learn the basics of pottery making including wheel throwing and hand building techniques.', 75.00, 120, 8, current_user_id, NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days'),
    ('Advanced Ceramics', 'Advanced techniques for experienced potters including glazing and firing methods.', 95.00, 150, 6, current_user_id, NOW() - INTERVAL '32 days', NOW() - INTERVAL '28 days'),
    ('Kids Art Workshop', 'Creative art workshop designed for children ages 6-12. Includes painting and crafting.', 45.00, 90, 12, current_user_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days'),
    ('Adult Painting Class', 'Acrylic painting workshop for adults. All skill levels welcome.', 60.00, 180, 10, current_user_id, NOW() - INTERVAL '28 days', NOW() - INTERVAL '22 days'),
    ('Sculpture Fundamentals', 'Introduction to sculpture using various materials and techniques.', 85.00, 150, 8, current_user_id, NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days'),
    ('Watercolor Techniques', 'Master watercolor painting with professional tips and techniques.', 70.00, 120, 10, current_user_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
    ('Digital Art Basics', 'Learn digital art creation using tablets and professional software.', 80.00, 120, 8, current_user_id, NOW() - INTERVAL '18 days', NOW() - INTERVAL '12 days'),
    ('Jewelry Making', 'Create beautiful jewelry pieces using various metals and stones.', 90.00, 180, 6, current_user_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Inserted sample workshops';
END $$;

-- ===================================================================
-- SEED DATA FOR INCOMES
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
    client_ids UUID[];
    workshop_ids UUID[];
    i INTEGER;
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- Get arrays of client and workshop IDs
    SELECT array_agg(id) INTO client_ids FROM public.clients LIMIT 10;
    SELECT array_agg(id) INTO workshop_ids FROM public.workshops LIMIT 8;

    -- Insert sample incomes (workshop payments)
    FOR i IN 1..25 LOOP
        INSERT INTO public.incomes (
            amount,
            description,
            income_date,
            client_id,
            workshop_id,
            user_id,
            created_at,
            updated_at
        ) VALUES (
            (ARRAY[45.00, 60.00, 70.00, 75.00, 80.00, 85.00, 90.00, 95.00])[1 + (i % 8)], -- Rotate through workshop prices
            'Workshop payment for ' || (ARRAY['Beginner Pottery', 'Advanced Ceramics', 'Kids Art Workshop', 'Adult Painting Class', 'Sculpture Fundamentals', 'Watercolor Techniques', 'Digital Art Basics', 'Jewelry Making'])[1 + (i % 8)],
            NOW() - INTERVAL (random() * 30)::TEXT || ' days',
            client_ids[1 + (i % array_length(client_ids, 1))],
            workshop_ids[1 + (i % array_length(workshop_ids, 1))],
            current_user_id,
            NOW() - INTERVAL (random() * 30)::TEXT || ' days',
            NOW() - INTERVAL (random() * 30)::TEXT || ' days'
        );
    END LOOP;

    RAISE NOTICE 'Inserted sample incomes';
END $$;

-- ===================================================================
-- SEED DATA FOR EXPENSES
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
    i INTEGER;
    expense_categories TEXT[] := ARRAY['Art Supplies', 'Studio Rent', 'Equipment', 'Marketing', 'Utilities', 'Insurance', 'Maintenance', 'Software'];
    expense_descriptions TEXT[] := ARRAY[
        'Clay and pottery supplies',
        'Monthly studio rental fee',
        'New pottery wheel purchase',
        'Instagram advertising campaign',
        'Electricity and water bill',
        'Business liability insurance',
        'Kiln maintenance and repair',
        'Adobe Creative Suite subscription'
    ];
    expense_amounts DECIMAL[] := ARRAY[45.50, 800.00, 1200.00, 150.00, 125.00, 85.00, 200.00, 52.99];
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;

    -- Insert sample expenses
    FOR i IN 1..20 LOOP
        INSERT INTO public.expenses (
            amount,
            description,
            category,
            expense_date,
            user_id,
            created_at,
            updated_at
        ) VALUES (
            expense_amounts[1 + (i % array_length(expense_amounts, 1))] + (random() * 50 - 25), -- Add some variation
            expense_descriptions[1 + (i % array_length(expense_descriptions, 1))],
            expense_categories[1 + (i % array_length(expense_categories, 1))],
            NOW() - INTERVAL (random() * 30)::TEXT || ' days',
            current_user_id,
            NOW() - INTERVAL (random() * 30)::TEXT || ' days',
            NOW() - INTERVAL (random() * 30)::TEXT || ' days'
        );
    END LOOP;

    RAISE NOTICE 'Inserted sample expenses';
END $$;

-- ===================================================================
-- SEED DATA FOR DOCUMENTS
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
    client_ids UUID[];
    income_ids UUID[];
    expense_ids UUID[];
    workshop_ids UUID[];
    i INTEGER;
    doc_types TEXT[] := ARRAY['invoice', 'receipt', 'contract', 'photo', 'other'];
    doc_names TEXT[] := ARRAY[
        'workshop_invoice_001.pdf',
        'art_supplies_receipt.pdf',
        'student_contract.pdf',
        'workshop_photo_session.jpg',
        'insurance_policy.pdf',
        'equipment_receipt.pdf',
        'pottery_wheel_manual.pdf',
        'marketing_materials.png'
    ];
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- Get arrays of related IDs
    SELECT array_agg(id) INTO client_ids FROM public.clients LIMIT 5;
    SELECT array_agg(id) INTO income_ids FROM public.incomes LIMIT 10;
    SELECT array_agg(id) INTO expense_ids FROM public.expenses LIMIT 10;
    SELECT array_agg(id) INTO workshop_ids FROM public.workshops LIMIT 5;

    -- Insert sample documents
    FOR i IN 1..15 LOOP
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
            workshop_id,
            created_at,
            updated_at
        ) VALUES (
            doc_names[1 + (i % array_length(doc_names, 1))],
            'https://example.com/storage/documents/' || doc_names[1 + (i % array_length(doc_names, 1))],
            (random() * 1000000 + 50000)::INTEGER, -- Random file size between 50KB and 1MB
            CASE 
                WHEN doc_names[1 + (i % array_length(doc_names, 1))] LIKE '%.pdf' THEN 'application/pdf'
                WHEN doc_names[1 + (i % array_length(doc_names, 1))] LIKE '%.jpg' THEN 'image/jpeg'
                WHEN doc_names[1 + (i % array_length(doc_names, 1))] LIKE '%.png' THEN 'image/png'
                ELSE 'application/octet-stream'
            END,
            doc_types[1 + (i % array_length(doc_types, 1))],
            'Sample document for testing purposes',
            current_user_id,
            CASE WHEN i % 3 = 0 THEN client_ids[1 + (i % array_length(client_ids, 1))] ELSE NULL END,
            CASE WHEN i % 4 = 0 THEN income_ids[1 + (i % array_length(income_ids, 1))] ELSE NULL END,
            CASE WHEN i % 5 = 0 THEN expense_ids[1 + (i % array_length(expense_ids, 1))] ELSE NULL END,
            CASE WHEN i % 6 = 0 THEN workshop_ids[1 + (i % array_length(workshop_ids, 1))] ELSE NULL END,
            NOW() - INTERVAL (random() * 30)::TEXT || ' days',
            NOW() - INTERVAL (random() * 30)::TEXT || ' days'
        );
    END LOOP;

    RAISE NOTICE 'Inserted sample documents';
END $$;

-- ===================================================================
-- FINAL SUMMARY
-- ===================================================================

-- Show final data counts
DO $$
BEGIN
    RAISE NOTICE '=== SEED DATA INSERTION COMPLETE ===';
    RAISE NOTICE 'Clients: % rows', (SELECT COUNT(*) FROM public.clients);
    RAISE NOTICE 'Workshops: % rows', (SELECT COUNT(*) FROM public.workshops);
    RAISE NOTICE 'Incomes: % rows', (SELECT COUNT(*) FROM public.incomes);
    RAISE NOTICE 'Expenses: % rows', (SELECT COUNT(*) FROM public.expenses);
    RAISE NOTICE 'Documents: % rows', (SELECT COUNT(*) FROM public.documents);
    RAISE NOTICE 'Total Revenue: $%', (SELECT COALESCE(SUM(amount), 0) FROM public.incomes);
    RAISE NOTICE 'Total Expenses: $%', (SELECT COALESCE(SUM(amount), 0) FROM public.expenses);
    RAISE NOTICE 'Net Profit: $%', (SELECT COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) FROM public.incomes i FULL OUTER JOIN public.expenses e ON 1=1);
END $$; 