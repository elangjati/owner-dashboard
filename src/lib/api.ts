// API service untuk koneksi ke Laravel backend
const API_URL = 'http://localhost:8000/api' // Ubah ke production URL nanti

interface ApiResponse<T> {
  data?: T
  message?: string
  error?: string
}

interface Order {
  id: number
  order_number: string
  customer_name: string
  total_price: number
  status: 'pending' | 'completed' | 'cancelled'
  payment_method: 'tunai' | 'qris'
  payment_status?: string
  notes?: string
  created_at: string
  items?: OrderItem[]
}

interface OrderItem {
  id: number
  menu_id: number
  quantity: number
  price: number
  menu?: {
    id: number
    name: string
    category: string
    price: number
  }
}

interface DailyHistorySummary {
  date: string
  total: number
  completed: number
  pending: number
  cancelled: number
  revenue: number
}

// Auth token dari localStorage
function getAuthToken() {
  return localStorage.getItem('auth_token')
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, any>
): Promise<ApiResponse<T>> {
  const token = getAuthToken()
  
  if (!token) {
    return { error: 'Tidak ada token autentikasi' }
  }

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.message || `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { data: data as T }
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error)
    return { error: error instanceof Error ? error.message : 'Kesalahan jaringan' }
  }
}

// Orders API
export const ordersApi = {
  // Dapatkan riwayat harian
  async getDailyHistory(date: string) {
    return apiCall<{
      orders: Order[]
      summary: DailyHistorySummary
    }>(`/orders/daily-history?date=${date}`)
  },

  // Dapatkan pesanan berdasarkan range tanggal
  async getOrders(startDate: string, endDate?: string) {
    let endpoint = `/orders?start_date=${startDate}`
    if (endDate) {
      endpoint += `&end_date=${endDate}`
    }
    return apiCall<Order[]>(endpoint)
  },

  // Hapus pesanan (soft delete)
  async deleteOrder(orderId: number) {
    return apiCall<{ message: string }>(`/orders/${orderId}`, 'DELETE')
  },

  // Pulihkan pesanan yang dihapus
  async restoreOrder(orderId: number) {
    return apiCall<{ message: string }>(`/orders/${orderId}/restore`, 'POST')
  },

  // Dapatkan pesanan yang dihapus (trash)
  async getTrash() {
    return apiCall<Order[]>(`/orders/trash`)
  },

  // Dapatkan detail pesanan
  async getOrder(orderId: number) {
    return apiCall<Order>(`/orders/${orderId}`)
  },
}

// Dashboard API
export const dashboardApi = {
  // Dapatkan statistik dashboard
  async getStats() {
    return apiCall<{
      totalRevenue: number
      totalOrders: number
      averageOrderValue: number
      recentOrders: Order[]
    }>(`/dashboard/stats`)
  },
}

// Reports API
export const reportsApi = {
  // Dapatkan laporan
  async getReports(startDate: string, endDate: string) {
    return apiCall<any>(`/reports?start_date=${startDate}&end_date=${endDate}`)
  },
}

export default {
  ordersApi,
  dashboardApi,
  reportsApi,
}
