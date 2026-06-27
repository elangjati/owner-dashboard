import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateShort } from '../lib/utils'
import { Calendar, Trash2, Eye, AlertCircle } from 'lucide-react'
import type { Order } from '../types'

interface DailySummary {
  date: string
  total: number
  completed: number
  pending: number
  cancelled: number
  revenue: number
  tunaiRevenue?: number
  qrisRevenue?: number
}

interface TopItem {
  menu_name: string
  total_qty: number
  total_revenue: number
}

export default function DailyHistory() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [orders, setOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchDailyHistory()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(orders => orders.filter(o => o.id !== payload.old.id))
          fetchDailyHistory()
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [date])

  const fetchDailyHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const startDate = `${date}T00:00:00`
      const endDate = `${date}T23:59:59`

      // Get orders for the day
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            price,
            menu_id,
            menu:menu_id(id, name)
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Calculate summary
      let totalOrders = 0
      let completedOrders = 0
      let pendingOrders = 0
      let cancelledOrders = 0
      let totalRevenue = 0
      let tunaiRevenue = 0
      let qrisRevenue = 0

      ordersData?.forEach((order) => {
        totalOrders++
        if (order.status === 'completed') completedOrders++
        else if (order.status === 'pending') pendingOrders++
        else if (order.status === 'cancelled') cancelledOrders++

        totalRevenue += order.total_price || 0

        if (order.payment_method === 'tunai') {
          tunaiRevenue += order.total_price || 0
        } else if (order.payment_method === 'qris') {
          qrisRevenue += order.total_price || 0
        }
      })

      setSummary({
        date,
        total: totalOrders,
        completed: completedOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
        revenue: totalRevenue,
        tunaiRevenue,
        qrisRevenue,
      })

      setOrders(ordersData || [])

      // Fetch top items
      await fetchTopItems(startDate, endDate)
    } catch (err) {
      setError('Gagal mengambil data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopItems = async (startDate: string, endDate: string) => {
    try {
      // Get order items for the day
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          menu_id,
          orders!inner(created_at)
        `)
        .gte('orders.created_at', startDate)
        .lte('orders.created_at', endDate)

      if (itemsError) throw itemsError

      // Get menus
      const { data: menusData, error: menusError } = await supabase
        .from('menus')
        .select('id, name')

      if (menusError) throw menusError

      // Create menu map
      const menuMap = new Map((menusData || []).map(m => [m.id, m.name]))

      // Group and calculate
      const itemMap = new Map<string, { qty: number; revenue: number }>()

      itemsData?.forEach((item: any) => {
        const menuName = menuMap.get(item.menu_id) || `Menu ${item.menu_id}`
        const existing = itemMap.get(menuName) || { qty: 0, revenue: 0 }
        itemMap.set(menuName, {
          qty: existing.qty + (item.quantity || 0),
          revenue: existing.revenue + ((item.price || 0) * (item.quantity || 0)),
        })
      })

      // Convert to array and sort
      const topItemsList = Array.from(itemMap.entries())
        .map(([name, data]) => ({
          menu_name: name,
          total_qty: data.qty,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_qty - a.total_qty)
        .slice(0, 5)

      setTopItems(topItemsList)
    } catch (err) {
      console.error('Error fetching top items:', err)
    }
  }

  const handleDelete = async (orderId: number | string) => {
    try {
      setDeleting(true)
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
      
      if (error) {
        setError('Gagal menghapus pesanan: ' + error.message)
        console.error(error)
      } else {
        setDeleteConfirm(null)
      }
    } catch (err) {
      setError('Gagal menghapus pesanan')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Riwayat Harian</h1>
        <p className="text-gray-500 mt-2">Lihat dan kelola pesanan per hari</p>
      </div>

      {/* Date Picker */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Tanggal
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              />
              <button
                onClick={() => setDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
              >
                Hari Ini
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-red-900">Terjadi kesalahan</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {summary && !loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Pesanan</p>
              <p className="text-2xl font-bold text-blue-900">{summary.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">Selesai</p>
              <p className="text-2xl font-bold text-green-900">{summary.completed}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <p className="text-xs text-yellow-600 font-medium mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">{summary.pending}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <p className="text-xs text-red-600 font-medium mb-1">Batal</p>
              <p className="text-2xl font-bold text-red-900">{summary.cancelled}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">Pendapatan</p>
              <p className="text-xl font-bold text-purple-900">Rp {summary.revenue.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">Tunai</p>
                  <p className="text-2xl font-bold text-gray-900">Rp {(summary.tunaiRevenue || 0).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-500 mt-1">💰 Metode pembayaran tunai</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium mb-1">QRIS</p>
                  <p className="text-2xl font-bold text-gray-900">Rp {(summary.qrisRevenue || 0).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-gray-500 mt-1">📱 Metode pembayaran digital</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Items */}
          {topItems.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Menu Terlaris</h3>
              <div className="space-y-3">
                {topItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{idx + 1}. {item.menu_name}</p>
                      <p className="text-sm text-gray-600">Terjual: {item.total_qty} item</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">Rp {item.total_revenue.toLocaleString('id-ID')}</p>
                      <p className="text-xs text-gray-500">per item: Rp {(item.total_revenue / item.total_qty).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <p>Memuat data...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="mx-auto mb-3 text-gray-400" size={40} />
            <p>Tidak ada pesanan pada tanggal {formatDateShort(date)}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-primary-800">
                      #{String(order.id).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {order.items?.map(i => `${i.menu?.name || 'Menu'} x${i.quantity}`).join(', ') || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      Rp {order.total_price?.toLocaleString('id-ID') || '0'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'pending')}`}>
                        {order.status === 'completed' ? '✓ Selesai' : 
                         order.status === 'pending' ? '⏳ Pending' : '✗ Batal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.payment_method?.toUpperCase() || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.created_at ? new Date(order.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.location.href = `/orders/${order.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          title="Lihat detail"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status === 'completed' && (
                          <>
                            {deleteConfirm === order.id ? (
                              <div className="flex gap-1 bg-red-50 p-1 rounded">
                                <button
                                  onClick={() => handleDelete(order.id)}
                                  disabled={deleting}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 bg-red-100 rounded"
                                >
                                  {deleting ? '...' : 'Yakin?'}
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="text-gray-600 hover:text-gray-800 text-xs font-medium px-2 py-1 bg-gray-100 rounded"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(order.id)}
                                className="text-red-600 hover:text-red-800 font-medium"
                                title="Hapus pesanan"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
