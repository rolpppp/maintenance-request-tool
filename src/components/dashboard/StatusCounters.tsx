import { STATUS_META, STATUS_ORDER, type RequestStatus } from '@/config/status';
import { StatusDot } from '@/components/StatusPill';
import type { Filters } from '@/lib/dashboard';

type Counter = { count: number; note: string };

/**
 * Four buttons in a GET form: clicking one sends status=<it>, clicking the active one sends an empty
 * status, which clears the filter. The other filters ride along as hidden inputs, so no JavaScript is needed.
 */
export function StatusCounters({ counters, filters }: { counters: Record<RequestStatus, Counter>; filters: Filters }) {
  return (
    <form action="/staff" role="group" aria-label="Filter by status" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {(['property', 'category', 'q'] as const).map((key) => filters[key] && <input key={key} type="hidden" name={key} value={filters[key]} />)}
      {STATUS_ORDER.map((status) => {
        const active = filters.status === status;
        return (
          <button
            key={status}
            type="submit"
            name="status"
            value={active ? '' : status}
            aria-pressed={active}
            className="rounded-card border border-line bg-surface p-4 text-left shadow-card transition-[transform,border-color] duration-120 hover:border-line-strong active:scale-[0.98] aria-pressed:border-ink aria-pressed:shadow-[inset_0_0_0_1px_var(--color-ink)]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-ink-2">
              <StatusDot status={status} />
              {STATUS_META[status].label}
            </span>
            <span className="mt-1 block text-[28px] leading-none font-bold tracking-[-0.025em] tabular-nums">{counters[status].count}</span>
            <span className="mt-1.5 block text-[13px] text-muted">{counters[status].note}</span>
          </button>
        );
      })}
    </form>
  );
}
