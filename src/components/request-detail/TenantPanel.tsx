import { Check, TriangleAlert } from 'lucide-react';
import { Card } from '@/components/Card';
import type { RequestDetail } from '@/lib/staff-requests';

/** Who sent the request, whether they match the tenant on file, and whether staff may enter. */
export function TenantPanel({ request }: { request: RequestDetail }) {
  const unit = request.units.unit_number;
  const onFile = request.units.tenants
    .filter((t) => t.is_current)
    .map((t) => [t.full_name, t.phone].filter(Boolean).join(', '))
    .join('; ');
  const firstName = request.contact_name.split(/\s+/)[0];

  return (
    <Card title="Tenant">
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[220px] flex-1">
          <p className="font-semibold">{request.contact_name}</p>
          <p className="mt-1 text-sm">
            {request.contact_phone ? <a href={`tel:${request.contact_phone}`} className="text-accent underline underline-offset-2">{request.contact_phone}</a> : <span className="text-muted">No phone</span>}
          </p>
          <p className="text-sm">
            {request.contact_email ? <a href={`mailto:${request.contact_email}`} className="break-all text-accent underline underline-offset-2">{request.contact_email}</a> : <span className="text-muted">No email</span>}
          </p>
          {request.tenant ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent">
              <Check size={16} aria-hidden="true" />
              Matches {request.tenant.full_name} on file for {unit}
            </p>
          ) : (
            <p className="mt-3 flex items-start gap-1.5 rounded-chip border border-line bg-panel p-3 text-sm text-warn-ink">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                Doesn&apos;t match the tenant on file. On file for {unit}: {onFile || 'no one'}. Check who&apos;s asking before entering.
              </span>
            </p>
          )}
        </div>
        <div className="min-w-[200px] flex-1 rounded-chip bg-panel p-3 text-sm">
          <p className="font-semibold">{request.entry_allowed ? 'Staff may enter' : 'Contact first'}</p>
          <p className="mt-0.5 text-muted">
            {request.entry_allowed ? `${firstName} said it's fine to go in if no one's home.` : `${firstName} asked to be contacted before anyone comes in.`}
          </p>
        </div>
      </div>
    </Card>
  );
}
