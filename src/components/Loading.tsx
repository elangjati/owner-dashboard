export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-white font-bold text-2xl">K</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Kopay Dashboard</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  )
}
