'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { markDone, updateStatus } from '@/app/staff/actions';
import { Card } from '@/components/Card';
import { StatusDot } from '@/components/StatusPill';
import { useSave } from '@/components/Toast';
import { MarkDoneDialog, type DoneSummary } from '@/components/request-detail/MarkDoneDialog';
import { STATUS_META, STATUS_ORDER, type RequestStatus } from '@/config/status';

type Props = { requestId: string; status: RequestStatus; summary: DoneSummary };

export function StatusCard({ requestId, status, summary }: Props) {
  const save = useSave();
  const [pending, startTransition] = useTransition();
  // Shows the new status while saving; if the save fails it falls back to the real one.
  const [shown, setShown] = useOptimistic(status);
  const [confirmingDone, setConfirmingDone] = useState(false);

  function choose(next: RequestStatus) {
    if (next === shown || pending) return;
    // Closing a request asks first and offers a note about the work.
    if (next === 'done') {
      setConfirmingDone(true);
      return;
    }
    startTransition(async () => {
      setShown(next);
      await save(() => updateStatus(requestId, next));
    });
  }

  function confirmDone(note: string) {
    startTransition(async () => {
      setShown('done');
      // On failure the dialog stays open, so the typed note isn't lost.
      if ((await save(() => markDone(requestId, note))).ok) setConfirmingDone(false);
    });
  }

  return (
    <Card title="Status">
      <div className="grid grid-cols-2 gap-2">
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === shown}
            onClick={() => choose(s)}
            className="flex h-11 items-center gap-2 rounded-chip border border-line px-3 text-left text-sm font-semibold transition-[transform,border-color] duration-120 hover:border-line-strong active:scale-[0.98] aria-pressed:border-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-ink)]"
          >
            <StatusDot status={s} />
            {STATUS_META[s].label}
          </button>
        ))}
      </div>
      <MarkDoneDialog
        open={confirmingDone}
        from={status}
        summary={summary}
        pending={pending}
        onConfirm={confirmDone}
        onClose={() => setConfirmingDone(false)}
      />
    </Card>
  );
}
