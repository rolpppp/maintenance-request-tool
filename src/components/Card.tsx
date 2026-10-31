import type { ReactNode } from 'react';

/** White card with an optional heading (HANDOFF §4.3). `aside` sits on the heading row's right. */
export function Card({ title, aside, children, className = '' }: { title?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border border-line bg-surface p-5 shadow-card ${className}`}>
      {(title || aside) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-[650] tracking-[-0.012em]">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
