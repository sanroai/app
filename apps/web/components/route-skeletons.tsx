/**
 * Route-level skeletons.
 *
 * These render while the next route's payload/chunks are in flight, so a click
 * always produces an immediate, correctly-shaped placeholder instead of a frozen
 * page or a blank flash. Each screen keeps its own in-page skeleton for the
 * data-fetch phase; these cover the navigation phase before React mounts.
 */

export function CardGridSkeleton({ cards = 6, columns = 3 }: { cards?: number; columns?: number }) {
  return (
    <div
      className={
        columns === 4
          ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
      }
      aria-hidden="true"
    >
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card"
        >
          <div className="h-28 w-full animate-pulse bg-surface-100" />
          <div className="space-y-3 p-4">
            <div className="h-2 w-full animate-pulse rounded-full bg-surface-100" />
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-100" />
              <div className="h-3 w-8 animate-pulse rounded bg-surface-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({
  titleWidth = 'w-56',
  subtitleWidth = 'w-80',
  cards = 6,
  columns = 3,
}: {
  titleWidth?: string;
  subtitleWidth?: string;
  cards?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div>
        <div className={`h-8 ${titleWidth} animate-pulse rounded-lg bg-surface-100`} />
        <div className={`mt-2 h-4 ${subtitleWidth} animate-pulse rounded bg-surface-100`} />
      </div>
      <CardGridSkeleton cards={cards} columns={columns} />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="h-40 animate-pulse rounded-3xl bg-surface-100" />
      <div className="flex gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 flex-1 animate-pulse rounded-xl bg-surface-50" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-50" />
        ))}
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
