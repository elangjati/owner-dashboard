# 🔧 Troubleshooting - Kasir Page Error

**Issue:** Ga bisa buat pesanan  
**Status:** Debugging

---

## ✅ Checklist Debugging

### 1. Apakah menu ada di database?

**Cek di Supabase:**
1. Login ke supabase.co
2. Pilih project: `cbnxalaiwckbbzmtjfzd`
3. Go to `Editor` → `menus` table
4. Pastikan ada data dengan `is_available = true`

**Jika tidak ada menu:**
Perlu add test data terlebih dahulu

---

## 🛠️ Possible Issues & Solutions

### Issue 1: Tidak ada menu di database
**Gejala:** Halaman Kasir kosong, tidak ada menu
**Penyebab:** Table `menus` kosong atau tidak ada data

**Solusi:**
```sql
-- Login ke Supabase SQL editor dan run:
INSERT INTO menus (name, description, price, category, is_available)
VALUES 
  ('Ayam Goreng', 'Ayam goreng renyah', 35000, 'food', true),
  ('Nasi Putih', 'Nasi putih panas', 8000, 'food', true),
  ('Es Teh Manis', 'Es teh manis segar', 5000, 'beverage', true),
  ('Tahu Goreng', 'Tahu goreng crispy', 12000, 'snack', true);
```

**Atau via Supabase Dashboard:**
1. Go to `menus` table
2. Click `Insert` → `Insert row`
3. Add sample data dengan `is_available` = true

---

### Issue 2: Menu ada tapi gabisa diklik
**Gejala:** Menu muncul tapi klik ga nambah item
**Penyebab:** JavaScript error di browser console

**Solusi:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Lihat error message apa
4. Screenshot error dan share

---

### Issue 3: Buat pesanan gagal
**Gejala:** Klik "Buat Pesanan" tapi error
**Penyebab:** Database permission atau data format

**Solusi:**

**Step 1: Cek browser console**
```
F12 → Console → Lihat error message
```

**Step 2: Cek Supabase RLS policies**
- Go to `Authentication` → `Policies`
- Make sure policies allow INSERT on `orders` table
- Make sure policies allow INSERT on `order_items` table

**Step 3: Verify table structure**
```sql
-- Make sure columns exist:
-- orders: id, order_number, customer_name, total_amount, 
--         payment_method, payment_status, notes, created_at
-- order_items: id, order_id, menu_id, quantity, price
```

---

## 🔍 Step-by-Step Testing

### Test 1: Verify Menu Display
```
1. Open Kasir page
2. Check if menus appear
3. If yes → go to Test 2
4. If no → add sample menu data (Issue 1 solution)
```

### Test 2: Add Item to Order
```
1. Click on menu item
2. Item should appear in "Ringkasan Pesanan" panel
3. Check quantity field appears
4. If works → go to Test 3
5. If not → check browser console
```

### Test 3: Modify Order
```
1. Change quantity in order summary
2. Total should update
3. Remove item by clicking trash icon
4. Item should disappear
5. If works → go to Test 4
```

### Test 4: Add Customer Info
```
1. Type customer name
2. Add notes
3. Select payment method (Tunai/QRIS)
4. If works → go to Test 5
```

### Test 5: Create Order
```
1. Click "Buat Pesanan" button
2. Wait for processing
3. Check for success screen
4. If success → Order created ✅
5. If error → check console for details
```

---

## 📱 Common Errors & Fixes

### Error: "Tambahkan minimal 1 item pesanan"
**Meaning:** Belum ada item di order
**Fix:** 
1. Click menu items terlebih dahulu
2. Items harus muncul di "Ringkasan Pesanan"
3. Baru bisa klik "Buat Pesanan"

---

### Error: "Gagal membuat pesanan"
**Meaning:** Database error
**Steps:**
1. Open F12 → Console
2. Lihat full error message
3. Possible causes:
   - RLS policies blocked
   - Database permissions
   - Invalid data format

**Fix:**
- Check Supabase RLS policies
- Verify table structure
- Try with simpler data first

---

### Error: "Gagal memuat menu"
**Meaning:** Can't fetch menus from database
**Fix:**
1. Check Supabase URL correct
2. Check API key correct
3. Check menus table exists
4. Check has data with is_available=true

---

## 🔐 Supabase RLS Policies

For Kasir page to work, need these policies:

### On `orders` table:
```sql
-- Allow authenticated users to INSERT
CREATE POLICY "Allow authenticated insert orders"
ON orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to SELECT
CREATE POLICY "Allow authenticated select orders"
ON orders FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);
```

### On `order_items` table:
```sql
-- Allow authenticated users to INSERT
CREATE POLICY "Allow authenticated insert order_items"
ON order_items FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
```

### On `menus` table:
```sql
-- Allow all (public) to SELECT
CREATE POLICY "Allow public select menus"
ON menus FOR SELECT
USING (is_available = true);
```

---

## 📊 Database Schema Check

**Make sure these tables exist:**

### menus table:
```
id: uuid (primary key)
name: text
description: text
price: numeric
category: text (food/beverage/snack/dessert)
is_available: boolean
image_url: text (nullable)
created_at: timestamp
```

### orders table:
```
id: uuid (primary key)
order_number: text
customer_name: text
total_amount: numeric
payment_method: text (tunai/qris)
payment_status: text (pending/completed/cancelled)
status: text (pending/completed/cancelled)
notes: text (nullable)
deleted_at: timestamp (nullable)
created_at: timestamp
```

### order_items table:
```
id: uuid (primary key)
order_id: uuid (foreign key → orders.id)
menu_id: uuid (foreign key → menus.id)
quantity: integer
price: numeric
notes: text (nullable)
```

---

## 🧪 Manual Test SQL

**If want to test directly:**

### Add test menu:
```sql
INSERT INTO menus (name, description, price, category, is_available)
VALUES ('Test Menu', 'For testing', 10000, 'food', true)
RETURNING *;
```

### Create test order:
```sql
INSERT INTO orders (order_number, customer_name, total_amount, payment_method, payment_status, notes, created_at)
VALUES ('ORD-TEST-001', 'Test Customer', 50000, 'tunai', 'completed', 'Test order', now())
RETURNING *;
```

### Add test order item:
```sql
INSERT INTO order_items (order_id, menu_id, quantity, price)
VALUES ('order-id-here', 'menu-id-here', 2, 10000)
RETURNING *;
```

---

## 🌐 Test URLs

### Local Testing:
- React Dashboard: `http://localhost:5173` (when running `npm run dev`)
- Kasir page: `http://localhost:5173/kasir`

### Production:
- Will use deployed URL (Vercel/Netlify)

---

## 📋 Quick Verification Checklist

- [ ] Supabase project connected (check .env.local)
- [ ] menus table exists
- [ ] menus table has data with is_available=true
- [ ] orders table exists
- [ ] order_items table exists
- [ ] RLS policies configured
- [ ] Browser console shows no errors
- [ ] Can see menus on Kasir page
- [ ] Can click menu to add item
- [ ] Can submit order

---

## 🆘 If Still Not Working

**Please check and share:**

1. **Screenshot dari browser console**
   - F12 → Console tab
   - Copy any red error messages

2. **Supabase project status**
   - Go to supabase.co
   - Check if project is running
   - Check tables exist

3. **Network request status**
   - F12 → Network tab
   - Try to create order
   - Check requests in Network tab
   - Look for failed requests

4. **Data in database**
   - Go to Supabase SQL editor
   - Run: `SELECT * FROM menus WHERE is_available = true;`
   - Should return menu items

---

## 📞 Next Steps

1. **Verify menu data exists** - Check Supabase `menus` table
2. **Test menu display** - Open Kasir page, should see menus
3. **Try create order** - Follow test sequence above
4. **Check console** - F12 for any errors
5. **Share error** - If error, screenshot console

**Then we can debug from there!**

---

**Happy testing! Let me know what happens 🚀**

