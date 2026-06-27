export default function Trash() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sampah</h1>
        <p className="text-gray-500 mt-2">Kelola pesanan yang telah dihapus</p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="flex gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Penghapusan Permanen</h3>
            <p className="text-blue-700">
              Pesanan yang dihapus akan langsung dihapus secara permanen dari database dan tidak dapat dipulihkan.
              Tidak ada halaman sampah untuk menampilkan pesanan yang telah dihapus.
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-lg p-12 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-semibold text-green-900 mb-1">Tidak Ada Pesanan Terhapus</h3>
        <p className="text-green-700">Semua pesanan Anda dalam kondisi baik!</p>
      </div>
    </div>
  )
}
