import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import type { FormValues } from './form-state';

/** "Try this first": the steps come from categories.ts. Answering "Yes" ends the form; nothing is submitted. */
export function QuickCheck({
  steps,
  state,
  onChange,
}: {
  steps: string[];
  state: FormValues['quickCheck'];
  onChange: (state: FormValues['quickCheck']) => void;
}) {
  if (state === 'fixed') {
    return (
      <div role="status" className="rounded-card border border-accent-line bg-accent-tint p-5">
        <CircleCheck size={32} className="motion-pop text-accent" aria-hidden="true" />
        <p className="mt-3 text-[17px] font-semibold">Great, glad it&apos;s working.</p>
        <p className="mt-1 text-muted">Nothing else to do. If it stops again, come back any time.</p>
        <Button variant="ghost" className="mt-4 w-full" onClick={() => onChange('unanswered')}>
          It stopped working again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-card">
      <h3 className="text-[17px] font-[650] tracking-[-0.015em]">Try this first</h3>
      <p className="mt-1 text-sm text-muted">It fixes this more often than you&apos;d think.</p>
      <ol className="mt-4 space-y-2 rounded-control bg-panel p-4">
        {steps.map((step, i) => (
          <li key={step} className="flex gap-3">
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-sm font-semibold tabular-nums">{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      {state === 'still_broken' ? (
        <p className="mt-4 text-sm text-muted">Tried it, still broken. We&apos;ll pass that on to the team.</p>
      ) : (
        <>
          <p className="mt-4 font-semibold">Did that fix it?</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Button variant="ghost" onClick={() => onChange('fixed')}>
              Yes, it&apos;s fixed
            </Button>
            <Button onClick={() => onChange('still_broken')}>No, still broken</Button>
          </div>
        </>
      )}
    </div>
  );
}
