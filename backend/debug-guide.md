# 🔍 Debug Guide: Summary Cards Showing ₹0

## Issue
The summary cards (To Submit, Waiting Approval, Approved) are showing ₹0 instead of real data from the database.

## Debugging Steps

### 1. Check if expenses exist in database
```bash
cd Odoo25/backend
node check-expenses.js
```

### 2. Create sample data if needed
```bash
cd Odoo25/backend
node test-expenses.js
```

### 3. Test API endpoints
```bash
cd Odoo25/backend
node test-api.js
```

### 4. Start backend server
```bash
cd Odoo25/backend
npm start
```

### 5. Check browser console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Navigate to Expense Management page
4. Look for console logs showing:
   - "Fetching summary data..."
   - "Summary API response: ..."
   - "Summary data set: ..."

### 6. Check backend console
Look for logs showing:
   - "Fetching expense summary..."
   - "Found expenses: ..."
   - "Summary data: ..."

## Common Issues & Solutions

### Issue 1: No expenses in database
**Solution**: Run `node test-expenses.js` to create sample data

### Issue 2: Status case mismatch
**Solution**: The code now handles both "Pending" and "pending" cases

### Issue 3: Backend not running
**Solution**: Start backend with `npm start` in backend directory

### Issue 4: CORS issues
**Solution**: Make sure backend is running on port 5000

### Issue 5: Database connection issues
**Solution**: Check your .env file has correct MONGO_URI

## Expected Output

When working correctly, you should see:
- Backend console: "Found expenses: { toSubmit: X, waitingApproval: Y, approved: Z }"
- Frontend console: "Summary data set: { toSubmit: {...}, waitingApproval: {...}, approved: {...} }"
- UI: Summary cards showing actual amounts instead of ₹0

## Quick Fix Commands

```bash
# 1. Create data
cd Odoo25/backend
node test-expenses.js

# 2. Start backend
npm start

# 3. In another terminal, start frontend
cd Odoo25/Frontend
npm run dev
```
