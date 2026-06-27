import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit2, Trash2, AlertCircle, Check } from 'lucide-react'
import type { Menu } from '../types'

interface MenuFormData {
  name: string
  description: string
  price: number
  category: string
  is_available: boolean
}

export default function Menus() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    description: '',
    price: 0,
    category: 'food',
    is_available: true,
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: err } = await supabase
        .from('menus')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) throw err
      setMenus(data || [])
    } catch (err) {
      setError('Gagal mengambil data menu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value
    }))
  }

  const handleToggleAvailability = async (menu: Menu) => {
    try {
      const { error } = await supabase
        .from('menus')
        .update({ is_available: !menu.is_available })
        .eq('id', menu.id)

      if (error) throw error

      setMenus(menus.map(m => 
        m.id === menu.id ? { ...m, is_available: !m.is_available } : m
      ))
      setSuccess(`Menu "${menu.name}" berhasil diupdate`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Gagal mengupdate menu')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Nama menu tidak boleh kosong')
      return
    }

    if (formData.price <= 0) {
      setError('Harga harus lebih dari 0')
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (editingId) {
        // Update existing menu
        const { error } = await supabase
          .from('menus')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error

        setMenus(menus.map(m =>
          m.id === editingId ? { ...m, ...formData } : m
        ))
        setSuccess('Menu berhasil diupdate')
      } else {
        // Create new menu
        const { data, error } = await supabase
          .from('menus')
          .insert([formData])
          .select()

        if (error) throw error

        if (data) {
          setMenus([data[0], ...menus])
          setSuccess('Menu berhasil ditambahkan')
        }
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: 'food',
        is_available: true,
      })
      setEditingId(null)
      setShowForm(false)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Gagal menyimpan menu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (menu: Menu) => {
    setFormData({
      name: menu.name,
      description: menu.description,
      price: menu.price,
      category: menu.category,
      is_available: menu.is_available,
    })
    setEditingId(menu.id)
    setShowForm(true)
    setError(null)
  }

  const handleDelete = async (menuId: string) => {
    try {
      setDeleting(true)
      const { error } = await supabase
        .from('menus')
        .delete()
        .eq('id', menuId)

      if (error) throw error

      setMenus(menus.filter(m => m.id !== menuId))
      setSuccess('Menu berhasil dihapus')
      setDeleteConfirm(null)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Gagal menghapus menu')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'food',
      is_available: true,
    })
    setError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manajemen Menu</h1>
          <p className="text-gray-500 mt-2">Tambah, edit, atau hapus menu produk</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
          >
            <Plus size={20} />
            Tambah Menu
          </button>
        )}
      </div>

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
          <Check className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-primary-600">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Menu' : 'Tambah Menu Baru'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Menu *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Ayam Goreng"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga (Rp) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
                >
                  <option value="food">Makanan</option>
                  <option value="beverage">Minuman</option>
                  <option value="snack">Cemilan</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={formData.is_available}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Tersedia</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Deskripsi menu (opsional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
              >
                {loading ? 'Menyimpan...' : editingId ? 'Update Menu' : 'Tambah Menu'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menus Table/Grid */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && !showForm ? (
          <div className="p-8 text-center text-gray-500">
            <p>Memuat data...</p>
          </div>
        ) : menus.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg font-medium">Belum ada menu</p>
            <p className="text-sm mt-1">Mulai dengan menambahkan menu baru</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {menus.map((menu) => (
                  <tr key={menu.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {menu.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {menu.category === 'food' && '🍗 Makanan'}
                        {menu.category === 'beverage' && '🥤 Minuman'}
                        {menu.category === 'snack' && '🍿 Cemilan'}
                        {menu.category === 'dessert' && '🍰 Dessert'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      Rp {menu.price.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {menu.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleAvailability(menu)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          menu.is_available
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {menu.is_available ? '✓ Tersedia' : '✗ Tidak Tersedia'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(menu)}
                          className="text-blue-600 hover:text-blue-800 font-medium p-1 hover:bg-blue-50 rounded"
                          title="Edit menu"
                        >
                          <Edit2 size={18} />
                        </button>
                        {deleteConfirm === menu.id ? (
                          <div className="flex gap-1 bg-red-50 p-1 rounded">
                            <button
                              onClick={() => handleDelete(menu.id)}
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
                            onClick={() => setDeleteConfirm(menu.id)}
                            className="text-red-600 hover:text-red-800 font-medium p-1 hover:bg-red-50 rounded"
                            title="Hapus menu"
                          >
                            <Trash2 size={18} />
                          </button>
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

      {/* Summary Stats */}
      {menus.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs text-gray-600 font-medium mb-1">Total Menu</p>
            <p className="text-2xl font-bold text-gray-900">{menus.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-xs text-gray-600 font-medium mb-1">Menu Tersedia</p>
            <p className="text-2xl font-bold text-gray-900">{menus.filter(m => m.is_available).length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-xs text-gray-600 font-medium mb-1">Menu Tidak Tersedia</p>
            <p className="text-2xl font-bold text-gray-900">{menus.filter(m => !m.is_available).length}</p>
          </div>
        </div>
      )}
    </div>
  )
}
