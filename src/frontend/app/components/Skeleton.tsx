export function SkeletonCard() {
  return (
    <div className="glass-card p-6">
      <div className="skeleton h-4 w-24 mb-3" />
      <div className="skeleton h-8 w-32" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="min-h-screen">
      <div className="status-strip px-8 py-4">
        <div className="skeleton h-6 w-40" />
      </div>
      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="skeleton h-8 w-64 mb-2" />
        <div className="skeleton h-4 w-48 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="skeleton h-5 w-40 mb-4" />
            <div className="skeleton h-64 w-full" />
          </div>
          <div className="glass-card p-6">
            <div className="skeleton h-5 w-40 mb-4" />
            <div className="skeleton h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}