import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatRupiah(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

interface DailyReport {
  date: string
  revenue: number
  orders: number
  avgOrderValue: number
}

interface TopItem {
  menu_name: string
  total_qty: number
  total_revenue: number
}

interface OrderRow {
  id: number
  customer_name: string
  total_price: number
  payment_method: string
  created_at: string
  order_items: { quantity: number; price: number; menu_id: number; menus?: { name: string } }[]
}

export default function Reports() {
  const [mode, setMode] = useState<'monthly' | 'daily'>('monthly')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [years, setYears] = useState<number[]>([new Date().getFullYear()])
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [completedOrders, setCompletedOrders] = useState<OrderRow[]>([])
  const [tunaiRevenue, setTunaiRevenue] = useState(0)
  const [qrisRevenue, setQrisRevenue] = useState(0)
  const [tunaiOrders, setTunaiOrders] = useState(0)
  const [qrisOrders, setQrisOrders] = useState(0)
  const [monthlyData, setMonthlyData] = useState<Record<number, number>>({})

  useEffect(() => {
    const fetchYears = async () => {
      const { data } = await supabase.from('orders').select('created_at').eq('status', 'completed').is('deleted_at', null)
      if (data) {
        const unique = [...new Set(data.map(o => new Date(o.created_at).getFullYear()))].sort((a, b) => b - a)
        setYears(unique.length ? unique : [new Date().getFullYear()])
      }
    }
    fetchYears()
  }, [])

  useEffect(() => { fetchReports() }, [mode, selectedDate, selectedYear, selectedMonth])

  const fetchReports = async () => {
    setLoading(true)
    try {
      let startDate: Date, endDate: Date
      if (mode === 'daily') {
        startDate = new Date(selectedDate + 'T00:00:00+07:00')
        endDate = new Date(selectedDate + 'T23:59:59+07:00')
      } else {
        startDate = new Date(selectedYear, selectedMonth - 1, 1)
        endDate = new Date(selectedYear, selectedMonth, 1)
      }

      const { data: orders } = await supabase
        .from('orders')
        .select(`*, order_items(quantity, price, menu_id, menus(name))`)
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .eq('status', 'completed')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      const all = (orders || []) as OrderRow[]
      setCompletedOrders(all)

      let tunai = 0, qris = 0, tunaiCount = 0, qrisCount = 0
      const grouped: Record<string, { revenue: number; count: number }> = {}

      all.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        if (!grouped[date]) grouped[date] = { revenue: 0, count: 0 }
        grouped[date].revenue += order.total_price || 0
        grouped[date].count += 1
        if (order.payment_method === 'tunai') { tunai += order.total_price || 0; tunaiCount++ }
        else if (order.payment_method === 'qris') { qris += order.total_price || 0; qrisCount++ }
      })

      setTunaiRevenue(tunai); setQrisRevenue(qris)
      setTunaiOrders(tunaiCount); setQrisOrders(qrisCount)

      const reportsData = Object.entries(grouped)
        .map(([date, data]) => ({ date, revenue: data.revenue, orders: data.count, avgOrderValue: data.revenue / data.count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setReports(reportsData)

      // Top items
      const itemMap = new Map<string, { qty: number; revenue: number }>()
      all.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const name = item.menus?.name || `Menu ${item.menu_id}`
          const ex = itemMap.get(name) || { qty: 0, revenue: 0 }
          itemMap.set(name, { qty: ex.qty + (item.quantity || 0), revenue: ex.revenue + (item.price || 0) * (item.quantity || 0) })
        })
      })
      setTopItems(Array.from(itemMap.entries()).map(([n, d]) => ({ menu_name: n, total_qty: d.qty, total_revenue: d.revenue })).sort((a, b) => b.total_qty - a.total_qty).slice(0, 5))

      // Monthly bar chart data (only in monthly mode)
      if (mode === 'monthly') {
        const { data: yearOrders } = await supabase
          .from('orders').select('created_at, total_price')
          .gte('created_at', new Date(selectedYear, 0, 1).toISOString())
          .lt('created_at', new Date(selectedYear + 1, 0, 1).toISOString())
          .eq('status', 'completed').is('deleted_at', null)
        const mData: Record<number, number> = {}
        ;(yearOrders || []).forEach(o => {
          const mo = new Date(o.created_at).getMonth() + 1
          mData[mo] = (mData[mo] || 0) + (o.total_price || 0)
        })
        setMonthlyData(mData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }


  const handleExport = () => {
    const dateLabel = mode === 'daily'
      ? selectedDate
      : `${MONTHS[selectedMonth - 1]}-${selectedYear}`

    const lines: string[] = []

    // === Section 1: Orders ===
    lines.push(`LAPORAN ORDERS - ${mode === 'daily' ? selectedDate : `${MONTHS[selectedMonth-1]} ${selectedYear}`}`)
    lines.push('Order ID,Pelanggan,Total (Rp),Status,Metode Bayar,Waktu')
    completedOrders.forEach(o => {
      const waktu = o.created_at
        ? new Date(o.created_at).toLocaleString('id-ID')
        : ''
      lines.push(`${String(o.id).padStart(4,'0')},"${o.customer_name}",${o.total_price || 0},completed,${o.payment_method || ''},"${waktu}"`)
    })

    lines.push('')

    // === Section 2: Order Items ===
    lines.push('DETAIL ITEM PESANAN')
    lines.push('Order ID,Pelanggan,Nama Menu,Qty,Harga Satuan,Subtotal,Metode Bayar,Waktu')
    completedOrders.forEach(o => {
      const waktu = o.created_at ? new Date(o.created_at).toLocaleString('id-ID') : ''
      const items = o.order_items || []
      if (items.length === 0) {
        lines.push(`${String(o.id).padStart(4,'0')},"${o.customer_name}","—",0,0,0,${o.payment_method || ''},"${waktu}"`)
      } else {
        items.forEach((item: any) => {
          const menuName = item.menus?.name || `Menu ${item.menu_id}`
          const subtotal = (item.price || 0) * (item.quantity || 0)
          lines.push(`${String(o.id).padStart(4,'0')},"${o.customer_name}","${menuName}",${item.quantity},${item.price || 0},${subtotal},${o.payment_method || ''},"${waktu}"`)
        })
      }
    })

    lines.push('')

    // === Section 3: Rekap Produk ===
    lines.push('REKAP PRODUK TERJUAL')
    lines.push('Nama Menu,Qty Terjual,Total Revenue (Rp)')
    topItems.forEach(item => {
      lines.push(`"${item.menu_name}",${item.total_qty},${item.total_revenue}`)
    })

    lines.push('')

    // === Section 4: Summary ===
    lines.push('RINGKASAN')
    lines.push(`Total Pesanan,${totalOrders}`)
    lines.push(`Total Pendapatan,${totalRevenue}`)
    lines.push(`Tunai,${tunaiRevenue},${tunaiOrders} pesanan`)
    lines.push(`QRIS,${qrisRevenue},${qrisOrders} pesanan`)
    lines.push(`Rata-rata per Pesanan,${Math.round(avgPerOrder)}`)

    const csv = '\uFEFF' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `laporan-kopay-${dateLabel}.csv`
    link.click()
  }

  const totalRevenue = reports.reduce((s, r) => s + r.revenue, 0)
  const totalOrders = reports.reduce((s, r) => s + r.orders, 0)
  const avgPerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const maxMonthlyRev = Math.max(...Object.values(monthlyData), 1)

  const periodLabel = mode === 'daily'
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : `${MONTHS[selectedMonth - 1]} ${selectedYear}`


  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Rekap Penjualan</h2>
          <p className="text-sm text-gray-500 mt-0.5">Laporan pesanan yang sudah selesai</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex gap-2 mb-4">
          {(['monthly', 'daily'] as const).map(m => (
            <label key={m} className="cursor-pointer">
              <input type="radio" name="mode" value={m} checked={mode === m} onChange={() => setMode(m)} className="sr-only peer" />
              <div className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition peer-checked:border-[#1a3a1a] peer-checked:bg-[#f0f5f0] peer-checked:text-[#1a3a1a] border-gray-200 text-gray-500 hover:border-gray-300">
                {m === 'monthly' ? 'Per Bulan' : 'Per Hari'}
              </div>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          {mode === 'monthly' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Tahun</label>
                <select value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}
                  className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] bg-white">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Bulan</label>
                <select value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}
                  className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] bg-white">
                  {MONTHS.map((name, i) => <option key={i} value={i + 1}>{name}</option>)}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Tanggal</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] bg-white" />
            </div>
          )}
          <button onClick={fetchReports}
            className="bg-[#1a3a1a] hover:bg-[#122812] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition shadow-sm">
            Tampilkan
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 border border-[#1a3a1a] text-[#1a3a1a] hover:bg-[#f0f5f0] text-sm font-medium px-5 py-2.5 rounded-xl transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards — 5 kotak seperti Laravel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Pesanan Selesai', value: loading ? '—' : totalOrders.toString(), color: 'text-gray-900', bg: 'bg-[#f0f5f0]', icon: 'text-[#3d6b3d]' },
          { label: 'Total Pendapatan', value: loading ? '—' : formatRupiah(totalRevenue), color: 'text-green-600', bg: 'bg-green-50', icon: 'text-green-600' },
          { label: 'Tunai', value: loading ? '—' : formatRupiah(tunaiRevenue), sub: `${tunaiOrders} pesanan`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'text-emerald-600' },
          { label: 'QRIS', value: loading ? '—' : formatRupiah(qrisRevenue), sub: `${qrisOrders} pesanan`, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'text-blue-600' },
          { label: 'Rata-rata / Pesanan', value: loading ? '—' : formatRupiah(avgPerOrder), color: 'text-gray-900', bg: 'bg-amber-50', icon: 'text-amber-600' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
            {!card.sub && <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-1 ${mode === 'monthly' ? 'lg:grid-cols-2' : ''} gap-5 mb-6`}>
        {/* Top Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Menu Terlaris — {periodLabel}
          </h3>
          {topItems.length === 0 ? (
            <div className="text-center py-10"><p className="text-sm text-gray-400">Belum ada data penjualan</p></div>
          ) : topItems.map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between py-3 ${idx < topItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${idx === 0 ? 'bg-[#1a3a1a] text-white' : idx === 1 ? 'bg-gray-200 text-gray-700' : idx === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{idx + 1}</span>
                <span className="text-sm text-gray-700">{item.menu_name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{item.total_qty} porsi</p>
                <p className="text-xs text-gray-400">{formatRupiah(item.total_revenue)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly bar chart */}
        {mode === 'monthly' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Rekap Per Bulan — {selectedYear}</h3>
            <div className="space-y-2.5">
              {MONTHS.map((name, i) => {
                const mo = i + 1
                const rev = monthlyData[mo] || 0
                const pct = rev > 0 ? Math.max(Math.round((rev / maxMonthlyRev) * 100), 8) : 0
                return (
                  <div key={mo} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-10 shrink-0 font-medium">{name.slice(0, 3)}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className={`h-5 rounded-full transition-all duration-500 ${mo === selectedMonth ? 'bg-[#1a3a1a]' : 'bg-[#8cb38c]'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-600 w-24 text-right shrink-0 font-medium">
                      {rev > 0 ? formatRupiah(rev) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Detail Pesanan Selesai — {periodLabel}</h3>
        </div>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelanggan</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Bayar</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Memuat data...</td></tr>
              ) : completedOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Belum ada pesanan selesai periode ini</td></tr>
              ) : completedOrders.map(order => {
                const items = order.order_items || []
                const itemStr = items.map((i: any) => `${i.menus?.name || 'Menu dihapus'} x${i.quantity}`).join(', ')
                return (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">#{String(order.id).padStart(4, '0')}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{order.customer_name}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[200px] truncate">{itemStr || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-[#3d6b3d]">{formatRupiah(order.total_price || 0)}</td>
                    <td className="px-5 py-3.5 text-xs capitalize text-gray-500">{order.payment_method || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
          ) : completedOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">Belum ada pesanan selesai periode ini.</div>
          ) : completedOrders.map(order => (
            <div key={order.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">#{String(order.id).padStart(4, '0')}</span>
                  <span className="font-semibold text-gray-900 text-sm">{order.customer_name}</span>
                </div>
                <span className="font-bold text-[#3d6b3d] text-sm">{formatRupiah(order.total_price || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
                <span className="text-xs capitalize text-gray-500">{order.payment_method || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
