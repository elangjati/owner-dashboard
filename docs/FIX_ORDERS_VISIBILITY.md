# 🔧 Fix: Orders Not Showing

**Issue:** Pesanan tidak muncul setelah dibuat  
**Penyebab:** RLS (Row Level Security) policy terlalu ketat  
**Solution:** Adjust RLS policies di Supabase

---

## ✅ Quick Fix

### Step 1: Go to Supabase Dashboard
1. Login ke https://supabase.co
2. Select project: `cbnxalaiwckbbzmtjfzd`
3. Go to `Authentication` → `Policies`

### Step 2: Check RLS on `orders` table

Should have these policies:

**Policy 1: SELECT (Read)**
```sql
-- Name: Allow authenticated users to select orders
-- On table: orders
-- For: SELECT
-- To: authenticated
-- Check: true
```

**Policy 2: INSERT (Create)**
```sql
-- Name: Allow authenticated users to insert orders
-- On table: orders
-- For: INSERT
-- To: authenticated
-- With check: true
```

### Step 3: If policies missing, create them

**Go to SQL Editor and run:**

```sql
-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
CREATE POLICY "Allow authenticated select" ON orders
FOR SELECT TO authenticated
USING (true);

-- Policy for INSERT
CREATE POLICY "Allow authenticated insert" ON orders
FOR INSERT TO authenticated
WITH CHECK (true);

-- Policy for UPDATE
CREATE POLICY "Allow authenticated update" ON orders
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE (soft delete via update)
CREATE POLICY "Allow authenticated delete" ON orders
FOR DELETE TO authenticated
USING (true);
```

### Step 4: Do same for `order_items` table

```sql
-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "Allow authenticated select" ON order_items
FOR SELECT TO authenticated
USING (true);

-- INSERT Policy
CREATE POLICY "Allow authenticated insert" ON order_items
FOR INSERT TO authenticated
WITH CHECK (true);

-- UPDATE Policy
CREATE POLICY "Allow authenticated update" ON order_items
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
```

### Step 5: Verify `menus` table

```sql
-- For menus, can be public READ, no INSERT needed
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select available menus" ON menus
FOR SELECT
USING (is_available = true);

-- For authenticated, allow all access
CREATE POLICY "Allow authenticated all" ON menus
FOR ALL TO authenticated
USING (true);
```

---

## 🔍 Test After Fix

### Test 1: Create New Order
1. Open Kasir page
2. Add menu items
3. Click "Buat Pesanan"
4. See success screen

### Test 2: View Order Immediately
1. Go to Orders page
2. Should see order di list
3. Verify tanggal correct

### Test 3: View in Dashboard
1. Go to Dashboard
2. Check "Recent Orders" section
3. New order should appear

### Test 4: Real-time Sync
1. Create order from Kasir
2. Check if appears immediately on Orders page (without refresh)
3. Should show live update

---

## 📋 Complete RLS Setup Script

**If want to setup from scratch, run this in Supabase SQL Editor:**

```sql
-- ===== USERS TABLE =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- ===== MENUS TABLE =====
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Public can see available menus
CREATE POLICY "Public can view available menus" ON menus
FOR SELECT
USING (is_available = true);

-- Authenticated can manage menus
CREATE POLICY "Authenticated can manage menus" ON menus
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- ===== ORDERS TABLE =====
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Authenticated can view all orders
CREATE POLICY "Authenticated can view orders" ON orders
FOR SELECT TO authenticated
USING (true);

-- Authenticated can create orders
CREATE POLICY "Authenticated can create orders" ON orders
FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated can update orders
CREATE POLICY "Authenticated can update orders" ON orders
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated can delete (soft delete)
CREATE POLICY "Authenticated can delete orders" ON orders
FOR DELETE TO authenticated
USING (true);

-- ===== ORDER_ITEMS TABLE =====
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Authenticated can view order items
CREATE POLICY "Authenticated can view order items" ON order_items
FOR SELECT TO authenticated
USING (true);

-- Authenticated can create order items
CREATE POLICY "Authenticated can create order items" ON order_items
FOR INSERT TO authenticated
WITH CHECK (true);

-- Authenticated can update order items
CREATE POLICY "Authenticated can update order items" ON order_items
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated can delete order items
CREATE POLICY "Authenticated can delete order items" ON order_items
FOR DELETE TO authenticated
USING (true);
```

---

## ❌ Troubleshooting If Still Not Working

### Check 1: Verify Policies Created
```sql
-- See all policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check 2: Verify RLS Enabled
```sql
-- Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('orders', 'order_items', 'menus');
```

Should all show `true` in `rowsecurity` column.

### Check 3: Manually Insert Test Data
```sql
-- Try insert from SQL editor to verify policies
INSERT INTO orders (order_number, customer_name, total_amount, payment_method, payment_status, notes, created_at)
VALUES ('TEST-001', 'Test Customer', 50000, 'tunai', 'completed', 'Test', now());

-- Then SELECT to verify
SELECT * FROM orders WHERE order_number = 'TEST-001';
```

### Check 4: Browser Console
- F12 → Console
- Look for Supabase auth errors
- Check network requests to Supabase

---

## 🔐 Security Notes

**Current setup:**
- Allows authenticated users to do everything
- Not role-based yet (can add later)
- Should be fine for owner/kasir only app

**Future enhancement:**
```sql
-- Can add role-based policies
CREATE POLICY "Only owner can delete orders" ON orders
FOR DELETE TO authenticated
USING (auth.jwt() ->> 'role' = 'owner');
```

---

## 📊 Expected Behavior After Fix

### Kasir Page:
1. ✅ Can add menu items
2. ✅ Can create order
3. ✅ Shows success screen
4. ✅ Order saved to database

### Orders Page:
1. ✅ Order appears immediately
2. ✅ Can click to view details
3. ✅ Can edit order
4. ✅ Can delete order

### Dashboard:
1. ✅ Recent orders show new order
2. ✅ Revenue updates
3. ✅ Real-time stats update

---

## 🚀 Next Steps

1. **Go to Supabase SQL Editor**
2. **Run the complete RLS setup script above**
3. **Test creating order from Kasir**
4. **Refresh Orders page - should see order**
5. **Check Dashboard - should update**

**If still not working after this, the issue is elsewhere!**

---

**Let me know after you run the SQL scripts and what happens! 🚀**

