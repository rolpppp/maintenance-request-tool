'use client';

import { useState } from 'react';

export type ActivityEntry = { id: number; who: string; sentence: string; at: string; when: string; note: string | null };

/**
 * The text is worded on the server (it knows the company time zone). This part only animates:
 * entries that weren't there when the page loaded, i.e. the change just saved, slide in.
 */
export function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  const [loadedIds] = useState(() => new Set(entries.map((e) => e.id)));
  return (
    <ol className="space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className={`flex gap-3 ${loadedIds.has(entry.id) ? '' : 'motion-new-event'}`}>
          <span className="mt-2 size-2 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-sm">
                <span className="font-semibold">{entry.who}</span> {entry.sentence}
              </p>
              <time dateTime={entry.at} className="text-[13px] text-muted tabular-nums">
                {entry.when}
              </time>
            </div>
            {entry.note && <p className="mt-2 rounded-chip bg-panel p-3 text-sm whitespace-pre-wrap">{entry.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
