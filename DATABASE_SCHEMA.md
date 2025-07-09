# Workshop Tracker Database Schema

## Overview
This document outlines the complete database schema for the Workshop Tracker application, including existing tables and new tables for the advanced features.

## Existing Tables

### 1. profiles
User profile information and role management.

```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    phone_number TEXT,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. incomes
Workshop income records.

```sql
CREATE TABLE incomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    platform TEXT,
    name TEXT NOT NULL,
    class_type TEXT,
    guest_count INTEGER DEFAULT 0,
    payment DECIMAL(10,2) NOT NULL,
    type TEXT,
    shipping_cost DECIMAL(10,2) DEFAULT 0,
    cost_per_guest DECIMAL(10,2) DEFAULT 0,
    client_id UUID REFERENCES clients(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. expenses
Workshop expense records.

```sql
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    month TEXT NOT NULL,
    name TEXT NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    who_paid TEXT NOT NULL,
    category TEXT NOT NULL,
    client_id UUID REFERENCES clients(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. class_types
Types of workshops/classes offered.

```sql
CREATE TABLE class_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    cost_per_person DECIMAL(10,2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## New Tables

### 5. clients
External customer/client information.

```sql
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. documents
Document storage metadata for Supabase Storage.

```sql
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
    workshop_id UUID REFERENCES workshops(id),
    income_id UUID REFERENCES incomes(id),
    expense_id UUID REFERENCES expenses(id),
    client_id UUID REFERENCES clients(id),
    document_type TEXT CHECK (document_type IN ('invoice', 'receipt', 'contract', 'photo', 'other')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. workshops
Workshop events and sessions.

```sql
CREATE TABLE workshops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    location TEXT,
    instructor_id UUID REFERENCES auth.users(id),
    class_type_id UUID REFERENCES class_types(id),
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 8. workshop_participants
Many-to-many relationship between workshops and clients.

```sql
CREATE TABLE workshop_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workshop_id UUID REFERENCES workshops(id) NOT NULL,
    client_id UUID REFERENCES clients(id) NOT NULL,
    payment_amount DECIMAL(10,2),
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    attendance_status TEXT DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended', 'no_show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workshop_id, client_id)
);
```

## Row Level Security (RLS) Policies

### profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

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
```

### incomes
```sql
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own incomes" ON incomes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own incomes" ON incomes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes" ON incomes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes" ON incomes
    FOR DELETE USING (auth.uid() = user_id);
```

### expenses
```sql
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses" ON expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" ON expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expenses
    FOR DELETE USING (auth.uid() = user_id);
```

### class_types
```sql
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view class types" ON class_types
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage class types" ON class_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### clients
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

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
```

### documents
```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

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
```

### workshops
```sql
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

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
```

### workshop_participants
```sql
ALTER TABLE workshop_participants ENABLE ROW LEVEL SECURITY;

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
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_incomes_user_id ON incomes(user_id);
CREATE INDEX idx_incomes_date ON incomes(date);
CREATE INDEX idx_incomes_client_id ON incomes(client_id);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_client_id ON expenses(client_id);

CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_workshop_id ON documents(workshop_id);
CREATE INDEX idx_documents_income_id ON documents(income_id);
CREATE INDEX idx_documents_expense_id ON documents(expense_id);

CREATE INDEX idx_workshops_date ON workshops(date);
CREATE INDEX idx_workshops_instructor_id ON workshops(instructor_id);
CREATE INDEX idx_workshops_class_type_id ON workshops(class_type_id);

CREATE INDEX idx_workshop_participants_workshop_id ON workshop_participants(workshop_id);
CREATE INDEX idx_workshop_participants_client_id ON workshop_participants(client_id);
```

## Functions and Triggers

### Update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incomes_updated_at BEFORE UPDATE ON incomes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_types_updated_at BEFORE UPDATE ON class_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshops_updated_at BEFORE UPDATE ON workshops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Update client statistics
```sql
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

CREATE TRIGGER update_client_stats_on_income_change
    AFTER INSERT OR UPDATE OR DELETE ON incomes
    FOR EACH ROW EXECUTE FUNCTION update_client_stats();
```

## Storage Buckets

### Documents bucket
```sql
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false);

-- RLS policy for documents bucket
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
```

## Migration Notes

1. **Add client_id columns to existing tables:**
   ```sql
   ALTER TABLE incomes ADD COLUMN client_id UUID REFERENCES clients(id);
   ALTER TABLE expenses ADD COLUMN client_id UUID REFERENCES clients(id);
   ```

2. **Create new tables in order:**
   - clients
   - workshops
   - documents
   - workshop_participants

3. **Apply RLS policies after table creation**

4. **Create indexes for performance**

5. **Set up storage bucket with proper policies**

This schema supports:
- User role management (admin/user)
- Client relationship tracking
- Document uploads with metadata
- Workshop scheduling and management
- Participant tracking
- Financial record keeping
- Row-level security for data protection 