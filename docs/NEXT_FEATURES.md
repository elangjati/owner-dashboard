# 🚀 Next Features Implementation Guide

Panduan untuk implement fitur-fitur berikutnya sesuai dengan Laravel app.

---

## 📋 Fitur Priority Queue

### Phase 1 Complete ✅
1. ✅ Reports Enhancement - DONE

### Phase 1 Remaining (3/4)
2. ⏳ Dashboard Enhancement
3. ⏳ Orders Enhancement  
4. ⏳ Kasir Page (Create Orders)

### Phase 2 (2 features)
5. ⏳ Trash Page
6. ⏳ Daily History Enhancement

### Phase 3 (2 features)
7. ⏳ Menu Management
8. ⏳ Advanced Reports Features

---

## 🎯 Feature #2: Dashboard Enhancement

**Goal:** Add payment method breakdown dan top selling items ke dashboard

### What to Add

#### 1. Payment Method Cards
```
[Existing Card] [Existing Card] [Existing Card] [Existing Card]
[NEW: Tunai Card] [NEW: QRIS Card]
```

**Implementation:**
```typescript
// Add to state
const [tunaiRevenue, setTunaiRevenue] = useState(0)
const [qrisRevenue, setQrisRevenue] = useState(0)
const [tunaiOrders, setTunaiOrders] = useState(0)
const [qrisOrders, setQrisOrders] = useState(0)

// Update fetchDashboardData
const getPaymentBreakdown = (orders) => {
  let tunai = 0, qris = 0, tunaiCount = 0, qrisCount = 0
  orders.forEach(order => {
    if (order.payment_method === 'tunai') {
      tunai += order.total_amount
      tunaiCount++
    } else if (order.payment_method === 'qris') {
      qris += order.total_amount
      qrisCount++
    }
  })
  return { tunaiRevenue: tunai, qrisRevenue: qris, tunaiOrders: tunaiCount, qrisOrders: qrisCount }
}

// Add cards to JSX
<StatCard title="Tunai" value={formatCurrency(tunaiRevenue)} ... />
<StatCard title="QRIS" value={formatCurrency(qrisRevenue)} ... />
```

#### 2. Top 5 Items Chart
```
New Component: TopItemsChart.tsx

Show:
- Item name
- Quantity sold
- Revenue per item
- Simple bar chart
```

**Implementation:**
```typescript
// Create component: src/components/TopItemsChart.tsx
interface TopItem {
  menu_name: string
  total_qty: number
  total_revenue: number
}

// Fetch logic in Dashboard.tsx
const getTopItems = async (orders) => {
  // Get order items dari orders
  // Group by menu
  // Sum quantities and revenue
  // Sort by quantity desc
  // Take top 5
}

// Display in bar chart
// Or simple table if chart too complex
```

#### 3. Recent Orders Enhancement
```
Add column: Customer Name

Before:
| Order # | Total | Payment | Status | Time |

After:
| Order # | Customer | Total | Payment | Status | Time |
```

**Implementation:**
```typescript
// Orders table row
<td className="px-6 py-4 text-sm">
  {order.customer_name || 'Walk-in'}
</td>
```

### Time Estimate: 2-3 hours
### Difficulty: Easy to Medium

### Testing Checklist
- [ ] Payment breakdown shows correct amounts
- [ ] Top items list appears
- [ ] Customer names display in table
- [ ] Responsive on mobile
- [ ] Colors match theme

---

## 🎯 Feature #3: Orders Page Enhancement

**Goal:** Add order detail modal, delete, restore, edit, payment change

### What to Add

#### 1. Order Detail Modal
```
New Component: OrderDetailModal.tsx

Show:
- Order ID & number
- Customer name
- Order items list
- Total price
- Payment method
- Payment status
- Order status
- Created date/time
- Order notes (if any)
```

**Implementation:**
```typescript
// Component structure
interface OrderDetailModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void  // Callback untuk refresh data
}

// Inside modal:
<div>
  <h2>Order #{order.order_number}</h2>
  <p>Customer: {order.customer_name}</p>
  
  <table>
    <thead>Menu | Qty | Price | Subtotal</thead>
    <tbody>
      {order.items?.map(item => (...))}
    </tbody>
  </table>
  
  <div>Total: {formatCurrency(order.total_price)}</div>
  <div>Payment: {order.payment_method}</div>
  <div>Status: {order.status}</div>
  
  <ActionButtons>
    {/* Edit, Delete, View Receipt, etc */}
  </ActionButtons>
</div>
```

#### 2. Edit Order Functionality
```
Edit form inside modal:
- Customer name (editable)
- Order items (editable qty)
- Notes (editable)
- Remove items option
```

**Implementation:**
```typescript
const updateOrder = async (orderId, updates) => {
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
  return { data, error }
}
```

#### 3. Delete Order (Soft Delete)
```
Button in modal: Delete
Action: Mark deleted_at timestamp
Effect: Soft delete (can restore later)
```

**Implementation:**
```typescript
const deleteOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', orderId)
    .is('deleted_at', null)  // Only if not already deleted
  return { data, error }
}
```

#### 4. Change Payment Method
```
Dialog/Modal:
- Select new payment method
- Confirm action
- Update order
```

**Implementation:**
```typescript
const changePaymentMethod = async (orderId, newMethod) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_method: newMethod })
    .eq('id', orderId)
  return { data, error }
}
```

#### 5. View Receipt
```
Show/Download receipt view:
- Order details
- Items breakdown
- Grand total
- Payment method used
- Date/time
```

### Time Estimate: 3-4 hours
### Difficulty: Medium

### Components Needed
- OrderDetailModal.tsx
- EditOrderForm.tsx (inside modal)
- DeleteConfirmation.tsx

### Testing Checklist
- [ ] Modal opens/closes
- [ ] Order details display correctly
- [ ] Edit saves changes
- [ ] Delete works (soft delete)
- [ ] Payment method change works
- [ ] Receipt views correctly
- [ ] Mobile responsive

---

## 🎯 Feature #4: Trash/Deleted Orders Page

**Goal:** Create new page to manage deleted orders

### What to Add

#### 1. New Page: Trash.tsx
```
Path: src/pages/Trash.tsx

Show:
- List of deleted orders
- Date deleted
- Reason? (optional)
- Restore button per order
- Permanent delete button
- Filter by date
- Search functionality
```

**Implementation:**
```typescript
const fetchDeletedOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .not('deleted_at', 'is', null)  // Only deleted orders
    .gte('deleted_at', startDate)
    .order('deleted_at', { ascending: false })
}

const restoreOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ deleted_at: null })
    .eq('id', orderId)
}

const permanentlyDeleteOrder = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
}
```

#### 2. Add Navigation Item
```typescript
// Update Layout.tsx sidebar
<NavItem href="/trash" label="Trash" icon={Trash2} />
```

#### 3. Add Route
```typescript
// Update App.tsx
<Route path="/trash" element={<Trash />} />
```

### Time Estimate: 3-4 hours
### Difficulty: Medium

### Testing Checklist
- [ ] Deleted orders display
- [ ] Restore works
- [ ] Permanent delete works
- [ ] Filter by date works
- [ ] Search works
- [ ] Confirmation before delete
- [ ] Mobile responsive

---

## 🎯 Feature #5: Daily History Enhancement

**Goal:** Enhance daily history page dengan breakdown lebih detail

### What to Add

#### 1. Date Picker
```
Allow owner to select specific date
Show only orders dari hari itu
```

#### 2. Payment Method Breakdown
```
- Tunai total
- QRIS total
- Order count per method
```

#### 3. Top Items for Day
```
Show best selling items untuk hari itu
```

#### 4. Order Items Breakdown
```
Tabel detail:
| Menu | Qty | Price | Revenue |
```

**Implementation:**
```typescript
const fetchDailyData = async (date) => {
  const startDate = new Date(date).toISOString().split('T')[0]
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu:menu_id (name, price)
      )
    `)
    .gte('created_at', `${startDate}T00:00:00`)
    .lt('created_at', `${startDate}T23:59:59`)
}
```

### Time Estimate: 2-3 hours
### Difficulty: Easy

---

## 🎯 Feature #6: Kasir Page - Create Orders

**Goal:** Add ability untuk owner membuat orders langsung dari dashboard

### What to Add

#### 1. Create Order Form
```
Form fields:
- Customer name
- Select menu items (dropdown + qty)
- Add more items button
- Remove item button
- Notes
- Payment method
- Submit button
```

#### 2. Order Success
```
Show:
- Order number
- Order receipt
- Print button
- Done button
```

### Time Estimate: 4-5 hours
### Difficulty: Hard

---

## 🎯 Feature #7: Menu Management

**Goal:** Manage menus directly dari dashboard

### What to Add

#### 1. Menu List Page
```
Table:
| Menu Name | Category | Price | Available | Actions |
```

#### 2. Add Menu
```
Form:
- Menu name
- Description
- Price
- Category (dropdown)
- Image upload
- Availability toggle
```

#### 3. Edit Menu
```
Same form as add
Pre-populate dengan existing data
```

#### 4. Delete Menu
```
Confirmation dialog
Soft delete or hard delete?
```

### Time Estimate: 4-5 hours
### Difficulty: Hard

---

## ⏱️ Implementation Timeline

**Recommended order:**
```
Week 1:
- Day 1-2: Dashboard Enhancement
- Day 3-4: Orders Enhancement
- Day 5: Kasir Page (Create Orders) - Part 1

Week 2:
- Day 1-2: Kasir Page (Create Orders) - Part 2
- Day 3-4: Trash Page
- Day 5: Daily History Enhancement

Week 3:
- Day 1-2: Menu Management
- Day 3-5: Testing & Refinement
```

**Total: ~2-3 weeks untuk complete feature parity**

---

## 🎨 Components to Create

```
Priority order:
1. OrderDetailModal.tsx
2. EditOrderForm.tsx
3. TopItemsChart.tsx
4. PaymentMethodCard.tsx
5. TrashOrders.tsx (as page, not component)
6. KasirForm.tsx
7. MenuList.tsx
8. MenuForm.tsx
```

---

## 📊 API Functions to Add

**In `lib/api.ts`:**
```typescript
// Orders
getOrderDetail(orderId)
updateOrder(orderId, updates)
deleteOrder(orderId)  // soft delete
restoreOrder(orderId)
changePaymentMethod(orderId, method)
getDeletedOrders(startDate, endDate)
permanentlyDeleteOrder(orderId)

// Top Items
getTopItems(startDate, endDate, limit)

// Menus
getAllMenus()
createMenu(data)
updateMenu(menuId, data)
deleteMenu(menuId)
toggleMenuAvailability(menuId)

// Orders Creation
createOrder(orderData)
addOrderItem(orderId, itemData)
```

---

## ✅ Deployment Strategy

**Phase approach:**
1. Feature complete on feature branch
2. Test thoroughly locally
3. Create PR with description
4. Get review (if team)
5. Merge to main
6. Deploy to production

**For each feature:**
- Create feature branch: `feature/dashboard-enhancement`
- Commit regularly
- Merge when complete and tested

---

## 🎯 Success Criteria

### For each feature:
- [ ] Works like Laravel version
- [ ] Fully responsive
- [ ] No console errors
- [ ] TypeScript strict mode passes
- [ ] Performance acceptable
- [ ] Edge cases handled
- [ ] User feedback (loading, errors)
- [ ] Mobile tested

---

## 💡 Pro Tips

1. **Start with UI first**, then logic
2. **Test with real data** from Supabase
3. **Keep components small** (single responsibility)
4. **Reuse existing components** (StatCard, Loading, etc)
5. **Handle edge cases** (empty data, errors)
6. **Mobile first** design approach
7. **Use TypeScript** types properly
8. **Lazy load** components jika needed

---

## 📞 Questions to Consider

- Should deleted orders be recoverable forever?
- What's the maximum order edit window?
- Can kasir edit orders or only owner?
- Image upload size limit for menus?
- Payment method change restrictions?

---

**Ready to build? Pick next feature and start! 🚀**

