import type { ReactNode } from 'react';

/** One numbered section. Later steps animate in as they appear; step 1 is there from the start (no page-load motion). */
export function Step({ n, title, reveal = true, children }: { n: number; title: string; reveal?: boolean; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}-title`} className={`mt-9 ${reveal ? 'motion-reveal' : ''}`}>
      <p className="text-[13px] font-semibold text-accent">Step {n} of 4</p>
      <h2 id={`step-${n}-title`} className="mt-1 text-[21px] leading-[1.25] font-[650] tracking-[-0.02em]">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
