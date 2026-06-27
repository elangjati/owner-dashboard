import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { Plus, Trash2, Check } from 'lucide-react'
import type { Menu, Order } from '../types'

interface OrderItemForm {
  menu_id: string
  quantity: number
  price: number
}

export default function Kasir() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'qris'>('tunai')
  const [orderItems, setOrderItems] = useState<OrderItemForm[]>([])
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('menus')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true })

      if (fetchError) throw fetchError
      setMenus(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat menu')
    } finally {
      setLoading(false)
    }
  }

  const addItem = (menu: Menu) => {
    const existingItem = orderItems.find((item) => item.menu_id === menu.id.toString())

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.menu_id === menu.id.toString()
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      )
    } else {
      setOrderItems([
        ...orderItems,
        {
          menu_id: menu.id.toString(),
          quantity: 1,
          price: menu.price,
        },
      ])
    }
  }

  const removeItem = (menuId: string) => {
    setOrderItems(orderItems.filter((item) => item.menu_id !== menuId))
  }

  const updateQuantity = (menuId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuId)
    } else {
      setOrderItems(
        orderItems.map((item) =>
          item.menu_id === menuId ? { ...item, quantity } : item
        )
      )
    }
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const handleCreateOrder = async () => {
    try {
      setError(null)
      setCreating(true)

      if (orderItems.length === 0) {
        setError('Tambahkan minimal 1 item pesanan')
        return
      }

      const totalAmount = calculateTotal()

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            customer_name: customerName || 'Walk-in',
            total_price: totalAmount,
            payment_method: paymentMethod,
            status: 'completed',
            notes,
            created_at: new Date().toISOString(),
          },
        ])
        .select()

      if (orderError) throw orderError
      if (!orderData || orderData.length === 0) throw new Error('Gagal membuat pesanan')

      const orderId = orderData[0].id

      // Create order items
      const itemsToInsert = orderItems.map((item) => ({
        order_id: orderId,
        menu_id: item.menu_id,
        quantity: item.quantity,
        price: item.price,
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Set success state
      setCreatedOrder({
        id: orderId,
        customer_name: customerName || 'Walk-in',
        total_price: totalAmount,
        payment_method: paymentMethod,
        status: 'completed',
        notes,
        created_at: new Date().toISOString(),
        order_items: orderItems.map((item, idx) => ({
          id: `temp-${idx}`,
          order_id: orderId,
          menu_id: item.menu_id,
          quantity: item.quantity,
          price: item.price,
        })),
      })

      setSuccess(true)

      // Reset form
      setTimeout(() => {
        resetForm()
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat pesanan')
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setCustomerName('')
    setNotes('')
    setPaymentMethod('tunai')
    setOrderItems([])
    setSuccess(false)
    setCreatedOrder(null)
  }

  const total = calculateTotal()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mb-4 text-3xl">📦</div>
          <p className="text-gray-600">Memuat menu...</p>
        </div>
      </div>
    )
  }

  if (success && createdOrder) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Pesanan Berhasil Dibuat!</h2>
          <p className="text-green-700 mb-4">Order #{createdOrder.id}</p>
          <p className="text-lg font-bold text-green-900 mb-6">
            Total: {formatCurrency(createdOrder.total_price || 0)}
          </p>

          {/* Receipt Preview */}
          <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-md mx-auto mb-6">
            <div className="border-b pb-4 mb-4">
              <h3 className="font-bold text-lg">STRUK PESANAN</h3>
              <p className="text-sm text-gray-600">Order: #{createdOrder.id}</p>
              <p className="text-sm text-gray-600">
                {new Date(createdOrder.created_at).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Items */}
            <div className="border-b pb-4 mb-4 text-left text-sm">
              {createdOrder.order_items?.map((item, idx) => {
                const menu = menus.find((m) => m.id.toString() === item.menu_id)
                return (
                  <div key={idx} className="flex justify-between mb-2">
                    <span>
                      {menu?.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatCurrency((item.price || 0) * (item.quantity || 0))}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Totals */}
            <div className="text-left text-sm mb-4">
              <div className="flex justify-between font-bold mb-2">
                <span>TOTAL:</span>
                <span>{formatCurrency(createdOrder.total_price || 0)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Metode:</span>
                <span className="font-medium capitalize">
                  {createdOrder.payment_method || 'Tunai'}
                </span>
              </div>
            </div>

            {createdOrder.notes && (
              <div className="text-left text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <p className="font-medium mb-1">Catatan:</p>
                <p>{createdOrder.notes}</p>
              </div>
            )}
          </div>

          <button
            onClick={resetForm}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
          >
            Buat Pesanan Baru
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">📦 Buat Pesanan</h1>
        <p className="text-gray-500 mt-2">Tambah pesanan baru dari dashboard</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Selection */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pilih Menu</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-600 hover:shadow transition cursor-pointer"
                  onClick={() => addItem(menu)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{menu.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{menu.category}</p>
                    </div>
                    <Plus className="text-primary-600" size={20} />
                  </div>
                  <p className="text-lg font-bold text-primary-800">
                    {formatCurrency(menu.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Ringkasan Pesanan</h2>

            {/* Items List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orderItems.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Belum ada item</p>
              ) : (
                orderItems.map((item) => {
                  const menu = menus.find((m) => m.id.toString() === item.menu_id)
                  const subtotal = item.price * item.quantity
                  return (
                    <div key={item.menu_id} className="border-b pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{menu?.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.price)} x {item.quantity}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.menu_id)}
                          className="text-red-600 hover:text-red-800 transition ml-2"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.menu_id, parseInt(e.target.value))
                          }
                          className="w-12 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-sm font-bold text-gray-900 flex-1">
                          {formatCurrency(subtotal)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Divider */}
            <div className="border-t pt-3"></div>

            {/* Total */}
            <div className="bg-primary-50 p-3 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-primary-800">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Customer & Payment */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Opsional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan pesanan"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as 'tunai' | 'qris')
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-600 outline-none"
                >
                  <option value="tunai">Tunai</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleCreateOrder}
                disabled={creating || orderItems.length === 0}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check size={18} />
                {creating ? 'Membuat...' : 'Buat Pesanan'}
              </button>
              <button
                onClick={resetForm}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
