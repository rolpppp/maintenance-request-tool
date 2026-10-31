import Link from 'next/link';
import { Clock, TriangleAlert } from 'lucide-react';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StatusDot, StatusPill } from '@/components/StatusPill';
import { Tag } from '@/components/Tag';
import { CATEGORY_BY_ID } from '@/config/categories';
import type { DashboardGroup } from '@/config/status';
import { isAging, openMs, statusSince, type DashboardRequest } from '@/lib/dashboard';
import { ageWords, dayLabel, humanVisit, submittedLabel } from '@/lib/format';
import { requestTitle } from '@/lib/request-title';

const GROUPS: { id: DashboardGroup; title: string; empty?: string }[] = [
  { id: 'attention', title: 'Needs attention', empty: 'Nothing needs attention right now.' },
  { id: 'progress', title: 'In progress' },
  { id: 'done', title: 'Done this week' },
];

const COLUMNS = ['Request', 'Where', 'Category', 'Status', "Who's on it", 'Open for'];

export function RequestTable({ groups, now }: { groups: Record<DashboardGroup, DashboardRequest[]>; now: Date }) {
  return (
    // The table scrolls inside this box so the page itself never scrolls sideways on a phone.
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs font-semibold text-muted">
            {COLUMNS.map((name) => (
              <th key={name} scope="col" className="px-4 py-2.5 font-semibold">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        {GROUPS.filter((g) => groups[g.id].length > 0 || g.empty).map((group) => (
          <tbody key={group.id}>
            <tr className="bg-panel">
              <th scope="colgroup" colSpan={COLUMNS.length} className="px-4 py-2 text-[13px] font-semibold text-ink-2">
                {group.title} <span className="font-normal text-muted tabular-nums">· {groups[group.id].length}</span>
              </th>
            </tr>
            {groups[group.id].length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-5 text-muted">
                  {group.empty}
                </td>
              </tr>
            )}
            {groups[group.id].map((request) => (
              <RequestRowView key={request.id} request={request} now={now} />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

function RequestRowView({ request, now }: { request: DashboardRequest; now: Date }) {
  const aging = isAging(request, now);
  const isNew = request.status === 'new';
  return (
    <tr className="relative border-t border-line-soft align-top hover:bg-hover-row">
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <span className="mt-1.5 w-1.5 shrink-0">{isNew && <StatusDot status="new" />}</span>
          <div>
            {/* The link is stretched over the whole row; its focus ring is drawn on the row. */}
            <Link
              href={`/staff/requests/${request.ref}`}
              className={`text-[15px] after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-accent ${isNew ? 'font-bold' : 'font-medium'}`}
            >
              {requestTitle(request)}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
              <Tag value={request.ref} />
              <span className="tabular-nums">{submittedLabel(request.created_at, now)}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="font-medium">
          {request.units.properties.name} · {request.units.unit_number}
        </p>
        <p className="text-muted">{request.tenant?.full_name ?? request.contact_name}</p>
        {!request.tenant_id && (
          <p className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-warn-ink">
            <TriangleAlert size={14} aria-hidden="true" />
            Not on file
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="grid size-8 place-items-center rounded-chip bg-fill text-ink-2">
            <CategoryIcon category={request.category} size={16} />
          </span>
          {CATEGORY_BY_ID[request.category].label}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusPill status={request.status} />
        {request.status === 'scheduled' && <p className="mt-1 text-[13px] text-muted">{humanVisit(request.visit_date, request.visit_window, now)}</p>}
      </td>
      <td className="px-4 py-3">
        <p className={request.vendors ? 'font-medium' : 'text-muted'}>{request.vendors?.name ?? 'No one yet'}</p>
        <SubLine request={request} now={now} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
        <p className={aging ? 'font-semibold text-warn-ink' : ''}>{ageWords(openMs(request, now))}</p>
        {aging && (
          <p className="mt-0.5 flex items-center gap-1 text-[13px] font-semibold text-warn-ink">
            <Clock size={14} aria-hidden="true" />
            Aging
          </p>
        )}
      </td>
    </tr>
  );
}

function SubLine({ request, now }: { request: DashboardRequest; now: Date }) {
  if (request.status === 'waiting_on_vendor') return <p className="text-[13px] text-muted">Waiting since {dayLabel(statusSince(request), now)}</p>;
  if (request.status === 'done' && request.closed_at) return <p className="text-[13px] text-muted">Fixed {dayLabel(request.closed_at, now)}</p>;
  return null;
}
