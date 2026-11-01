import { z } from 'zod';
import { CATEGORIES } from '@/config/categories';
import { dashboardGroup, STATUS_ORDER, type DashboardGroup, type RequestStatus } from '@/config/status';
import { DAY } from '@/lib/format';
import type { RequestRow } from '@/lib/request-types';

/** Dashboard rules in one place: aging, grouping, filters, counters. */

/** Open for this many days counts as "aging" (HANDOFF §10). */
export const AGING_DAYS = Number(process.env.AGING_DAYS) || 3;
/** Done requests stay on the dashboard this long. */
export const DONE_VISIBLE_DAYS = 7;

/** A request plus the times its status last changed (read from the history). */
export type DashboardRequest = RequestRow & {
  request_events: { kind: string; to_value: string | null; created_at: string }[];
};

/** How long it has been open; closed requests stop counting when they closed. */
export const openMs = (r: Pick<RequestRow, 'created_at' | 'closed_at'>, now: Date) =>
  (r.closed_at ? Date.parse(r.closed_at) : now.getTime()) - Date.parse(r.created_at);

export const isAging = (r: DashboardRequest, now: Date) => r.status !== 'done' && openMs(r, now) >= AGING_DAYS * DAY;

/** An emergency stops being one once the request is closed. */
export const isOpenEmergency = (r: Pick<RequestRow, 'emergency_flag' | 'status'>) => r.emergency_flag && r.status !== 'done';

export const groupOf = (r: DashboardRequest, now: Date): DashboardGroup =>
  dashboardGroup(r.status, openMs(r, now) / DAY, AGING_DAYS);

/** When the request entered its current status; falls back to when it was sent. */
export function statusSince(r: DashboardRequest): string {
  const changes = r.request_events.filter((e) => e.kind === 'status' && e.to_value === r.status);
  return changes.map((e) => e.created_at).sort().at(-1) ?? r.created_at;
}

// Filters live in the URL, so they survive a refresh. Unknown values are ignored.
const filtersSchema = z.object({
  status: z.enum(STATUS_ORDER).optional().catch(undefined),
  category: z.enum(CATEGORIES.map((c) => c.id)).optional().catch(undefined),
  property: z.string().max(120).optional().catch(undefined),
  q: z.string().trim().max(80).optional().catch(undefined),
});
export type Filters = z.infer<typeof filtersSchema>;

export function parseFilters(params: Record<string, string | string[] | undefined>): Filters {
  const first = (key: string) => (Array.isArray(params[key]) ? params[key][0] : params[key]) || undefined;
  return filtersSchema.parse({ status: first('status'), category: first('category'), property: first('property'), q: first('q') });
}

export const hasFilters = (f: Filters) => Object.values(f).some(Boolean);

export function applyFilters(requests: DashboardRequest[], f: Filters): DashboardRequest[] {
  const q = f.q?.toLowerCase();
  return requests.filter(
    (r) =>
      (!f.status || r.status === f.status) &&
      (!f.category || r.category === f.category) &&
      (!f.property || r.units.properties.name === f.property) &&
      (!q || [r.ref, r.units.unit_number, r.contact_name, r.tenant?.full_name ?? ''].some((v) => v.toLowerCase().includes(q))),
  );
}

/** Newest first within each group; open emergencies come first (still newest first among themselves). */
export function groupRequests(requests: DashboardRequest[], now: Date): Record<DashboardGroup, DashboardRequest[]> {
  const groups: Record<DashboardGroup, DashboardRequest[]> = { attention: [], progress: [], done: [] };
  const newestFirst = [...requests].sort(
    (a, b) => Number(isOpenEmergency(b)) - Number(isOpenEmergency(a)) || b.created_at.localeCompare(a.created_at),
  );
  for (const r of newestFirst) groups[groupOf(r, now)].push(r);
  return groups;
}

/** Counter tiles: the count and the short note under it (HANDOFF §5.4). */
export function statusCounters(requests: DashboardRequest[], now: Date): Record<RequestStatus, { count: number; note: string }> {
  const of = (status: RequestStatus) => requests.filter((r) => r.status === status);
  const agingNote = (list: DashboardRequest[]) => {
    const n = list.filter((r) => isAging(r, now)).length;
    return n ? `${n} aging` : 'None aging';
  };
  const unassigned = of('new').filter((r) => !r.vendor_id).length;
  return {
    new: { count: of('new').length, note: unassigned ? `${unassigned} with no one on it` : 'All assigned' },
    scheduled: { count: of('scheduled').length, note: agingNote(of('scheduled')) },
    waiting_on_vendor: { count: of('waiting_on_vendor').length, note: agingNote(of('waiting_on_vendor')) },
    done: { count: of('done').length, note: 'This week' },
  };
}
