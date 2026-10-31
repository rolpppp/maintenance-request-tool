import { Lock } from 'lucide-react';
import { Card } from '@/components/Card';
import { STATUS_META, type RequestStatus } from '@/config/status';
import { humanVisit, submittedLabel } from '@/lib/format';
import type { VisitWindow } from '@/lib/request-types';
import type { RequestEvent } from '@/lib/staff-requests';

const statusLabel = (value: string | null) => (value && value in STATUS_META ? STATUS_META[value as RequestStatus].label : (value ?? ''));

/** The history stores a visit as "2026-11-02 morning"; show it the way the detail page does. */
function visitLabel(value: string, now: Date): string {
  const [date, window = 'any'] = value.split(' ');
  return humanVisit(date, window as VisitWindow, now);
}

/** The sentence after the person's name. */
function sentence(event: RequestEvent, now: Date): string {
  switch (event.kind) {
    case 'created':
      return 'created the request';
    case 'status':
      return `changed the status from ${statusLabel(event.from_value)} to ${statusLabel(event.to_value)}`;
    case 'assignment':
      if (!event.to_value) return `removed ${event.from_value}`;
      return event.from_value ? `changed who is on it from ${event.from_value} to ${event.to_value}` : `assigned it to ${event.to_value}`;
    case 'visit':
      return event.to_value ? `set the visit to ${visitLabel(event.to_value, now)}` : 'cleared the visit';
    case 'note':
      return 'added a note';
  }
}

/** Newest first: the page passes the events already in that order. */
export function ActivityTimeline({ events, now }: { events: RequestEvent[]; now: Date }) {
  return (
    <Card
      title="Activity"
      aside={
        <p className="flex items-center gap-1.5 text-[13px] text-muted">
          <Lock size={13} aria-hidden="true" />
          Recorded automatically · can&apos;t be edited
        </p>
      }
    >
      <ol className="space-y-4">
        {events.map((event) => (
          <li key={event.id} className="flex gap-3">
            <span className="mt-2 size-2 shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm">
                  <span className="font-semibold">{event.actor_label}</span> {sentence(event, now)}
                </p>
                <time dateTime={event.created_at} className="text-[13px] text-muted tabular-nums">
                  {submittedLabel(event.created_at, now)}
                </time>
              </div>
              {event.note && <p className="mt-2 rounded-chip bg-panel p-3 text-sm whitespace-pre-wrap">{event.note}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
