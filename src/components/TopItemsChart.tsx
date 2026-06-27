import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../lib/utils'

interface TopItem {
  menu_name: string
  total_qty: number
  total_revenue: number
}

interface TopItemsChartProps {
  items: TopItem[]
  loading?: boolean
}

export default function TopItemsChart({ items, loading }: TopItemsChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500">Loading top items...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Terlaris Hari Ini</h2>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">Belum ada pesanan hari ini</p>
        </div>
      </div>
    )
  }

  // Format data untuk recharts
  const chartData = items.map((item) => ({
    name: item.menu_name,
    Qty: item.total_qty,
    Revenue: item.total_revenue,
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Menu Terlaris Hari Ini</h2>
        <p className="text-gray-500 text-sm mt-1">Top 5 menu berdasarkan jumlah terjual</p>
      </div>

      <div className="overflow-x-auto">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="left"
              label={{ value: 'Qty', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              label={{ value: 'Revenue (Rp)', angle: 90, position: 'insideRight' }}
            />
            <Tooltip 
              formatter={(value: any) => {
                if (typeof value === 'number') {
                  return value > 1000 ? formatCurrency(value) : value
                }
                return value
              }}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="Qty" fill="#8884d8" name="Jumlah" />
            <Bar yAxisId="right" dataKey="Revenue" fill="#82ca9d" name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table view for detailed breakdown */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Menu</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Qty</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-900">{item.menu_name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{item.total_qty}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {formatCurrency(item.total_revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
