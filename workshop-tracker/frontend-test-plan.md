# 🧪 WORKSHOP TRACKER FRONTEND TEST PLAN
## Systematic Page Testing After Schema Cache Cleanup

> **Prerequisites**: Run `schema-cache-cleanup.sql` in Supabase SQL Editor first

---

## 🔄 **PHASE 1: PREPARATION (5 minutes)**

### **Step 1: Clear All Caches**
```bash
# Browser Cache
- Open Developer Tools (F12)
- Right-click refresh button → "Empty Cache and Hard Reload"
- Or: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# Application Cache  
- Clear Local Storage: Developer Tools → Application → Local Storage → Clear All
- Clear Session Storage: Developer Tools → Application → Session Storage → Clear All
```

### **Step 2: Authentication Reset**
```bash
# Logout and Login Again
1. Click logout in Workshop Tracker
2. Wait 10 seconds
3. Login with your credentials
4. Verify you're on the dashboard
```

### **Step 3: Schema Cache Wait**
```bash
# Wait for Supabase Cache Propagation
- Wait 30-60 seconds after running schema-cache-cleanup.sql
- This ensures all PostgREST instances have refreshed
```

---

## 📱 **PHASE 2: PAGE-BY-PAGE TESTING (15 minutes)**

### **🧑‍💼 TEST 1: CLIENT MANAGEMENT PAGE**

**Navigation**: Click "Clients" in sidebar

**❌ Previous Error**: `Could not find a relationship between 'clients' and 'created_by' in the schema cache`

**✅ Expected Results**:
- Client list loads without errors
- Creator names appear in the list
- No console errors about relationships

**🔍 Test Steps**:
1. Navigate to `/clients` page
2. **Verify**: Page loads completely (no spinner stuck)
3. **Verify**: Client list displays (even if empty)
4. **Verify**: No red error messages about "relationship" or "schema cache"
5. **Check Console**: Open F12 → Console, look for errors

**📝 Record Result**:
- ✅ **WORKING**: Client list loads with creator information
- ❌ **FAILED**: Error message: `_________________`

---

### **📅 TEST 2: WORKSHOP CALENDAR PAGE**

**Navigation**: Click "Calendar" in sidebar  

**❌ Previous Error**: `Could not find a relationship between 'incomes' and 'user_id' in the schema cache`

**✅ Expected Results**:
- Calendar events load from incomes table
- Instructor names display correctly
- Class types show if available

**🔍 Test Steps**:
1. Navigate to `/calendar` page
2. **Verify**: Page loads without relationship errors
3. **Verify**: Events display (if any income records exist)
4. **Verify**: Instructor names appear (not "Unknown")
5. **Check Console**: No schema cache errors

**📝 Record Result**:
- ✅ **WORKING**: Calendar displays events with instructor information
- ❌ **FAILED**: Error message: `_________________`

---

### **📊 TEST 3: ANALYTICS DASHBOARD PAGE**

**Navigation**: Click "Analytics" in sidebar

**❌ Previous Errors**: 
- `Could not find a relationship between 'incomes' and 'user_id'`
- `Could not find a relationship between 'expenses' and 'user_id'`

**✅ Expected Results**:
- Income/expense charts load
- User profile information appears
- No "relationship" errors

**🔍 Test Steps**:
1. Navigate to `/analytics` page
2. **Verify**: Page loads without errors
3. **Verify**: Charts render (even with no data)
4. **Verify**: Filter dropdowns work
5. **Verify**: No errors about user_id relationships
6. **Check Console**: No PostgREST errors

**📝 Record Result**:
- ✅ **WORKING**: Analytics charts load with user data
- ❌ **FAILED**: Error message: `_________________`

---

### **📁 TEST 4: DOCUMENTS PAGE**

**Navigation**: Click "Documents" in sidebar

**❌ Previous Errors**:
- `Could not embed because more than one relationship was found for 'documents' and 'income_id'`
- Multiple relationship conflicts

**✅ Expected Results**:
- Document list loads
- File upload works
- Related entity information displays

**🔍 Test Steps**:
1. Navigate to `/documents` page
2. **Verify**: Page loads without "more than one relationship" errors
3. **Verify**: Document list displays
4. **Test Upload**: Try uploading a small test file
5. **Verify**: Upload completes without relationship errors
6. **Check Console**: No ambiguous relationship errors

**📝 Record Result**:
- ✅ **WORKING**: Documents page and upload function correctly
- ❌ **FAILED**: Error message: `_________________`

---

## 🔍 **PHASE 3: ADVANCED TESTING (10 minutes)**

### **🧪 TEST 5: CREATE NEW RECORDS**

**Purpose**: Verify foreign key relationships work for new data

**🔍 Test Steps**:

**Create New Client**:
1. Go to Clients page → "Add Client" button
2. Fill form: Name, Email, etc.
3. **Verify**: Client saves successfully
4. **Verify**: Your name appears as creator

**Create New Income**:
1. Go to "Add Income" page
2. Fill basic income details
3. **Verify**: Income saves with your user_id
4. **Check**: Appears in Calendar with your name

**Create New Expense**:
1. Go to "Add Expense" page  
2. Fill basic expense details
3. **Verify**: Expense saves with your user_id
4. **Check**: Appears in Analytics with your name

**📝 Record Results**:
- ✅ **WORKING**: All new records save with proper relationships
- ❌ **FAILED**: Issue with: `_________________`

---

### **🔗 TEST 6: EMBEDDED RELATIONSHIP QUERIES**

**Purpose**: Test the exact Supabase queries that were failing

**🔍 Browser Console Testing**:

1. Open Developer Tools → Console
2. Paste and run these test queries:

```javascript
// Test 1: Client with creator profile
const testClients = await supabase
  .from('clients')
  .select('*, profiles:created_by(full_name, email)')
  .limit(1);
console.log('Clients test:', testClients);

// Test 2: Incomes with user profile  
const testIncomes = await supabase
  .from('incomes')
  .select('*, profiles:user_id(full_name, email)')
  .limit(1);
console.log('Incomes test:', testIncomes);

// Test 3: Expenses with user profile
const testExpenses = await supabase
  .from('expenses')
  .select('*, profiles:user_id(full_name, email)')
  .limit(1);
console.log('Expenses test:', testExpenses);
```

**📝 Record Results**:
- ✅ **ALL QUERIES WORK**: No relationship errors
- ❌ **QUERY FAILED**: Error: `_________________`

---

## 📋 **PHASE 4: FINAL VERIFICATION CHECKLIST**

### **✅ Success Criteria**

Mark each item as ✅ or ❌:

- [ ] **Clients Page**: Loads without relationship errors
- [ ] **Calendar Page**: Displays events with instructor names  
- [ ] **Analytics Page**: Shows charts with user profile data
- [ ] **Documents Page**: Upload works without ambiguous relationship errors
- [ ] **New Records**: Can create clients/incomes/expenses successfully
- [ ] **Console Clean**: No schema cache or relationship errors in F12 Console
- [ ] **Supabase Queries**: Direct queries work in browser console

### **🚨 If Any Tests Fail**

**Immediate Actions**:
1. Note the exact error message
2. Check browser F12 Console for details
3. Try the problem page again after 60 seconds
4. Clear browser cache and retry

**Report Format**:
```
FAILED PAGE: [page name]
ERROR MESSAGE: [exact error text]
CONSOLE ERRORS: [any F12 console errors]
BROWSER: [Chrome/Firefox/Safari version]
TIMESTAMP: [when error occurred]
```

---

## 🎯 **EXPECTED FINAL RESULT**

### **✅ Complete Success**
- All pages load without "relationship" or "schema cache" errors
- Foreign key relationships work in frontend queries
- Users can create new records successfully
- Documents upload works without ambiguous relationship conflicts

### **📊 Summary Template**

**WORKSHOP TRACKER SCHEMA FIX RESULTS**:
- 🧑‍💼 **Clients Page**: ✅ Working / ❌ Failed
- 📅 **Calendar Page**: ✅ Working / ❌ Failed  
- 📊 **Analytics Page**: ✅ Working / ❌ Failed
- 📁 **Documents Page**: ✅ Working / ❌ Failed
- 🔗 **Relationships**: ✅ All Working / ❌ Issues Remain

**Overall Status**: ✅ FULLY RESOLVED / ❌ NEEDS MORE WORK

---

*Test completed on: [Date/Time]*  
*Tester: [Your name]*  
*Schema cleanup version: Latest* 