import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

function formatRupiah(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()

    const sub = supabase
      .channel('orders_today')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => { sub.unsubscribe() }
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const startWIB = `${y}-${m}-${d}T00:00:00+07:00`
      const endWIB   = `${y}-${m}-${d}T23:59:59+07:00`

      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(id, quantity, price, menu_id, menus(name))`)
        .gte('created_at', startWIB)
        .lte('created_at', endWIB)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data || []) as Order[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const completed = orders.filter(o => o.status === 'completed')
  const totalRevenue = completed.reduce((s, o) => s + (o.total_price || 0), 0)

  const getStatusBadge = (status: string) => {
    if (status === 'completed')
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Selesai</span>
    if (status === 'pending')
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{status}</span>
  }

  const todayLabel = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Riwayat Pesanan Hari Ini</h2>
          <p className="text-sm text-gray-500 mt-0.5">{todayLabel}</p>
        </div>
      </div>

      {orders.length === 0 && !loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-400 text-sm">Belum ada pesanan hari ini.</p>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Pesanan</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <span className="inline-block h-7 w-8 bg-gray-100 rounded animate-pulse" /> : orders.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Selesai</p>
              <p className="text-2xl font-bold text-green-600">
                {loading ? <span className="inline-block h-7 w-8 bg-gray-100 rounded animate-pulse" /> : completed.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pendapatan</p>
              <p className="text-2xl font-bold text-[#3d6b3d]">
                {loading ? <span className="inline-block h-7 w-24 bg-gray-100 rounded animate-pulse" /> : formatRupiah(totalRevenue)}
              </p>
            </div>
          </div>

          {/* Desktop table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelanggan</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayar</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Memuat data...</td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const items = (order as any).order_items || []
                    const itemStr = items.map((i: any) => `${i.menus?.name || 'Menu dihapus'} x${i.quantity}`).join(', ')
                    const time = order.created_at
                      ? new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '—'
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{String(order.id).padStart(4, '0')}</td>
                        <td className="px-5 py-3.5 font-medium text-gray-900">{order.customer_name}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs max-w-xs truncate">{itemStr || '—'}</td>
                        <td className="px-5 py-3.5 font-semibold text-[#3d6b3d]">{formatRupiah(order.total_price || 0)}</td>
                        <td className="px-5 py-3.5">{getStatusBadge(order.status || 'pending')}</td>
                        <td className="px-5 py-3.5 text-gray-500 text-xs capitalize">{order.payment_method || '—'}</td>
                        <td className="px-5 py-3.5 text-gray-400 text-xs">{time}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
            ) : (
              orders.map((order) => {
                const items = (order as any).order_items || []
                const itemStr = items.map((i: any) => `${i.menus?.name || 'Menu dihapus'} x${i.quantity}`).join(', ')
                const time = order.created_at
                  ? new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : '—'
                return (
                  <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-gray-400">#{String(order.id).padStart(4, '0')}</span>
                          <span className="font-semibold text-gray-900 text-sm">{order.customer_name}</span>
                        </div>
                        <p className="text-xs text-gray-500">{itemStr || '—'}</p>
                      </div>
                      <span className="font-bold text-[#3d6b3d] text-sm ml-3 shrink-0">{formatRupiah(order.total_price || 0)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status || 'pending')}
                      {order.payment_method && (
                        <span className="text-xs text-gray-400 capitalize">{order.payment_method}</span>
                      )}
                      <span className="text-xs text-gray-400">{time}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </>
  )
}
