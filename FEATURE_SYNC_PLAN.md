# 📋 Feature Sync Plan - Align React Dashboard dengan Laravel

Rencana untuk menambahkan semua fitur dari Laravel Kasir App ke Owner Dashboard React.

---

## 🎯 Feature Comparison

### ✅ Yang Sudah Ada di React

| Fitur | Status | Notes |
|-------|--------|-------|
| Dashboard | ✅ | Basic stats hari ini |
| Orders List | ✅ | Filter by date range |
| Reports | ✅ | 7-day & 30-day analytics |
| Real-time Updates | ✅ | Supabase subscription |
| Export CSV | ✅ | Basic export |
| Authentication | ✅ | Supabase Auth |

---

## ❌ Yang Perlu Ditambahkan (dari Laravel)

### 1. **Dashboard - Enhanced Metrics**
**Fitur yang ada di Laravel tapi belum di React:**

```
[Belum Ada - Perlu Ditambahkan]
✗ Breakdown per metode bayar (Tunai vs QRIS)
✗ Top 5 selling items chart
✗ Monthly breakdown (untuk laporan bulanan)
✗ Status pesanan breakdown (pending, completed, cancelled)
✗ Better card layout dengan warna berbeda per metode bayar
```

**Plan:**
- [ ] Tambah StatCard untuk Tunai & QRIS breakdown
- [ ] Tambah Top Items component (bar chart)
- [ ] Tambah metode bayar summary cards
- [ ] Update Dashboard.tsx

---

### 2. **Orders Page - Enhanced Features**
**Fitur yang ada di Laravel tapi belum di React:**

```
[Belum Ada - Perlu Ditambahkan]
✗ Trash/Deleted orders management
✗ Edit order functionality
✗ Change payment method
✗ Mark order as complete/pending
✗ View order receipt/struk
✗ Soft delete orders (restore from trash)
✗ Customer name field
✗ Order notes/memo
✗ More detailed order view modal
```

**Plan:**
- [ ] Buat OrderDetail modal/page
- [ ] Tambah edit functionality
- [ ] Tambah delete (soft delete) & restore
- [ ] Tambah change payment method dialog
- [ ] Tambah order receipt view
- [ ] Tambah customer name to order list
- [ ] Update Orders.tsx

---

### 3. **Reports Page - Complete Feature Parity**
**Fitur yang ada di Laravel tapi belum di React:**

```
[Belum Ada - Perlu Ditambahkan]
✗ Per Bulan vs Per Hari toggle (sudah ada tapi beda implementasi)
✗ Year selector (untuk laporan bulanan)
✗ Month selector (untuk laporan bulanan)
✗ Revenue breakdown per metode bayar (Tunai vs QRIS)
✗ Top 5 selling items
✗ Monthly breakdown table (week by week)
✗ Completed orders detail list dengan pagination
✗ Better CSV export (include more fields)
✗ Period label display
```

**Plan:**
- [ ] Tambah mode toggle (monthly vs daily)
- [ ] Tambah year selector
- [ ] Tambah month selector
- [ ] Tambah Tunai/QRIS revenue breakdown section
- [ ] Tambah Top 5 Items component
- [ ] Tambah monthly breakdown table
- [ ] Tambah completed orders detail (paginated)
- [ ] Improve CSV export format
- [ ] Update Reports.tsx

---

### 4. **Trash/Deleted Orders Page** (NEW)
**Halaman baru yang perlu dibuat:**

```
[Baru - Perlu Dibuat]
→ View deleted orders
→ Filter deleted orders by date
→ Restore deleted orders
→ Permanently delete orders
→ Search deleted orders
```

**Plan:**
- [ ] Buat TrashOrders.tsx page
- [ ] Tambah route di App.tsx
- [ ] Tambah navigation menu item
- [ ] Implement delete & restore functions
- [ ] Add to Navigation (Sidebar)

---

### 5. **Daily History Page** (ENHANCE)
**Halaman yang sudah ada tapi perlu enhancement:**

```
[Sudah Ada - Perlu Enhance]
✓ Daily tracking (sudah ada)
✗ Add date picker
✗ Add order items breakdown
✗ Add payment method tracking
✗ Add total revenue per day
✗ Add top items untuk hari itu
```

**Plan:**
- [ ] Enhance DailyHistory.tsx
- [ ] Add date picker
- [ ] Add revenue summary
- [ ] Add items breakdown
- [ ] Add payment method breakdown

---

### 6. **Menu Management** (NEW for Admin)
**Fitur yang ada di Laravel tapi belum di React:**

```
[Baru - Perlu Dibuat]
→ View all menus
→ Add new menu
→ Edit menu
→ Delete menu
→ Toggle menu availability
→ Upload menu image
→ Manage menu category
```

**Plan:**
- [ ] Buat Menus.tsx page
- [ ] Buat MenuForm component
- [ ] Implement CRUD operations
- [ ] Add image upload
- [ ] Add category management

---

### 7. **API Integration**
**Endpoint yang sudah ada di Laravel:**

```
Laravel API Endpoints:
GET /api/orders/daily-history
GET /api/orders
GET /api/orders/trash
DELETE /api/orders/{order}
POST /api/orders/{order}/restore
GET /api/dashboard/stats
```

**Plan:**
- [ ] Map Laravel endpoints to Supabase queries
- [ ] Create api.ts helpers untuk complex queries
- [ ] Test all integrations

---

## 📊 Breakdown Per Halaman

### Dashboard.tsx
```
Current:
├── Stats Cards (Revenue, Orders, Avg, Growth)
└── Recent Orders Table (10 orders)

Target (Add):
├── Stats Cards - Enhanced
│   ├── Total Revenue
│   ├── Total Orders
│   ├── Average Order
│   ├── Growth Rate
│   ├── Tunai Revenue (NEW)
│   ├── QRIS Revenue (NEW)
│   └── Payment Status Breakdown (NEW)
├── Top 5 Items Chart (NEW)
├── Recent Orders Table
│   └── Add customer_name column (NEW)
└── Payment Method Breakdown Cards (NEW)
```

### Orders.tsx
```
Current:
├── Filter by date range (today, week, month)
├── Search by order number
├── Orders table with status
└── Summary stats

Target (Add):
├── Filter by date range (keep)
├── Search (keep)
├── Orders table (enhance)
│   ├── Add customer_name column
│   ├── Add payment breakdown
│   └── Add action buttons
├── Order detail modal (NEW)
│   ├── View order details
│   ├── Edit order
│   ├── Change payment method
│   ├── View receipt
│   └── Delete order
├── Trash/Delete functionality (NEW)
└── Summary stats (keep)
```

### Reports.tsx
```
Current:
├── Period selector (7days vs 30days)
├── Summary cards
└── Daily breakdown table
└── Export CSV

Target (Add):
├── Mode toggle (Daily vs Monthly) (ENHANCE)
├── Date/Year/Month selectors (NEW)
├── Revenue breakdown per method (NEW)
├── Summary cards (keep)
├── Top 5 Items section (NEW)
├── Monthly breakdown table (NEW)
├── Completed orders list (NEW)
├── Better CSV export (ENHANCE)
```

### Trash.tsx (NEW)
```
New Page:
├── Deleted orders list
├── Filter by date
├── Search deleted orders
├── Restore buttons
├── Permanent delete buttons
└── Summary of deleted orders
```

### Menus.tsx (NEW)
```
New Page:
├── Menu list table
├── Add new menu button
├── Edit menu dialog
├── Delete menu confirmation
├── Toggle availability
├── Upload image
└── Category management
```

---

## 🔄 Implementation Priority

### Phase 1: Quick Wins (Easy, High Impact)
1. ✨ **Dashboard Enhancement**
   - Add Tunai/QRIS breakdown cards
   - Add payment method summary
   - Time: ~2-3 hours

2. 🔍 **Orders Enhancement**
   - Add customer_name column
   - Add order detail view modal
   - Time: ~3-4 hours

3. 📊 **Reports Enhancement**
   - Add mode toggle (daily vs monthly)
   - Add date/year/month selectors
   - Time: ~3-4 hours

### Phase 2: Medium Features
4. 🗑️ **Trash Page**
   - Create new Trash page
   - Implement soft delete & restore
   - Time: ~3-4 hours

5. 📋 **Daily History Enhancement**
   - Add date picker
   - Add revenue breakdown
   - Time: ~2-3 hours

### Phase 3: Advanced Features
6. 📸 **Menu Management**
   - Full CRUD operations
   - Image upload
   - Category management
   - Time: ~4-5 hours

7. 📈 **Advanced Reports**
   - Top items chart
   - Monthly breakdown
   - Complete order list
   - Better export
   - Time: ~4-5 hours

---

## 🛠️ Tech Details

### New Components Needed

```typescript
// components/OrderDetailModal.tsx
- Show order details
- Edit capability
- Payment change
- Receipt view
- Delete/restore buttons

// components/PaymentMethodBreakdown.tsx
- Tunai vs QRIS comparison
- Revenue per method
- Order count per method

// components/TopItemsChart.tsx
- Chart.js bar chart
- Top 5-10 selling items
- Revenue per item

// components/OrderActionsMenu.tsx
- Edit option
- View receipt
- Change payment
- Delete option
```

### API Helpers Needed

```typescript
// lib/api.ts - Add functions

// Queries
getOrders(dateRange)
getCompletedOrders(startDate, endDate)
getDeletedOrders(startDate, endDate)
getTopItems(startDate, endDate, limit)
getRevenueByPaymentMethod(startDate, endDate)

// Mutations
updateOrder(id, data)
deleteOrder(id) // soft delete
restoreOrder(id)
changePaymentMethod(orderId, method)
```

---

## 📝 Data Schema Alignment

### Order Fields Needed in React
```typescript
interface Order {
  id: string
  order_number: string
  customer_name: string         // ← Add
  total_price: number
  payment_method: 'tunai' | 'qris' | string
  payment_status: 'pending' | 'completed' | 'cancelled'
  status: 'pending' | 'completed' | 'cancelled'
  notes?: string                // ← Add
  created_at: string
  deleted_at?: string           // ← Add (for soft delete)
  items: OrderItem[]
}

interface OrderItem {
  id: string
  order_id: string
  menu_id: string
  quantity: number
  price: number
  menu?: Menu
}
```

---

## ✅ Checklist

### Phase 1
- [ ] Dashboard: Add Tunai/QRIS breakdown
- [ ] Orders: Add customer_name column
- [ ] Orders: Add detail modal
- [ ] Reports: Add mode toggle + date selectors

### Phase 2
- [ ] Create Trash page
- [ ] Implement soft delete & restore
- [ ] Enhance Daily History

### Phase 3
- [ ] Create Menu Management page
- [ ] Add Top Items chart
- [ ] Complete Reports features
- [ ] Advanced export options

---

## 🚀 Getting Started

1. **Read this plan thoroughly**
2. **Pick Phase 1 features to start**
3. **Update types/index.ts first** (add missing fields)
4. **Update lib/api.ts** (add query helpers)
5. **Update components** (add new components)
6. **Update pages** (enhance existing pages)
7. **Test everything**
8. **Deploy**

---

## 💡 Pro Tips

- Start with visual changes (UI) before logic
- Test with real data from Supabase
- Use TypeScript interfaces to catch errors early
- Create reusable components (DRY)
- Keep API queries organized in lib/api.ts
- Test responsive design on mobile

---

**Ready to implement? Start with Phase 1! 🎯**

