# 🏗️ Owner Dashboard - Architecture & Components

Complete guide to the project structure and how everything works together.

---

## 📁 Folder Structure

```
owner-dashboard/
├── src/                          # Source code
│   ├── components/               # Reusable React components
│   │   ├── Layout.tsx           # Sidebar + main layout
│   │   ├── Loading.tsx          # Loading screen
│   │   ├── StatCard.tsx         # Metric card component
│   │   └── RecentOrders.tsx     # Orders table component
│   │
│   ├── pages/                    # Page components (full pages)
│   │   ├── App.tsx              # Main app router
│   │   ├── Dashboard.tsx        # Dashboard page
│   │   ├── Orders.tsx           # Orders list page
│   │   ├── Reports.tsx          # Analytics page
│   │   └── Login.tsx            # Login page
│   │
│   ├── lib/                      # Utilities & services
│   │   ├── supabase.ts          # Supabase client initialization
│   │   └── utils.ts             # Helper functions (currency, date formatting)
│   │
│   ├── types/                    # TypeScript type definitions
│   │   └── index.ts             # All interfaces/types
│   │
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global Tailwind CSS
│
├── public/                        # Static assets
├── index.html                     # HTML template
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                # Vite build config
├── tailwind.config.js             # Tailwind CSS config
├── postcss.config.js              # PostCSS config
├── .env.local                     # Environment variables (EDIT THIS!)
├── .gitignore                     # Git ignore rules
│
└── Documentation
    ├── START_HERE.md              # Quick start (read first!)
    ├── README.md                  # Full documentation
    ├── GETTING_STARTED.md         # Detailed setup guide
    ├── SETUP.md                   # Step-by-step setup
    ├── DEPLOYMENT_GUIDE.md        # Deploy to production
    ├── PROJECT_SUMMARY.md         # Technical summary
    └── ARCHITECTURE.md            # This file
```

---

## 🔄 Component Architecture

### Page Flow

```
BrowserRouter (React Router)
    ↓
App.tsx (Router & Auth check)
    ├── Login.tsx (if not authenticated)
    └── Layout (if authenticated)
        ├── Sidebar navigation
        └── Route content
            ├── Dashboard.tsx
            ├── Orders.tsx
            └── Reports.tsx
```

---

## 📦 Components Breakdown

### 1. **Layout.tsx**
**Purpose:** Main layout with sidebar navigation

**Features:**
- Sidebar with navigation links
- User info display
- Logout button
- Active page highlighting
- Responsive design

**Props:**
```typescript
interface LayoutProps {
  user: User  // Supabase user object
  children: ReactNode  // Page content
}
```

**Usage:**
```tsx
<Layout user={user}>
  <Dashboard />
</Layout>
```

---

### 2. **Loading.tsx**
**Purpose:** Loading screen display

**Features:**
- Centered loading animation
- Logo display
- App name

**Usage:**
```tsx
{loading ? <Loading /> : <MainContent />}
```

---

### 3. **StatCard.tsx**
**Purpose:** Metric card display (reusable)

**Features:**
- Title & value display
- Icon support (Lucide icons)
- Color customization
- Loading state

**Props:**
```typescript
interface StatCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: string  // Tailwind bg color
  textColor: string  // Tailwind text color
  loading?: boolean
}
```

**Usage:**
```tsx
<StatCard
  title="Total Revenue"
  value="Rp 5.000.000"
  icon={DollarSign}
  color="bg-green-100"
  textColor="text-green-600"
/>
```

---

### 4. **RecentOrders.tsx**
**Purpose:** Orders table display

**Features:**
- Table with order data
- Status badges
- Currency formatting
- Loading state
- Empty state

**Props:**
```typescript
interface RecentOrdersProps {
  orders: Order[]
  loading?: boolean
}
```

---

## 📄 Pages Breakdown

### 1. **Login.tsx**
**Purpose:** Authentication page

**Features:**
- Email input
- Password input
- Error display
- Loading state
- Beautiful gradient background

**Flow:**
```
User enters credentials
    ↓
supabase.auth.signInWithPassword()
    ↓
Success: onAuthStateChange fires
    ↓
Redirects to Dashboard
    ↓
Failure: Shows error message
```

---

### 2. **Dashboard.tsx**
**Purpose:** Main dashboard with real-time metrics

**Features:**
- Real-time stats (revenue, orders, avg)
- Recent orders table
- Live data updates via Supabase subscription
- Loading states

**Data Flow:**
```
fetchDashboardData()
    ↓
Query orders from Supabase
    ↓
Calculate stats (sum revenue, count orders)
    ↓
Subscribe to realtime changes
    ↓
Auto-refresh when new orders come
```

**Key Logic:**
```typescript
// Subscribe to real-time updates
const subscription = supabase
  .from('orders')
  .on('*', (_payload) => {
    fetchDashboardData()  // Re-fetch when data changes
  })
  .subscribe()
```

---

### 3. **Orders.tsx**
**Purpose:** Orders list with filtering

**Features:**
- Date range filter (today, week, month)
- Search by order number
- Summary statistics
- Payment status badges

**Filters:**
```typescript
- Today: from today 00:00:00
- Week: from 7 days ago
- Month: from 30 days ago
```

---

### 4. **Reports.tsx**
**Purpose:** Analytics & reporting

**Features:**
- 7-day & 30-day analytics
- Daily breakdown table
- Export to CSV
- Revenue trends

**CSV Export:**
```typescript
// Data to CSV format
[['Date', 'Revenue', 'Orders', 'Average']]
// Download as CSV file
```

---

## 🔐 Data & Auth Flow

### Authentication Flow

```
1. User opens dashboard
2. App.tsx checks session
   - if session exists → show dashboard
   - if no session → show login

3. User enters credentials
4. Supabase.auth.signInWithPassword()
5. JWT token created
6. onAuthStateChange fires
7. User state updates
8. Redirects to protected route

9. User logout
10. supabase.auth.signOut()
11. Session cleared
12. Redirects to login
```

---

### Data Fetching Pattern

```typescript
// Query example
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .gte('created_at', startDate)
  .eq('payment_status', 'completed')
  .order('created_at', { ascending: false })

// Handle error
if (error) throw error

// Use data
setOrders(data)
```

---

### Real-time Subscription

```typescript
// Subscribe to all changes in orders table
const subscription = supabase
  .from('orders')
  .on('*', (payload) => {
    console.log('New change!', payload.eventType)
    // eventType: 'INSERT', 'UPDATE', 'DELETE'
  })
  .subscribe()

// Cleanup on unmount
return () => subscription.unsubscribe()
```

---

## 🎨 Styling System

### Tailwind CSS Structure

```
src/index.css
    ↓
@tailwind base, components, utilities
    ↓
tailwind.config.js
    ↓
Custom colors defined
    ↓
Components use className
```

### Coffee Theme Colors

```javascript
coffee: {
  50: '#faf6f1',
  100: '#f5ede3',
  200: '#e8dcc7',
  300: '#d9c5a1',
  400: '#c9a87a',
  500: '#b8905f',
  600: '#a67847',  // Primary
  700: '#8b6239',
  800: '#6e4d2d',
  900: '#573a24',
}
```

---

## 📊 Database Schema

### Required Tables

**orders**
```sql
id (UUID, PK)
order_number (text)
total_amount (numeric)
payment_method (text)
payment_status (enum)
notes (text)
created_at (timestamp)
deleted_at (timestamp) -- soft delete
```

**order_items**
```sql
id (UUID, PK)
order_id (UUID, FK → orders)
menu_id (UUID, FK → menus)
quantity (integer)
price (numeric)
created_at (timestamp)
```

**menus**
```sql
id (UUID, PK)
name (text)
price (numeric)
category (text)
is_available (boolean)
created_at (timestamp)
```

---

## 🔗 API Queries

### Query Examples

```typescript
// Get today's orders
const { data } = await supabase
  .from('orders')
  .select('*')
  .gte('created_at', today)

// Get orders with items
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    order_items (
      *,
      menu:menu_id (name, price)
    )
  `)

// Search orders
const { data } = await supabase
  .from('orders')
  .select('*')
  .ilike('order_number', `%${search}%`)

// Count orders
const { count } = await supabase
  .from('orders')
  .select('*', { count: 'exact', head: true })
```

---

## 🎯 Type System

### Core Types

```typescript
interface User {
  id: string
  email: string
  role: 'owner' | 'kasir'
  created_at: string
}

interface Order {
  id: string
  order_number: string
  total_amount: number
  payment_method: string
  payment_status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  order_items?: OrderItem[]
}

interface OrderItem {
  id: string
  order_id: string
  menu_id: string
  quantity: number
  price: number
  menu?: Menu
}

interface Menu {
  id: string
  name: string
  price: number
  category: string
  is_available: boolean
}
```

---

## 🔄 State Management

### Using React Hooks

```typescript
// State
const [orders, setOrders] = useState<Order[]>([])
const [loading, setLoading] = useState(true)

// Effect for data fetching
useEffect(() => {
  fetchOrders()
}, [dateRange])

// Effect for cleanup
useEffect(() => {
  const subscription = supabase
    .from('orders')
    .on('*', () => fetchOrders())
    .subscribe()

  return () => subscription.unsubscribe()
}, [])
```

---

## 🚀 Performance Optimizations

1. **Lazy Loading:** Pages loaded only when needed
2. **Real-time Subscriptions:** Only subscribe when viewing
3. **Memoization:** Components memoized with useMemo
4. **Tailwind Purging:** Only used styles in CSS
5. **Build Optimization:** Vite minifies & chunks code

---

## 🔒 Security

1. **Environment Variables:** Secrets in .env.local
2. **Anon Key Only:** Public key for queries
3. **Row Level Security:** Enable RLS at Supabase
4. **HTTPS Only:** Production deployment
5. **No Secret Logging:** Credentials never logged

---

## 🎊 Everything Connected!

```
Owner Dashboard
    ↓
React (UI)
    ↓
Vite (Build)
    ↓
Tailwind (Styling)
    ↓
Supabase (Backend)
    ↓
PostgreSQL (Database)
    ↓
Kasir App (Data Source)
```

---

## 📝 Next Steps

1. ✅ Understand this architecture
2. ✅ Read GETTING_STARTED.md
3. ✅ Run `npm install` & `npm run dev`
4. ✅ Test features
5. ✅ Deploy to production

---

**Architecture clear? Time to build! 🚀**
