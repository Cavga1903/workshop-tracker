# 🔧 Workshop Tracker Technical Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication & Security](#authentication--security)
5. [Email Notification System](#email-notification-system)
6. [API Reference](#api-reference)
7. [Deployment Guide](#deployment-guide)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)
10. [Development Setup](#development-setup)

---

## 🏗 Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Supabase       │    │   Edge          │
│   (React)       │◄──►│   Database       │◄──►│   Functions     │
│                 │    │   & Auth         │    │   (Deno)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       ▼
         │                       │              ┌─────────────────┐
         │                       │              │   Resend API    │
         │                       │              │   (Email)       │
         │                       │              └─────────────────┘
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   File Storage  │    │   Row Level      │
│   (Supabase)    │    │   Security       │
└─────────────────┘    └──────────────────┘
```

### Component Structure
```
frontend/src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── contexts/           # React context providers
├── utils/              # Utility functions
├── supabase/           # Database client
└── config/             # Configuration files

supabase/
└── functions/          # Edge Functions (Deno)
    └── send-notification-email/
```

---

## 🛠 Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast development build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Flowbite React**: Pre-built UI components
- **React Router**: Client-side routing
- **Recharts**: Interactive data visualization
- **Lucide React**: Beautiful, customizable icons

### Backend & Database
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Relational database with JSONB support
- **Row Level Security (RLS)**: Fine-grained access control
- **Real-time subscriptions**: Live data updates

### Email System
- **Supabase Edge Functions**: Serverless functions using Deno
- **Resend API**: Modern email delivery service
- **TypeScript**: Type-safe email templates

### Development Tools
- **ESLint**: Code linting
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

---

## 🗄 Database Schema

### Core Tables

#### `profiles`
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

#### `incomes`
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

#### `expenses`
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

### Extended Tables

#### `clients`
```sql
CREATE TABLE clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
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

#### `workshops`
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
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `email_notifications`
```sql
CREATE TABLE email_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_type TEXT NOT NULL CHECK (record_type IN ('income', 'expense')),
    record_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    subject TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

#### Basic User Access
```sql
-- Users can view their own data
CREATE POLICY "Users can view own records" ON incomes
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all data
CREATE POLICY "Admins can view all records" ON incomes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

#### Security Features
- **User Isolation**: Regular users only see their own data
- **Admin Override**: Administrators can access all data
- **Automatic User ID**: Server-side user ID injection prevents spoofing
- **Read-Only Guests**: Non-authenticated users have no access

---

## 🔐 Authentication & Security

### Supabase Auth Integration
```javascript
// Authentication context
const AuthContext = createContext();

// Login with email/password
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};
```

### Domain Restrictions
```javascript
// Only allow specific email domains
const allowedDomains = ['kraftuniverse.com', 'kraftstories.com'];

const validateEmailDomain = (email) => {
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};
```

### Role-Based Access Control
```javascript
// Check admin permissions
const isAdmin = profile?.role === 'admin';

// Conditional rendering
{isAdmin && <AdminOnlyComponent />}

// Protected routes
<ProtectedRoute adminOnly>
  <AdminDashboard />
</ProtectedRoute>
```

---

## 📧 Email Notification System

### Edge Function Architecture
```typescript
// supabase/functions/send-notification-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process email notification request
    const { type, recordId, userId, amount, name, date } = await req.json()
    
    // Send emails to admin users
    // Log results to database
    // Return success/failure status
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### Email Template
```html
<!-- Responsive HTML email template -->
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: white; padding: 30px; border-radius: 10px;">
    <h2 style="color: #10b981;">📊 New Income Added</h2>
    <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px;">
      <h3>Workshop Payment</h3>
      <p><strong>Amount:</strong> $150.00</p>
      <p><strong>Date:</strong> 2024-01-15</p>
      <p><strong>Added by:</strong> John Doe</p>
    </div>
  </div>
</div>
```

### Integration with Frontend
```javascript
// Trigger email notification after record creation
const { data, error } = await supabase
  .from('incomes')
  .insert([incomeData])
  .select()
  .single();

if (data) {
  // Send email notification in background
  notifyNewIncome(data).catch(err => {
    console.log('Email notification failed (non-critical):', err);
  });
}
```

---

## 🌐 API Reference

### Supabase Client Usage

#### Authentication
```javascript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@kraftuniverse.com',
  password: 'password'
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
const { error } = await supabase.auth.signOut();
```

#### Data Operations
```javascript
// Create record
const { data, error } = await supabase
  .from('incomes')
  .insert([{ name: 'Workshop', payment: 100 }])
  .select()
  .single();

// Read with filters
const { data, error } = await supabase
  .from('incomes')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .order('created_at', { ascending: false });

// Update record
const { data, error } = await supabase
  .from('incomes')
  .update({ payment: 150 })
  .eq('id', recordId)
  .select();

// Delete record
const { error } = await supabase
  .from('incomes')
  .delete()
  .eq('id', recordId);
```

#### File Storage
```javascript
// Upload file
const { data, error } = await supabase.storage
  .from('documents')
  .upload(`${userId}/${filename}`, file);

// Download file
const { data, error } = await supabase.storage
  .from('documents')
  .download(`${userId}/${filename}`);
```

#### Edge Functions
```javascript
// Invoke Edge Function
const { data, error } = await supabase.functions.invoke('send-notification-email', {
  body: {
    type: 'income',
    recordId: '123',
    userId: 'user-456',
    amount: 100,
    name: 'Workshop Payment'
  }
});
```

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel/Netlify)

#### Environment Variables
```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Build Commands
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview
```

### Supabase Setup

#### Database Migration
```sql
-- Run the complete migration script
-- Located in: database-migration.sql

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies;
```

#### Edge Function Deployment
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Deploy Edge Function
supabase functions deploy send-notification-email

# Set environment variables
supabase secrets set RESEND_API_KEY=your-resend-key
supabase secrets set FRONTEND_URL=https://your-domain.com
```

### Email Service Setup (Resend)

#### API Configuration
```bash
# Get API key from Resend dashboard
RESEND_API_KEY=re_your_api_key

# Verify domain
# Add DNS records as provided by Resend
```

#### Testing Email Delivery
```bash
# Test from Edge Function
curl -X POST https://your-project.supabase.co/functions/v1/send-notification-email \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "income",
    "recordId": "test",
    "userId": "test",
    "amount": 100,
    "name": "Test Notification"
  }'
```

---

## ⚙️ Configuration

### Environment Variables

#### Frontend (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: Override branding
VITE_APP_NAME=Workshop Tracker
VITE_COMPANY_NAME=Kraft Universe
```

#### Supabase Edge Functions
```bash
# Email Service
RESEND_API_KEY=re_your_api_key

# Application URLs
FRONTEND_URL=https://your-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Feature Flags
```javascript
// config/features.js
export const FEATURES = {
  EMAIL_NOTIFICATIONS: true,
  ADVANCED_ANALYTICS: true,
  CLIENT_MANAGEMENT: true,
  WORKSHOP_CALENDAR: true,
  EXPORT_FUNCTIONALITY: true,
  DARK_MODE: true
};
```

### Branding Configuration
```javascript
// config/branding.js
export const BRANDING_MESSAGES = {
  navbarTitle: "Workshop Tracker",
  companyName: "Kraft Universe",
  welcomeMessage: "Welcome to your workshop management dashboard",
  footerText: "© 2024 Kraft Universe. All rights reserved."
};
```

---

## 🔍 Troubleshooting

### Common Issues

#### Authentication Problems
```javascript
// Debug auth state
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event, session);
  });
}, []);

// Check token validity
const { data: { user }, error } = await supabase.auth.getUser();
if (error) console.log('Auth error:', error);
```

#### Database Connection Issues
```javascript
// Test database connection
const { data, error } = await supabase
  .from('profiles')
  .select('count')
  .limit(1);

if (error) {
  console.log('Database error:', error);
}
```

#### Email Notification Failures
```bash
# Check Edge Function logs
supabase functions logs send-notification-email

# Test email API directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@yourdomain.com",
    "to": "admin@kraftuniverse.com",
    "subject": "Test Email",
    "text": "This is a test email"
  }'
```

### Performance Optimization

#### Database Indexing
```sql
-- Add indexes for common queries
CREATE INDEX idx_incomes_user_date ON incomes(user_id, date);
CREATE INDEX idx_expenses_user_month ON expenses(user_id, month);
CREATE INDEX idx_clients_email ON clients(email);
```

#### React Performance
```javascript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexVisualization data={data} />;
});

// Implement useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### Monitoring & Logging

#### Frontend Error Tracking
```javascript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking service
});

// React error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('React error:', error, errorInfo);
  }
}
```

#### Database Query Monitoring
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 💻 Development Setup

### Prerequisites
- Node.js 18+ and npm
- Git for version control
- Modern web browser
- Supabase account

### Local Development

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/workshop-tracker.git
cd workshop-tracker
```

#### 2. Install Dependencies
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies (if applicable)
cd ../backend
npm install
```

#### 3. Environment Setup
```bash
# Copy environment template
cp frontend/.env.example frontend/.env

# Edit with your Supabase credentials
# VITE_SUPABASE_URL=your-url
# VITE_SUPABASE_ANON_KEY=your-key
```

#### 4. Database Setup
```bash
# Run migration script in Supabase SQL Editor
# File: database-migration.sql

# Or use Supabase CLI
supabase db reset
```

#### 5. Start Development Server
```bash
# Frontend only
cd frontend
npm run dev

# Full stack
npm run dev  # If using root package.json
```

### Development Workflow

#### Code Structure
```
frontend/src/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components
│   └── features/       # Feature-specific components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── contexts/           # React contexts
└── types/              # TypeScript types
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `UserProfile.jsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useAuth.js`)
- **Utils**: camelCase (e.g., `formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS`)

#### Testing Strategy
```javascript
// Unit tests for utilities
import { formatCurrency } from '../utils/formatters';

test('formats currency correctly', () => {
  expect(formatCurrency(1234.56)).toBe('$1,234.56');
});

// Component testing
import { render, screen } from '@testing-library/react';
import UserProfile from '../components/UserProfile';

test('renders user name', () => {
  render(<UserProfile user={{ name: 'John Doe' }} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

### Contributing Guidelines

#### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-dashboard

# Make changes and commit
git add .
git commit -m "feat: add enhanced dashboard with charts"

# Push and create PR
git push origin feature/new-dashboard
```

#### Code Quality
- Use ESLint for code linting
- Follow Prettier formatting rules
- Write meaningful commit messages
- Add comments for complex logic
- Create tests for new features

---

*This technical guide covers the implementation details of Workshop Tracker v1.0. For user-facing documentation, see USER_GUIDE.md.* 