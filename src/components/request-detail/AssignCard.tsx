import Link from 'next/link';
import { Card } from '@/components/Card';
import type { RequestDetail } from '@/lib/staff-requests';

/** Read-only for now; task 3.4 makes the name a select of active vendors. */
export function AssignCard({ vendor }: { vendor: RequestDetail['vendors'] }) {
  return (
    <Card title="Assigned to">
      <p className={vendor ? 'font-medium' : 'text-muted'}>{vendor?.name ?? 'No one yet'}</p>
      {vendor && !vendor.is_in_house && (
        <p className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-chip bg-panel px-3 py-2 text-sm">
          <span>
            {vendor.name} · {vendor.phone ?? 'No phone on file'}
          </span>
          <Link href="/staff/vendors" className="font-semibold text-accent underline underline-offset-2">
            Edit vendors
          </Link>
        </p>
      )}
    </Card>
  );
}
