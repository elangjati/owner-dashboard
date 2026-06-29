import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { Download, TrendingUp } from 'lucide-react'

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

interface CategoryBreakdown {
  category: string
  revenue: number
  orders: number
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const CATEGORY_COLORS: Record<string, string> = {
  food: '#A0522D',
  beverage: '#3B82F6',
  snack: '#F59E0B',
  dessert: '#EC4899',
}

const CATEGORY_LABELS: Record<string, string> = {
  food: '🍗 Makanan',
  beverage: '🥤 Minuman',
  snack: '🍿 Cemilan',
  dessert: '🍰 Dessert',
}

export default function Reports() {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'daily' | 'monthly'>('monthly')

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [years, setYears] = useState<number[]>([])
  const [tunaiRevenue, setTunaiRevenue] = useState(0)
  const [qrisRevenue, setQrisRevenue] = useState(0)
  const [tunaiOrders, setTunaiOrders] = useState(0)
  const [qrisOrders, setQrisOrders] = useState(0)

  // Get available years
  useEffect(() => {
    const fetchYears = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('created_at', { count: 'exact', head: false })
        .eq('status', 'completed')

      if (!error && data) {
        const uniqueYears = new Set<number>()
        data.forEach(order => {
          uniqueYears.add(new Date(order.created_at).getFullYear())
        })
        const sortedYears = Array.from(uniqueYears).sort((a, b) => b - a)
        if (sortedYears.length === 0) {
          sortedYears.push(new Date().getFullYear())
        }
        setYears(sortedYears)
      }
    }
    fetchYears()
  }, [])

  useEffect(() => {
    fetchReports()
  }, [mode, selectedDate, selectedYear, selectedMonth])

  const fetchReports = async () => {
    try {
      setLoading(true)
      let startDate: Date
      let endDate: Date

      if (mode === 'daily') {
        startDate = new Date(selectedDate)
        endDate = new Date(selectedDate)
        endDate.setDate(endDate.getDate() + 1)
      } else {
        // Monthly mode
        startDate = new Date(selectedYear, selectedMonth - 1, 1)
        endDate = new Date(selectedYear, selectedMonth, 1)
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString())
        .eq('status', 'completed')

      if (error) throw error

      // Calculate payment method breakdown
      let tunai = 0
      let qris = 0
      let tunaiCount = 0
      let qrisCount = 0

      // Group by date
      const grouped: Record<string, { revenue: number; count: number }> = {}

      orders?.forEach((order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        if (!grouped[date]) {
          grouped[date] = { revenue: 0, count: 0 }
        }
        grouped[date].revenue += order.total_price || 0
        grouped[date].count += 1

        // Track payment methods
        if (order.payment_method === 'tunai') {
          tunai += order.total_price || 0
          tunaiCount += 1
        } else if (order.payment_method === 'qris') {
          qris += order.total_price || 0
          qrisCount += 1
        }
      })

      setTunaiRevenue(tunai)
      setQrisRevenue(qris)
      setTunaiOrders(tunaiCount)
      setQrisOrders(qrisCount)

      const reportsData = Object.entries(grouped)
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.count,
          avgOrderValue: data.revenue / data.count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setReports(reportsData)

      // Fetch top items
      await fetchTopItems(startDate, endDate)

      // Fetch category breakdown
      await fetchCategoryBreakdown(startDate, endDate)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopItems = async (startDate: Date, endDate: Date) => {
    try {
      // Get order items for this period
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price,
          menu_id,
          orders!inner(created_at)
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lt('orders.created_at', endDate.toISOString())

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

  const fetchCategoryBreakdown = async (startDate: Date, endDate: Date) => {
    try {
      // Get order items with menu category info
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          menu_id,
          orders!inner(created_at)
        `)
        .gte('orders.created_at', startDate.toISOString())
        .lt('orders.created_at', endDate.toISOString())

      if (itemsError) throw itemsError

      // Get menus with categories
      const { data: menusData, error: menusError } = await supabase
        .from('menus')
        .select('id, category')

      if (menusError) throw menusError

      // Create menu category map
      const menuCategoryMap = new Map((menusData || []).map(m => [m.id, m.category]))

      // Group by category
      const categoryMap = new Map<string, { revenue: number; count: number }>()

      itemsData?.forEach((item: any) => {
        const category = menuCategoryMap.get(item.menu_id) || 'food'
        const existing = categoryMap.get(category) || { revenue: 0, count: 0 }
        categoryMap.set(category, {
          revenue: existing.revenue + ((item.price || 0) * (item.quantity || 0)),
          count: existing.count + 1,
        })
      })

      // Convert to array
      const breakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          revenue: data.revenue,
          orders: data.count,
        }))

      setCategoryBreakdown(breakdown)
    } catch (err) {
      console.error('Error fetching category breakdown:', err)
    }
  }

  const handleExport = () => {
    const periodLabel = mode === 'daily' 
      ? `laporan-${selectedDate}.csv`
      : `laporan-${MONTHS[selectedMonth - 1]}-${selectedYear}.csv`

    const csv = [
      ['ID Pesanan', 'Tanggal', 'Total (Rp)', 'Metode Bayar'],
      ...reports.map((r) => [
        '', // placeholder for order ID (would need from original data)
        r.date,
        r.revenue.toFixed(0),
        ''
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', periodLabel)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0)
  const totalOrders = reports.reduce((sum, r) => sum + r.orders, 0)
  const avgRevenue = reports.length > 0 ? totalRevenue / reports.length : 0

  const periodLabel = mode === 'daily'
    ? new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : `${MONTHS[selectedMonth - 1]} ${selectedYear}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-500 mt-2">Rekap pesanan yang sudah selesai</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="monthly"
              checked={mode === 'monthly'}
              onChange={(e) => setMode(e.target.value as 'monthly' | 'daily')}
              className="sr-only peer"
            />
            <div className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition peer-checked:border-primary-700 peer-checked:bg-primary-50 peer-checked:text-primary-800 border-gray-200 text-gray-500 hover:border-gray-300">
              Per Bulan
            </div>
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="daily"
              checked={mode === 'daily'}
              onChange={(e) => setMode(e.target.value as 'monthly' | 'daily')}
              className="sr-only peer"
            />
            <div className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition peer-checked:border-primary-700 peer-checked:bg-primary-50 peer-checked:text-primary-800 border-gray-200 text-gray-500 hover:border-gray-300">
              Per Hari
            </div>
          </label>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end">
          {mode === 'monthly' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {MONTHS.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Tanggal</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
            </div>
          )}
          <button
            onClick={fetchReports}
            className="bg-primary-800 hover:bg-primary-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition"
          >
            Tampilkan
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Pesanan</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{periodLabel}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <p className="text-xs font-medium text-gray-500 uppercase">Tunai</p>
          <div className="mt-2">
            <p className="text-lg font-bold text-orange-600">{formatCurrency(tunaiRevenue)}</p>
            <p className="text-xs text-gray-500">{tunaiOrders} pesanan</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <p className="text-xs font-medium text-gray-500 uppercase">QRIS</p>
          <div className="mt-2">
            <p className="text-lg font-bold text-purple-600">{formatCurrency(qrisRevenue)}</p>
            <p className="text-xs text-gray-500">{qrisOrders} pesanan</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
          <p className="text-xs font-medium text-gray-500 uppercase">Rata-rata</p>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{formatCurrency(avgRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">Per hari</p>
        </div>
      </div>

      {/* Top Items Section */}
      {topItems.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center gap-2">
            <TrendingUp size={20} className="text-primary-800" />
            <h2 className="text-lg font-semibold text-gray-900">Top 5 Menu Terlaris</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-primary-600 text-white rounded-full text-xs font-bold">{idx + 1}</span>
                      <p className="font-medium text-gray-900">{item.menu_name}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Terjual: {item.total_qty} item</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(item.total_revenue)}</p>
                    <p className="text-xs text-gray-500">avg: {formatCurrency(item.total_revenue / item.total_qty)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown Section */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detail Kategori</h3>
          <div className="space-y-2">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#999' }}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{CATEGORY_LABELS[cat.category] || cat.category}</p>
                    <p className="text-sm text-gray-600">{cat.orders} pesanan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(cat.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily breakdown */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Rincian {mode === 'daily' ? 'Pesanan' : 'Harian'}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tanggal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pesanan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rata-rata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {new Date(report.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(report.revenue)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{report.orders}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatCurrency(report.avgOrderValue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
