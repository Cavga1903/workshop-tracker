-- Corrected Seed Data Script for Workshop Tracker
-- This version first adds missing columns then inserts data

-- ===================================================================
-- FIRST: ADD MISSING COLUMNS TO TABLES
-- ===================================================================

-- Add missing columns to clients table
DO $$
BEGIN
    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'created_at') THEN
        ALTER TABLE public.clients ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at to clients table';
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'updated_at') THEN
        ALTER TABLE public.clients ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at to clients table';
    END IF;
    
    -- Add phone if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clients' AND column_name = 'phone') THEN
        ALTER TABLE public.clients ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone to clients table';
    END IF;
END $$;

-- Add missing columns to workshops table  
DO $$
BEGIN
    -- Add basic columns if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'title') THEN
        ALTER TABLE public.workshops ADD COLUMN title TEXT;
        RAISE NOTICE 'Added title to workshops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'description') THEN
        ALTER TABLE public.workshops ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description to workshops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'price') THEN
        ALTER TABLE public.workshops ADD COLUMN price DECIMAL(10,2);
        RAISE NOTICE 'Added price to workshops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'duration_minutes') THEN
        ALTER TABLE public.workshops ADD COLUMN duration_minutes INTEGER;
        RAISE NOTICE 'Added duration_minutes to workshops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'max_participants') THEN
        ALTER TABLE public.workshops ADD COLUMN max_participants INTEGER;
        RAISE NOTICE 'Added max_participants to workshops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'created_by') THEN
        ALTER TABLE public.workshops ADD COLUMN created_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added created_by to workshops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'created_at') THEN
        ALTER TABLE public.workshops ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at to workshops table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'updated_at') THEN
        ALTER TABLE public.workshops ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at to workshops table';
    END IF;
END $$;

-- ===================================================================
-- SEED DATA FOR CLIENTS
-- ===================================================================

DO $$
DECLARE
    current_user_id UUID;
BEGIN
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in auth.users table.';
    END IF;

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
    ('Lisa Wang', 'lisa.wang@email.com', '+1-555-0105', current_user_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 days')
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
    ('Beginner Pottery', 'Learn pottery basics', 75.00, 120, 8, current_user_id, NOW() - INTERVAL '35 days', NOW() - INTERVAL '30 days'),
    ('Advanced Ceramics', 'Advanced pottery techniques', 95.00, 150, 6, current_user_id, NOW() - INTERVAL '32 days', NOW() - INTERVAL '28 days'),
    ('Kids Art Workshop', 'Creative workshop for kids', 45.00, 90, 12, current_user_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days'),
    ('Adult Painting Class', 'Acrylic painting for adults', 60.00, 180, 10, current_user_id, NOW() - INTERVAL '28 days', NOW() - INTERVAL '22 days')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Inserted sample workshops';
END $$;

-- ===================================================================
-- FINAL SUMMARY
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SEED DATA COMPLETE ===';
    RAISE NOTICE 'Clients: % rows', (SELECT COUNT(*) FROM public.clients);
    RAISE NOTICE 'Workshops: % rows', (SELECT COUNT(*) FROM public.workshops);
    RAISE NOTICE 'Incomes: % rows', (SELECT COUNT(*) FROM public.incomes);
    RAISE NOTICE 'Expenses: % rows', (SELECT COUNT(*) FROM public.expenses);
END $$; 