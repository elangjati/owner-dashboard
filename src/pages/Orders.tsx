import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'
import { Search } from 'lucide-react'
import OrderDetailModal from '../components/OrderDetailModal'
import type { Order } from '../types'

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [dateRange])

  const getDateFilter = () => {
    const now = new Date()
    let startDate: Date

    if (dateRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (dateRange === 'week') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
    } else {
      startDate = new Date(now)
      startDate.setMonth(now.getMonth() - 1)
    }

    return startDate.toISOString()
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
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
        .gte('created_at', getDateFilter())
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(
    (order) =>
      (order.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order)
    setModalOpen(true)
  }

  const handleUpdateOrders = () => {
    setModalOpen(false)
    fetchOrders()
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-2">View all orders and their details</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleOpenModal(order)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-primary-800">
                      #{String(order.id).padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total_price || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.payment_method || 'Cash'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status || 'pending')}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {filteredOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Average Order Value</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(
                  filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0) /
                    filteredOrders.length
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={handleUpdateOrders}
      />
    </div>
  )
}
