import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showCurrentPin, setShowCurrentPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    // Validasi
    if (currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6) {
      setMessage({ type: 'error', text: 'PIN harus 6 digit' })
      return
    }

    if (newPin !== confirmPin) {
      setMessage({ type: 'error', text: 'PIN baru dan konfirmasi tidak sama' })
      return
    }

    if (newPin === currentPin) {
      setMessage({ type: 'error', text: 'PIN baru harus berbeda dengan PIN lama' })
      return
    }

    setLoading(true)

    try {
      // 1. Verifikasi PIN lama
      const { data: currentPinData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'report_pin')
        .maybeSingle()

      if (!currentPinData || currentPinData.value !== currentPin) {
        setMessage({ type: 'error', text: 'PIN lama salah' })
        setLoading(false)
        return
      }

      // 2. Update PIN baru
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'report_pin',
          value: newPin,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'PIN berhasil diubah!' })
      
      // Reset form
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (error) {
      console.error('Error updating PIN:', error)
      setMessage({ type: 'error', text: 'Gagal mengubah PIN. Silakan coba lagi.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Ganti PIN Laporan Harian
          </h2>
          <p className="text-sm text-gray-500">
            PIN digunakan kasir untuk mengakses laporan harian di aplikasi mobile
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Lama */}
          <div>
            <label htmlFor="currentPin" className="block text-sm font-medium text-gray-700 mb-1.5">
              PIN Lama
            </label>
            <div className="relative">
              <input
                type={showCurrentPin ? 'text' : 'password'}
                id="currentPin"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] focus:border-transparent text-center text-2xl font-mono tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPin ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* PIN Baru */}
          <div>
            <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-1.5">
              PIN Baru
            </label>
            <div className="relative">
              <input
                type={showNewPin ? 'text' : 'password'}
                id="newPin"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] focus:border-transparent text-center text-2xl font-mono tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPin ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Konfirmasi PIN Baru */}
          <div>
            <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-1.5">
              Konfirmasi PIN Baru
            </label>
            <div className="relative">
              <input
                type={showConfirmPin ? 'text' : 'password'}
                id="confirmPin"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] focus:border-transparent text-center text-2xl font-mono tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPin(!showConfirmPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPin ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a3a1a] text-white px-4 py-2.5 rounded-lg hover:bg-[#2d542d] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Mengubah PIN...' : 'Ubah PIN'}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informasi Penting:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>PIN harus 6 digit angka</li>
                <li>Perubahan PIN langsung berlaku di semua perangkat kasir</li>
                <li>Pastikan memberitahu kasir setelah mengganti PIN</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
