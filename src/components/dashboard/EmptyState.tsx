import type { ReactNode } from 'react';

/** Centered message for an empty, filtered-out or failed list. */
export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface px-6 py-12 text-center shadow-card">
      <h2 className="text-[17px] font-semibold tracking-[-0.012em]">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-[420px] text-muted">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
