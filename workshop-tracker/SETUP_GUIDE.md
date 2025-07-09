# Workshop Tracker Setup Guide

## 🔧 Database Migration Instructions

### Step 1: Apply Database Schema Migration

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Migration Script**
   - Copy the contents of `database-migration.sql`
   - Paste into the SQL Editor
   - Click **Run** to execute the migration

3. **Verify Tables Created**
   The migration will create these new tables:
   - ✅ `clients` - Customer information and payment tracking
   - ✅ `workshops` - Workshop events and scheduling  
   - ✅ `documents` - File upload metadata with Supabase Storage
   - ✅ `workshop_participants` - Many-to-many relationship table

4. **Enable Storage Bucket**
   - Go to **Storage** in Supabase dashboard
   - Verify the `documents` bucket was created
   - If not, create it manually with public access disabled

### Step 2: Test New Features

#### ✅ Who Paid Page Enhancements
- Navigate to `/who-paid`
- Test the **Internal Contributors** tab (expense/income tracking)
- Test the **Client Payments** tab (customer payment history)
- Verify filtering and export functionality

#### ✅ Document Upload System
- Navigate to `/documents`
- Test uploading files (PDFs, images, documents)
- Verify file categorization (invoice, receipt, contract, photo, other)
- Test download functionality
- Check admin vs user permissions

#### ✅ Profile Settings Improvements
- Navigate to `/profile`
- Test the new two-column layout
- Verify profile information editing
- Test password change functionality with validation
- Check profile preview updates in real-time

#### ✅ Navigation Fixes
- Verify "Add Class Type" is removed from Actions dropdown
- Confirm only "Manage Class Types" appears for admin users
- Test Documents link in main navigation

---

## 🚨 Troubleshooting

### Problem: "relation 'public.clients' does not exist"
**Solution:** Run the database migration script in Supabase SQL Editor

### Problem: "Could not find relationship between documents and uploaded_by"
**Solution:** The migration fixes this with proper foreign key constraints

### Problem: Storage upload fails
**Solution:** 
1. Check Storage bucket exists in Supabase
2. Verify RLS policies are applied
3. Ensure file size is under 10MB limit

### Problem: Client tab shows no data
**Solution:** This is expected initially - clients table starts empty. Add test clients through the admin interface.

---

## 🎯 Features Summary

### ✅ Completed Features
- **Two-tab Who Paid system** (Internal vs Client payments)
- **Document upload with Supabase Storage**
- **Enhanced Profile settings layout**
- **Dynamic branding configuration**
- **Graceful error handling for missing tables**
- **Role-based access control**

### 🔜 Next Phase Features
- AI Financial Insights cards
- Workshop Calendar view
- Email notifications for new transactions
- Advanced client management
- Enhanced reporting and analytics

---

## 🔒 Security Notes

- All tables have Row Level Security (RLS) enabled
- Document uploads are scoped to authenticated users
- Admin users can manage all data
- Regular users can only access their own records
- File uploads are validated for type and size

---

## 💡 Usage Tips

1. **For Administrators:**
   - Use "Manage Class Types" to add workshop categories
   - Access all documents and client data
   - Manage user roles and permissions

2. **For Regular Users:**
   - Add income/expense records with optional client association
   - Upload supporting documents for transactions
   - Update profile and password through settings

3. **File Organization:**
   - Use descriptive filenames for uploads
   - Categorize documents properly (invoice, receipt, etc.)
   - Add descriptions to help with searching

---

## 🚀 Next Steps

After completing the setup:

1. Add some test data (clients, workshops, documents)
2. Test the export functionality on Who Paid page
3. Verify role-based access works correctly
4. Check responsive design on mobile devices
5. Consider implementing the next phase features

---

**Need Help?** Check the console for detailed error messages and refer to Supabase documentation for advanced configuration options. 