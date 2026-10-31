'use client';

import { useOptimistic, useTransition } from 'react';
import { updateStatus } from '@/app/staff/actions';
import { Card } from '@/components/Card';
import { StatusDot } from '@/components/StatusPill';
import { useSave } from '@/components/Toast';
import { STATUS_META, STATUS_ORDER, type RequestStatus } from '@/config/status';

export function StatusCard({ requestId, status }: { requestId: string; status: RequestStatus }) {
  const save = useSave();
  const [pending, startTransition] = useTransition();
  // Shows the new status while saving; if the save fails it falls back to the real one.
  const [shown, setShown] = useOptimistic(status);

  function choose(next: RequestStatus) {
    if (next === shown || pending) return;
    startTransition(async () => {
      setShown(next);
      await save(() => updateStatus(requestId, next));
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
    </Card>
  );
}
