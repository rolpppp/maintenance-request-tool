import { Card } from '@/components/Card';
import { CATEGORY_BY_ID } from '@/config/categories';
import type { RequestDetail } from '@/lib/staff-requests';

/** "From the tenant": the description, the follow-up answers and the quick-check result. */
export function TenantMessage({ request }: { request: RequestDetail }) {
  const category = CATEGORY_BY_ID[request.category];
  const rows = category.questions.flatMap((q) => (request.answers[q.key] ? [{ label: q.question, value: request.answers[q.key] }] : []));
  if (request.quick_check_tried) rows.push({ label: 'Quick check', value: 'Tried it, still broken' });

  return (
    <Card title="From the tenant">
      {request.emergency_flag && (
        <p role="note" className="mb-3 rounded-chip border border-danger-line bg-danger-tint px-3 py-2 text-sm font-semibold text-danger-hover">
          The tenant answered that this is an emergency.
        </p>
      )}
      <p className="text-base whitespace-pre-wrap">{request.description}</p>
      {rows.length > 0 && (
        <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-line-soft pt-4 text-sm sm:grid-cols-[minmax(0,220px)_1fr]">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-muted">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
