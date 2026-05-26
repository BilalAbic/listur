export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Ana sayfa skeleton */}
      <div className="flex items-center gap-3 mb-8 animate-pulse">
        <div className="w-48 h-9 bg-gray-200 rounded-xl" />
        <div className="flex-1" />
        <div className="w-32 h-9 bg-gray-200 rounded-xl" />
      </div>

      {/* Filtre skeleton */}
      <div className="flex gap-2 mb-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-24 h-9 bg-gray-200 rounded-full" />
        ))}
      </div>

      {/* Kart grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="w-full h-44 bg-gray-200" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-16 h-5 bg-gray-200 rounded-full" />
                <div className="w-12 h-5 bg-gray-200 rounded-full" />
              </div>
              <div className="w-3/4 h-5 bg-gray-200 rounded" />
              <div className="w-full h-4 bg-gray-100 rounded" />
              <div className="w-2/3 h-4 bg-gray-100 rounded" />
              <div className="flex items-center justify-between pt-2">
                <div className="w-24 h-4 bg-gray-200 rounded" />
                <div className="w-20 h-8 bg-gray-200 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
