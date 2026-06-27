export interface User {
  id: string
  email: string
  role: 'owner' | 'kasir'
  created_at: string
}

export interface Menu {
  id: string
  name: string
  description: string
  price: number
  category: string
  image_url?: string
  is_available: boolean
  created_at: string
}

export interface OrderItem {
  id: number | string
  order_id?: number | string
  menu_id: number | string
  quantity: number
  price: number
  notes?: string
  menu?: Menu
}

export interface Order {
  id: number | string
  order_number?: string
  customer_name?: string
  total_price?: number
  total_amount?: number
  status?: 'pending' | 'completed' | 'cancelled'
  payment_method?: 'tunai' | 'qris' | string
  payment_status?: 'pending' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
  deleted_at?: string
  items?: OrderItem[]
  order_items?: OrderItem[]
}

export interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  bestSellingItem: Menu | null
}
