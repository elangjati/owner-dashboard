import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

function formatRupiah(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff} detik lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`
  return `${Math.floor(diff / 86400)} hari lalu`
}

export default function Dashboard() {
  const [todayOrders, setTodayOrders] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [totalMenus, setTotalMenus] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()

    const sub = supabase
      .channel('dashboard_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchDashboard()
      })
      .subscribe()

    return () => { sub.unsubscribe() }
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const startWIB = `${y}-${m}-${d}T00:00:00+07:00`
      const endWIB   = `${y}-${m}-${d}T23:59:59+07:00`

      // Fetch semua pesanan hari ini
      const { data: todayData } = await supabase
        .from('orders')
        .select(`id, customer_name, total_price, status, payment_method, created_at, order_items(id, quantity, price, menu_id, menus(name))`)
        .gte('created_at', startWIB)
        .lte('created_at', endWIB)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const all = todayData || []
      const completed = all.filter(o => o.status === 'completed')
      const pending = all.filter(o => o.status === 'pending')

      setTodayOrders(all.length)
      setTodayRevenue(completed.reduce((s, o) => s + (o.total_price || 0), 0))
      setPendingOrders(pending.length)
      setOrders(all as Order[])

      // Total menu aktif
      const { count } = await supabase
        .from('menus')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', true)
      setTotalMenus(count || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'completed')
      return <span className="text-xs px-2 py-1 rounded-full font-semibold bg-green-50 text-green-700 border border-green-200">Selesai</span>
    if (status === 'pending')
      return <span className="text-xs px-2 py-1 rounded-full font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">Pending</span>
    return <span className="text-xs px-2 py-1 rounded-full font-semibold bg-gray-100 text-gray-600">{status}</span>
  }

  return (
    <>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan aktivitas hari ini</p>
      </div>

      {/* Stats Cards — 4 kotak seperti Laravel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Pesanan Hari Ini */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#f0f5f0] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#3d6b3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <span className="inline-block h-7 w-10 bg-gray-100 rounded animate-pulse" /> : todayOrders}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pesanan Hari Ini</p>
        </div>

        {/* Pendapatan */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {loading ? <span className="inline-block h-7 w-24 bg-gray-100 rounded animate-pulse" /> : formatRupiah(todayRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Pendapatan Hari Ini</p>
        </div>

        {/* Menunggu Bayar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {loading ? <span className="inline-block h-7 w-8 bg-gray-100 rounded animate-pulse" /> : pendingOrders}
          </p>
          <p className="text-xs text-gray-500 mt-1">Menunggu Bayar</p>
        </div>

        {/* Menu Aktif */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {loading ? <span className="inline-block h-7 w-8 bg-gray-100 rounded animate-pulse" /> : totalMenus}
          </p>
          <p className="text-xs text-gray-500 mt-1">Menu Aktif</p>
        </div>
      </div>

      {/* Quick Actions — 3 tombol seperti Laravel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link
          to="/orders"
          className="bg-[#1a3a1a] hover:bg-[#122812] text-white rounded-xl p-4 transition shadow-sm hover:shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Riwayat Hari Ini</p>
            <p className="text-xs text-[#b3ccb3]">Lihat pesanan hari ini</p>
          </div>
        </Link>

        <Link
          to="/menus"
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 transition shadow-sm hover:shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-[#f0f5f0] rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[#3d6b3d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">Kelola Menu</p>
            <p className="text-xs text-gray-500">Tambah atau edit menu</p>
          </div>
        </Link>

        <Link
          to="/reports"
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-xl p-4 transition shadow-sm hover:shadow flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">Laporan</p>
            <p className="text-xs text-gray-500">Rekap penjualan</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders Table — persis seperti Laravel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Pesanan Terbaru</h3>
          <span className="text-xs text-gray-400">{orders.length} pesanan</span>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Pelanggan</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Bayar</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Memuat data...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-medium text-gray-500">Belum ada pesanan</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const items = (order as any).order_items || []
                  const itemStr = items.map((i: any) => `${i.menus?.name || '?'} x${i.quantity}`).join(', ')
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-5 py-3 font-mono text-xs text-gray-400">#{String(order.id).padStart(4, '0')}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{order.customer_name}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs max-w-[180px] truncate">{itemStr || '—'}</td>
                      <td className="px-5 py-3 font-semibold text-[#3d6b3d]">{formatRupiah(order.total_price || 0)}</td>
                      <td className="px-5 py-3 text-xs capitalize text-gray-500">{order.payment_method || '—'}</td>
                      <td className="px-5 py-3">{getStatusBadge(order.status || 'pending')}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{order.created_at ? timeAgo(order.created_at) : '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">Belum ada pesanan</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono">#{String(order.id).padStart(4, '0')}</span>
                    <span className="font-semibold text-gray-900 text-sm">{order.customer_name}</span>
                  </div>
                  <span className="font-bold text-[#3d6b3d] text-sm">{formatRupiah(order.total_price || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(order.status || 'pending')}
                  <span className="text-xs text-gray-400">{order.created_at ? timeAgo(order.created_at) : '—'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
