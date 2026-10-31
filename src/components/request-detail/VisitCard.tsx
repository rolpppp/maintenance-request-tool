'use client';

import { useOptimistic, useTransition } from 'react';
import { setVisit } from '@/app/staff/actions';
import { Card } from '@/components/Card';
import { useSave } from '@/components/Toast';
import type { VisitWindow } from '@/lib/request-types';

const WINDOW_OPTIONS: { value: VisitWindow; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'morning', label: 'Morning (8–12)' },
  { value: 'afternoon', label: 'Afternoon (12–5)' },
];

type Visit = { date: string | null; window: VisitWindow };

/** `summary` ("Today, 12–5") is worded on the server, where the company time zone is known. */
export function VisitCard({ requestId, visit, summary }: { requestId: string; visit: Visit; summary: string }) {
  const save = useSave();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(visit);

  function change(next: Visit) {
    startTransition(async () => {
      setShown(next);
      await save(() => setVisit(requestId, next.date, next.window));
    });
  }

  return (
    <Card title="Visit">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-[13px] font-semibold">
          Date
          <input
            type="date"
            className="control mt-1 h-11! text-base font-normal"
            value={shown.date ?? ''}
            onChange={(e) => {
              // A half-typed date reads as empty; wait until it is complete rather than clearing the visit.
              if (e.target.validity.badInput) return;
              change({ date: e.target.value || null, window: e.target.value ? shown.window : 'any' });
            }}
          />
        </label>
        <label className="block text-[13px] font-semibold">
          Time window
          <select
            className="control mt-1 h-11! text-base font-normal"
            value={shown.window}
            disabled={!shown.date}
            onChange={(e) => change({ date: shown.date, window: e.target.value as VisitWindow })}
          >
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={`mt-3 text-sm ${visit.date ? 'font-medium' : 'text-muted'}`}>{summary}</p>
    </Card>
  );
}
