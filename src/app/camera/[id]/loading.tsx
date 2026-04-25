export default function CameraDetailLoading() {
  return (
    <div aria-label="Loading camera" className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="h-4 w-16 rounded bg-[var(--color-elevated)] animate-pulse" />
        <div className="h-4 w-24 rounded bg-[var(--color-elevated)] animate-pulse" />
      </div>

      {/* Main grid */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 pb-20 md:pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed column */}
        <div data-testid="feed-skeleton" className="lg:col-span-2 flex flex-col gap-6">
          {/* Camera feed card */}
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]">
            <div className="aspect-video w-full bg-[var(--color-elevated)] animate-pulse" />
            <div className="p-4 flex flex-col gap-3">
              <div className="h-5 w-48 rounded bg-[var(--color-elevated)] animate-pulse" />
              <div className="h-3 w-32 rounded bg-[var(--color-elevated)] animate-pulse" />
              <div className="flex gap-2 pt-1">
                <div className="h-9 flex-1 rounded-lg bg-[var(--color-elevated)] animate-pulse" />
                <div className="h-9 w-20 rounded-lg bg-[var(--color-elevated)] animate-pulse" />
              </div>
            </div>
          </div>

          {/* Recommendations card */}
          <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="h-3 w-28 rounded bg-[var(--color-elevated)] animate-pulse" />
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-4 w-4 rounded bg-[var(--color-elevated)] animate-pulse shrink-0 mt-0.5" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-3/4 rounded bg-[var(--color-elevated)] animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-[var(--color-elevated)] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div data-testid="sidebar-skeleton" className="flex flex-col gap-4">
          {/* Context panel */}
          <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="h-3 w-24 rounded bg-[var(--color-elevated)] animate-pulse" />
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-3 w-20 rounded bg-[var(--color-elevated)] animate-pulse" />
                  <div className="h-3 w-16 rounded bg-[var(--color-elevated)] animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Info card */}
          <div className="border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)]">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="h-3 w-20 rounded bg-[var(--color-elevated)] animate-pulse" />
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="h-3 w-full rounded bg-[var(--color-elevated)] animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-[var(--color-elevated)] animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-[var(--color-elevated)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
