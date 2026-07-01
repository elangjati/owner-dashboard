import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

function formatRupiah(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

export default function DailyHistory() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [date])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const startWIB = `${date}T00:00:00+07:00`
      const endWIB   = `${date}T23:59:59+07:00`

      const { data, error } = await supabase
        .from('orders')
        .select(`*, order_items(id, quantity, price, menu_id, menus(name))`)
        .gte('created_at', startWIB)
        .lte('created_at', endWIB)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders((data || []) as Order[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number | string) => {
    setDeleting(true)
    try {
      const { error } = await supabase.from('orders').delete().eq('id', id)
      if (!error) {
        setOrders(prev => prev.filter(o => o.id !== id))
        setDeleteConfirm(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const completed = orders.filter(o => o.status === 'completed')
  const pending = orders.filter(o => o.status === 'pending')
  const totalRevenue = completed.reduce((s, o) => s + (o.total_price || 0), 0)
  const tunaiRevenue = completed.filter(o => o.payment_method === 'tunai').reduce((s, o) => s + (o.total_price || 0), 0)
  const qrisRevenue = completed.filter(o => o.payment_method === 'qris').reduce((s, o) => s + (o.total_price || 0), 0)

  const getStatusBadge = (status: string) => {
    if (status === 'completed')
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Selesai</span>
    if (status === 'pending')
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Dibatalkan</span>
  }

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Riwayat Pesanan</h2>
          <p className="text-sm text-gray-500 mt-0.5">{dateLabel}</p>
        </div>
      </div>

      {/* Date picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Pilih Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] bg-white"
            />
          </div>
          <button
            onClick={() => setDate(new Date().toISOString().split('T')[0])}
            className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Hari Ini
          </button>
          <button
            onClick={fetchOrders}
            className="bg-[#1a3a1a] hover:bg-[#122812] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition shadow-sm"
          >
            Tampilkan
          </button>
        </div>
      </div>

      {!loading && orders.length > 0 && (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Pesanan</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Selesai</p>
              <p className="text-2xl font-bold text-green-600">{completed.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pendapatan</p>
              <p className="text-lg font-bold text-[#3d6b3d]">{formatRupiah(totalRevenue)}</p>
            </div>
          </div>

          {/* Tunai & QRIS */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tunai</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(tunaiRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">💰 Metode pembayaran tunai</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">QRIS</p>
              <p className="text-xl font-bold text-gray-900">{formatRupiah(qrisRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">📱 Metode pembayaran digital</p>
            </div>
          </div>
        </>
      )}

      {/* Desktop Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hidden md:block">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400 text-sm">Tidak ada pesanan pada tanggal {dateLabel}</p>
          </div>
        ) : (
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => {
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
                    <td className="px-5 py-3.5">
                      {order.status === 'completed' && (
                        deleteConfirm === order.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(order.id)}
                              disabled={deleting}
                              className="text-xs font-semibold text-white px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600"
                            >
                              {deleting ? '...' : 'Yakin?'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs text-gray-600 hover:text-gray-900 px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(order.id)}
                            className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                          >
                            Hapus
                          </button>
                        )
                      )}
                      {order.status !== 'completed' && <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">Tidak ada pesanan pada tanggal ini</p>
          </div>
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
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order.status || 'pending')}
                    {order.payment_method && (
                      <span className="text-xs text-gray-400 capitalize">{order.payment_method}</span>
                    )}
                    <span className="text-xs text-gray-400">{time}</span>
                  </div>
                  {order.status === 'completed' && (
                    deleteConfirm === order.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleDelete(order.id)} disabled={deleting}
                          className="text-xs font-semibold text-white px-2.5 py-1 rounded-lg bg-red-500">
                          {deleting ? '...' : 'Yakin?'}
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="text-xs text-gray-600 px-2.5 py-1 rounded-lg border border-gray-300">
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(order.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700">
                        Hapus
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </>
  )
}
