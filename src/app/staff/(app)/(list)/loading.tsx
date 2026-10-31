/** Skeleton while the requests load. It pulses gently and stays still under reduced motion (see .skeleton). */
export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-8 pb-16" aria-busy="true">
      <p className="sr-only" role="status">
        Loading requests…
      </p>
      <div className="skeleton h-8 w-40 rounded-chip bg-fill" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[104px] rounded-card bg-fill" />
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-16 rounded-card bg-fill" />
        ))}
      </div>
    </main>
  );
}
