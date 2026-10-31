import { Card } from '@/components/Card';
import { StatusDot } from '@/components/StatusPill';
import { STATUS_META, STATUS_ORDER, type RequestStatus } from '@/config/status';

/** Read-only for now; task 3.4 turns the four items into toggle buttons. */
export function StatusCard({ status }: { status: RequestStatus }) {
  return (
    <Card title="Status">
      <ul className="grid grid-cols-2 gap-2">
        {STATUS_ORDER.map((s) => (
          <li
            key={s}
            aria-current={s === status ? 'true' : undefined}
            className="flex h-11 items-center gap-2 rounded-chip border border-line px-3 text-sm font-semibold aria-current:border-ink aria-current:shadow-[inset_0_0_0_1px_var(--color-ink)]"
          >
            <StatusDot status={s} />
            {STATUS_META[s].label}
          </li>
        ))}
      </ul>
    </Card>
  );
}
