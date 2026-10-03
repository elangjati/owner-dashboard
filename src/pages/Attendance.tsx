import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function formatRupiah(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

interface AttendanceRow {
  id: number
  staff_name: string
  clock_in: string
  clock_out: string | null
  created_at: string
}

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [attendances, setAttendances] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    clockIn: '',
    clockOut: '',
  })

  useEffect(() => {
    fetchAttendances()
  }, [selectedDate])

  const fetchAttendances = async () => {
    setLoading(true)
    try {
      const startOfDay = new Date(selectedDate + 'T00:00:00+07:00')
      const endOfDay = new Date(selectedDate + 'T23:59:59+07:00')

      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .gte('clock_in', startOfDay.toISOString())
        .lte('clock_in', endOfDay.toISOString())
        .order('clock_in', { ascending: false })

      if (error) throw error
      setAttendances((data || []) as AttendanceRow[])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (clockIn: string, clockOut: string | null) => {
    const start = new Date(clockIn)
    const end = clockOut ? new Date(clockOut) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const todayLabel = formatDate(selectedDate + 'T12:00:00')

  const activeCount = attendances.filter(a => !a.clock_out).length
  const completedCount = attendances.filter(a => a.clock_out).length

  const handleEdit = (attendance: AttendanceRow) => {
    setEditingId(attendance.id)
    const clockInLocal = new Date(attendance.clock_in).toISOString().slice(0, 16)
    const clockOutLocal = attendance.clock_out 
      ? new Date(attendance.clock_out).toISOString().slice(0, 16)
      : ''
    setEditForm({
      clockIn: clockInLocal,
      clockOut: clockOutLocal,
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return

    try {
      const updateData: any = {
        clock_in: new Date(editForm.clockIn).toISOString(),
      }

      if (editForm.clockOut) {
        updateData.clock_out = new Date(editForm.clockOut).toISOString()
      }

      const { error } = await supabase
        .from('attendances')
        .update(updateData)
        .eq('id', editingId)

      if (error) throw error

      setEditingId(null)
      fetchAttendances()
    } catch (err) {
      console.error(err)
      alert('Gagal update absensi')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({ clockIn: '', clockOut: '' })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Absensi Staff</h2>
          <p className="text-sm text-gray-500 mt-0.5">Monitoring kehadiran staff</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a1a] bg-white"
            />
          </div>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Hari Ini
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && attendances.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Staff</p>
            <p className="text-2xl font-bold text-gray-900">{attendances.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Masih Aktif</p>
            <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Sudah Selesai</p>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Detail Absensi - {todayLabel}</h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama Staff</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Masuk</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Keluar</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Durasi</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 text-sm">Memuat data...</td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada absensi pada tanggal {todayLabel}
                  </td>
                </tr>
              ) : (
                attendances.map((attendance, idx) => (
                  <tr key={attendance.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{idx + 1}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{attendance.staff_name}</td>
                    
                    {editingId === attendance.id ? (
                      <>
                        <td className="px-5 py-3.5">
                          <input
                            type="datetime-local"
                            value={editForm.clockIn}
                            onChange={(e) => setEditForm({ ...editForm, clockIn: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <input
                            type="datetime-local"
                            value={editForm.clockOut}
                            onChange={(e) => setEditForm({ ...editForm, clockOut: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">—</td>
                        <td className="px-5 py-3.5 text-gray-400">Edit</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5 text-gray-600">{formatTime(attendance.clock_in)}</td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {attendance.clock_out ? formatTime(attendance.clock_out) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {calculateDuration(attendance.clock_in, attendance.clock_out)}
                        </td>
                        <td className="px-5 py-3.5">
                          {attendance.clock_out ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                              Selesai
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                              Aktif
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    
                    <td className="px-5 py-3.5">
                      {editingId === attendance.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-xs font-medium text-green-600 hover:text-green-800"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-xs font-medium text-gray-600 hover:text-gray-800"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(attendance)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Memuat data...</div>
          ) : attendances.length === 0 ? (
            <div className="text-center text-gray-400 py-12 text-sm">
              Tidak ada absensi pada tanggal ini
            </div>
          ) : (
            attendances.map((attendance) => (
              <div key={attendance.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-gray-900 text-sm">{attendance.staff_name}</div>
                  {attendance.clock_out ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Aktif
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Masuk: {formatTime(attendance.clock_in)}</div>
                  <div>Keluar: {attendance.clock_out ? formatTime(attendance.clock_out) : '—'}</div>
                  <div>Durasi: {calculateDuration(attendance.clock_in, attendance.clock_out)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
