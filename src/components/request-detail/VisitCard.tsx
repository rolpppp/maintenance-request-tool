import { Card } from '@/components/Card';
import { humanVisit } from '@/lib/format';
import type { RequestDetail } from '@/lib/staff-requests';

/** Read-only for now; task 3.4 adds the date input and time window. */
export function VisitCard({ request, now }: { request: RequestDetail; now: Date }) {
  return (
    <Card title="Visit">
      <p className={request.visit_date ? 'font-medium' : 'text-muted'}>{humanVisit(request.visit_date, request.visit_window, now)}</p>
    </Card>
  );
}
