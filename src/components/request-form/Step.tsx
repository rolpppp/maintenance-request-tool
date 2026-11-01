'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { isTyping, scrollTo } from './focus';

/**
 * One numbered section. Later steps animate in as they appear; step 1 is there from the start (no page-load motion).
 * `announce`: the step appeared because of something the person did, so bring it into view and
 * focus its heading (skipped mid-typing). Read once, when the step first appears.
 */
export function Step({ n, title, reveal = true, announce = false, children }: { n: number; title: string; reveal?: boolean; announce?: boolean; children: ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [announceOnMount] = useState(announce);

  useEffect(() => {
    if (!announceOnMount || isTyping()) return;
    heading.current?.focus({ preventScroll: true });
    if (section.current) scrollTo(section.current, 'start');
  }, [announceOnMount]);

  return (
    <section ref={section} aria-labelledby={`step-${n}-title`} className={`mt-9 scroll-mt-4 ${reveal ? 'motion-reveal' : ''}`}>
      <p className="text-[13px] font-semibold text-accent">Step {n} of 4</p>
      <h2 ref={heading} id={`step-${n}-title`} tabIndex={-1} className="mt-1 text-[21px] leading-[1.25] font-[650] tracking-[-0.02em] outline-none">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
