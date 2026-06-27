import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { TrendingUp, ShoppingCart, DollarSign, Zap, Wallet, CreditCard } from 'lucide-react'
import StatCard from '../components/StatCard'
import RecentOrders from '../components/RecentOrders'
import TopItemsChart from '../components/TopItemsChart'
import type { Order, DashboardStats } from '../types'

interface PaymentBreakdown {
  tunaiRevenue: number
  tunaiOrders: number
  qrisRevenue: number
  qrisOrders: number
}

interface TopItem {
  menu_name: string
  total_qty: number
  total_revenue: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    bestSellingItem: null,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown>({
    tunaiRevenue: 0,
    tunaiOrders: 0,
    qrisRevenue: 0,
    qrisOrders: 0,
  })
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()

    // Subscribe to real-time updates (updated syntax for Supabase v2)
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (_payload) => {
        fetchDashboardData()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Get today's orders
      const today = new Date().toISOString().split('T')[0]
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          total_price,
          payment_method,
          status,
          created_at,
          order_items (
            id,
            quantity,
            price,
            menu_id
          )
        `)
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)

      if (ordersError) throw ordersError

      // Calculate payment breakdown
      let tunaiRevenue = 0
      let tunaiOrders = 0
      let qrisRevenue = 0
      let qrisOrders = 0

      orders?.forEach((order) => {
        if (order.payment_method === 'tunai') {
          tunaiRevenue += order.total_price || 0
          tunaiOrders++
        } else if (order.payment_method === 'qris') {
          qrisRevenue += order.total_price || 0
          qrisOrders++
        }
      })

      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setStats({
        totalRevenue,
        totalOrders,
        averageOrderValue,
        bestSellingItem: null,
      })

      setPaymentBreakdown({
        tunaiRevenue,
        tunaiOrders,
        qrisRevenue,
        qrisOrders,
      })

      setRecentOrders(orders || [])

      // Fetch top items for today
      await fetchTopItems(today)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopItems = async (today: string) => {
    try {
      // Get all order items for today - simplified query
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, quantity, price, menu_id')

      if (itemsError) throw itemsError

      // Get all menus to map names
      const { data: menus, error: menusError } = await supabase
        .from('menus')
        .select('id, name')

      if (menusError) throw menusError

      // Get orders to filter by date
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at, status')
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'completed')

      if (ordersError) throw ordersError

      // Create maps
      const menuMap = new Map((menus || []).map(m => [m.id, m.name]))
      const orderIds = new Set((orders || []).map(o => o.id))

      // Group and calculate top items (only from today's completed orders)
      const itemMap = new Map<string, { qty: number; revenue: number }>()

      orderItems?.forEach((item: any) => {
        if (orderIds.has(item.order_id)) {
          const menuName = menuMap.get(item.menu_id) || `Menu ${item.menu_id}`
          const existing = itemMap.get(menuName) || { qty: 0, revenue: 0 }
          itemMap.set(menuName, {
            qty: existing.qty + (item.quantity || 0),
            revenue: existing.revenue + ((item.price || 0) * (item.quantity || 0)),
          })
        }
      })

      // Convert to array and sort by quantity (top 5)
      const topItemsList = Array.from(itemMap.entries())
        .map(([name, data]) => ({
          menu_name: name,
          total_qty: data.qty,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5)

      setTopItems(topItemsList)
    } catch (error) {
      console.error('Error fetching top items:', error)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Selamat datang! Berikut ringkasan bisnis Anda.</p>
      </div>

      {/* Stats Grid - Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="bg-green-100"
          textColor="text-green-600"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          icon={ShoppingCart}
          color="bg-blue-100"
          textColor="text-blue-600"
          loading={loading}
        />
        <StatCard
          title="Average Order"
          value={formatCurrency(stats.averageOrderValue)}
          icon={Zap}
          color="bg-purple-100"
          textColor="text-purple-600"
          loading={loading}
        />
        <StatCard
          title="Growth"
          value="↑ 12%"
          icon={TrendingUp}
          color="bg-orange-100"
          textColor="text-orange-600"
          loading={loading}
        />
      </div>

      {/* Payment Method Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Tunai"
          value={`${formatCurrency(paymentBreakdown.tunaiRevenue)} (${paymentBreakdown.tunaiOrders} pesanan)`}
          icon={Wallet}
          color="bg-amber-100"
          textColor="text-amber-600"
          loading={loading}
        />
        <StatCard
          title="QRIS"
          value={`${formatCurrency(paymentBreakdown.qrisRevenue)} (${paymentBreakdown.qrisOrders} pesanan)`}
          icon={CreditCard}
          color="bg-cyan-100"
          textColor="text-cyan-600"
          loading={loading}
        />
      </div>

      {/* Top Items Chart */}
      <TopItemsChart items={topItems} loading={loading} />

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} loading={loading} />
    </div>
  )
}
