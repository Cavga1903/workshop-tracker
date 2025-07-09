-- Schema Optimization Suggestions for Workshop Tracker
-- This script provides recommendations for improving database performance and structure

-- ===================================================================
-- PERFORMANCE OPTIMIZATION SUGGESTIONS
-- ===================================================================

-- 1. Add composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incomes_user_date 
ON public.incomes(user_id, income_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_user_date 
ON public.expenses(user_id, expense_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incomes_workshop_date 
ON public.incomes(workshop_id, income_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_type_uploaded 
ON public.documents(document_type, uploaded_by);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_clients_email_lower 
ON public.clients(LOWER(email));

-- 2. Add partial indexes for common filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_incomes_recent 
ON public.incomes(user_id, amount) 
WHERE income_date >= CURRENT_DATE - INTERVAL '90 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_recent 
ON public.expenses(user_id, amount) 
WHERE expense_date >= CURRENT_DATE - INTERVAL '90 days';

-- ===================================================================
-- SUGGESTED TABLE ENHANCEMENTS
-- ===================================================================

-- Add audit columns if they don't exist
DO $$
BEGIN
    -- Add created_at to workshops if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'created_at') THEN
        ALTER TABLE public.workshops ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at to workshops if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'updated_at') THEN
        ALTER TABLE public.workshops ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add status columns for better state management
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'status') THEN
        ALTER TABLE public.workshops ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('draft', 'active', 'full', 'cancelled', 'completed'));
    END IF;
    
    -- Add payment status to incomes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'incomes' AND column_name = 'payment_status') THEN
        ALTER TABLE public.incomes ADD COLUMN payment_status TEXT DEFAULT 'completed' 
        CHECK (payment_status IN ('pending', 'completed', 'refunded', 'cancelled'));
    END IF;
    
    -- Add payment method to incomes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'incomes' AND column_name = 'payment_method') THEN
        ALTER TABLE public.incomes ADD COLUMN payment_method TEXT DEFAULT 'cash' 
        CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'other'));
    END IF;
    
    -- Add tags to workshops for better categorization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'tags') THEN
        ALTER TABLE public.workshops ADD COLUMN tags TEXT[];
    END IF;
    
    -- Add workshop date/time fields if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'start_date') THEN
        ALTER TABLE public.workshops ADD COLUMN start_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'end_date') THEN
        ALTER TABLE public.workshops ADD COLUMN end_date TIMESTAMPTZ;
    END IF;
    
    RAISE NOTICE 'Added suggested enhancement columns';
END $$;

-- ===================================================================
-- CREATE USEFUL VIEWS FOR ANALYTICS
-- ===================================================================

-- Monthly revenue summary view
CREATE OR REPLACE VIEW public.monthly_revenue AS
SELECT 
    DATE_TRUNC('month', income_date) as month,
    COUNT(*) as transaction_count,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_transaction,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT workshop_id) as workshops_sold
FROM public.incomes 
WHERE income_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', income_date)
ORDER BY month DESC;

-- Monthly expenses summary view
CREATE OR REPLACE VIEW public.monthly_expenses AS
SELECT 
    DATE_TRUNC('month', expense_date) as month,
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_expenses,
    AVG(amount) as avg_expense
FROM public.expenses 
WHERE expense_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', expense_date), category
ORDER BY month DESC, total_expenses DESC;

-- Client activity summary view
CREATE OR REPLACE VIEW public.client_activity AS
SELECT 
    c.id,
    c.full_name,
    c.email,
    COUNT(i.id) as total_workshops_attended,
    SUM(i.amount) as total_spent,
    MAX(i.income_date) as last_workshop_date,
    MIN(i.income_date) as first_workshop_date,
    AVG(i.amount) as avg_workshop_cost
FROM public.clients c
LEFT JOIN public.incomes i ON c.id = i.client_id
GROUP BY c.id, c.full_name, c.email
ORDER BY total_spent DESC NULLS LAST;

-- Workshop performance view
CREATE OR REPLACE VIEW public.workshop_performance AS
SELECT 
    w.id,
    w.title,
    w.price,
    w.max_participants,
    COUNT(i.id) as total_bookings,
    SUM(i.amount) as total_revenue,
    ROUND(COUNT(i.id)::DECIMAL / NULLIF(w.max_participants, 0) * 100, 2) as fill_rate_percent,
    COUNT(DISTINCT i.client_id) as unique_participants
FROM public.workshops w
LEFT JOIN public.incomes i ON w.id = i.workshop_id
GROUP BY w.id, w.title, w.price, w.max_participants
ORDER BY total_revenue DESC NULLS LAST;

-- ===================================================================
-- CREATE USEFUL FUNCTIONS
-- ===================================================================

-- Function to calculate profit for a date range
CREATE OR REPLACE FUNCTION public.calculate_profit(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_income DECIMAL,
    total_expenses DECIMAL,
    net_profit DECIMAL,
    profit_margin DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(i.amount), 0) as total_income,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0) as net_profit,
        CASE 
            WHEN COALESCE(SUM(i.amount), 0) > 0 
            THEN ROUND(((COALESCE(SUM(i.amount), 0) - COALESCE(SUM(e.amount), 0)) / COALESCE(SUM(i.amount), 0)) * 100, 2)
            ELSE 0 
        END as profit_margin
    FROM 
        (SELECT amount FROM public.incomes WHERE income_date BETWEEN start_date AND end_date) i
    FULL OUTER JOIN 
        (SELECT amount FROM public.expenses WHERE expense_date BETWEEN start_date AND end_date) e 
    ON 1=1;
END;
$$ LANGUAGE plpgsql;

-- Function to get top clients by revenue
CREATE OR REPLACE FUNCTION public.get_top_clients(limit_count INT DEFAULT 10)
RETURNS TABLE(
    client_name TEXT,
    client_email TEXT,
    total_spent DECIMAL,
    workshop_count BIGINT,
    avg_spending DECIMAL,
    last_workshop DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.full_name,
        c.email,
        COALESCE(SUM(i.amount), 0) as total_spent,
        COUNT(i.id) as workshop_count,
        COALESCE(AVG(i.amount), 0) as avg_spending,
        MAX(i.income_date::DATE) as last_workshop
    FROM public.clients c
    LEFT JOIN public.incomes i ON c.id = i.client_id
    GROUP BY c.id, c.full_name, c.email
    HAVING COUNT(i.id) > 0
    ORDER BY total_spent DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ===================================================================

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at columns
DO $$
DECLARE
    table_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY['clients', 'workshops', 'incomes', 'expenses', 'documents', 'profiles'];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        -- Drop trigger if exists
        EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON public.%s', table_name, table_name);
        
        -- Create trigger
        EXECUTE format('CREATE TRIGGER update_%s_updated_at 
                        BEFORE UPDATE ON public.%s 
                        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', 
                       table_name, table_name);
    END LOOP;
    RAISE NOTICE 'Created updated_at triggers for all tables';
END $$;

-- ===================================================================
-- NORMALIZATION SUGGESTIONS
-- ===================================================================

-- Create workshop_categories table for better normalization
CREATE TABLE IF NOT EXISTS public.workshop_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color_code TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.workshop_categories (name, description, color_code) VALUES
('Pottery', 'Clay and ceramic workshops', '#8B4513'),
('Painting', 'Various painting techniques and mediums', '#FF6B35'),
('Sculpture', 'Three-dimensional art creation', '#4ECDC4'),
('Digital Art', 'Computer-based art and design', '#45B7D1'),
('Jewelry', 'Jewelry making and metalwork', '#F39C12'),
('Kids', 'Age-appropriate creative workshops for children', '#E74C3C'),
('Mixed Media', 'Combination of different art techniques', '#9B59B6')
ON CONFLICT (name) DO NOTHING;

-- Add category_id to workshops table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'workshops' AND column_name = 'category_id') THEN
        ALTER TABLE public.workshops ADD COLUMN category_id UUID 
        REFERENCES public.workshop_categories(id);
        RAISE NOTICE 'Added category_id to workshops table';
    END IF;
END $$;

-- ===================================================================
-- FINAL RECOMMENDATIONS
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SCHEMA OPTIMIZATION COMPLETE ===';
    RAISE NOTICE '';
    RAISE NOTICE 'PERFORMANCE IMPROVEMENTS:';
    RAISE NOTICE '✅ Added composite indexes for common query patterns';
    RAISE NOTICE '✅ Added partial indexes for recent data queries';
    RAISE NOTICE '✅ Created useful views for analytics and reporting';
    RAISE NOTICE '';
    RAISE NOTICE 'FEATURE ENHANCEMENTS:';
    RAISE NOTICE '✅ Added status tracking for workshops and payments';
    RAISE NOTICE '✅ Added payment methods and audit trails';
    RAISE NOTICE '✅ Added workshop scheduling fields';
    RAISE NOTICE '✅ Added automatic timestamp updates via triggers';
    RAISE NOTICE '';
    RAISE NOTICE 'DATA ORGANIZATION:';
    RAISE NOTICE '✅ Created workshop categories for better organization';
    RAISE NOTICE '✅ Added utility functions for profit calculation';
    RAISE NOTICE '✅ Created analytics views for business insights';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Run ANALYZE; to update table statistics';
    RAISE NOTICE '2. Monitor query performance with new indexes';
    RAISE NOTICE '3. Update frontend to use new status fields';
    RAISE NOTICE '4. Populate workshop categories and dates';
    RAISE NOTICE '5. Set up monitoring for slow queries';
END $$;

-- Update table statistics
ANALYZE; 