import { useState, useEffect } from 'react'
import { X, Edit2, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'

interface OrderDetailModalProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onUpdate,
}: OrderDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    customer_name: '',
    notes: '',
    payment_method: 'tunai',
    status: 'pending',
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form when order changes
  useEffect(() => {
    if (order) {
      setEditForm({
        customer_name: order.customer_name || '',
        notes: order.notes || '',
        payment_method: order.payment_method || 'tunai',
        status: order.status || 'pending',
      })
      setIsEditing(false)
    }
  }, [order])

  if (!isOpen || !order) return null

  // Calculate total from order_items
  const total = order.order_items?.reduce((sum, item) => {
    return sum + ((item.price || 0) * (item.quantity || 0))
  }, 0) || 0

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          customer_name: editForm.customer_name,
          notes: editForm.notes,
          payment_method: editForm.payment_method,
          status: editForm.status,
          total_price: total,
        })
        .eq('id', order.id)

      if (updateError) throw updateError

      setIsEditing(false)
      onUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      // Delete order items first
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id)

      if (itemsError) throw itemsError

      // Then delete order
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id)

      if (deleteError) throw deleteError

      onUpdate()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pesanan')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-800 to-primary-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Order #{order.id}</h2>
            <p className="text-primary-100 text-sm">{formatDate(order.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-primary-600 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Customer & Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informasi Pelanggan</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, customer_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 outline-none"
                    placeholder="Nama pelanggan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 outline-none"
                    placeholder="Catatan pesanan"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Pelanggan:</strong> {order.customer_name || 'Walk-in'}
                </p>
                {order.notes && (
                  <p className="text-sm text-gray-600">
                    <strong>Catatan:</strong> {order.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Item Pesanan</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-600">Menu</th>
                    <th className="px-4 py-2 text-right text-gray-600">Qty</th>
                    <th className="px-4 py-2 text-right text-gray-600">Harga</th>
                    <th className="px-4 py-2 text-right text-gray-600">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-900">
                          {item.menu?.name || `Menu ${item.menu_id}`}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600">{item.quantity}</td>
                        <td className="px-4 py-2 text-right text-gray-600">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {formatCurrency((item.price || 0) * (item.quantity || 0))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                        Tidak ada item
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment & Status & Total */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Pembayaran & Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Metode</p>
                {isEditing ? (
                  <select
                    value={editForm.payment_method}
                    onChange={(e) =>
                      setEditForm({ ...editForm, payment_method: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 outline-none text-sm"
                  >
                    <option value="tunai">Tunai</option>
                    <option value="qris">QRIS</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-900 capitalize">
                    {editForm.payment_method}
                  </p>
                )}
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-2">Status</p>
                {isEditing ? (
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 outline-none text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <p className="font-medium text-blue-900 capitalize">{editForm.status}</p>
                )}
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-green-600 mb-1">Total</p>
                <p className="font-bold text-xl text-green-900">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                >
                  Batal
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center justify-center gap-2"
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Yakin hapus pesanan ini?')) {
                      handleDelete()
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 size={16} /> {isDeleting ? 'Menghapus...' : 'Hapus'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
