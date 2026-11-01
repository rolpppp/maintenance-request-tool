'use client';

import Link from 'next/link';
import { useOptimistic, useTransition } from 'react';
import { assignVendor } from '@/app/staff/actions';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useSave } from '@/components/Toast';
import type { Vendor } from '@/lib/staff-requests';

export function AssignCard({
  requestId,
  vendorId,
  vendors,
  suggestedVendor,
}: {
  requestId: string;
  vendorId: string | null;
  vendors: Vendor[];
  suggestedVendor?: string;
}) {
  const save = useSave();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(vendorId);

  // Active vendors, plus the assigned one even if it was removed since, so the select can still show it.
  const options = vendors.filter((v) => v.is_active || v.id === vendorId);
  const vendor = options.find((v) => v.id === shown);
  // A shortcut only: it never assigns on its own, and only while no one is on the request.
  const suggested = shown ? undefined : vendors.find((v) => v.is_active && v.name.toLowerCase() === suggestedVendor?.toLowerCase());

  function choose(next: string) {
    startTransition(async () => {
      setShown(next || null);
      await save(() => assignVendor(requestId, next || null));
    });
  }

  return (
    <Card title="Assigned to">
      <select aria-label="Assigned to" className="control h-11! text-base" value={shown ?? ''} onChange={(e) => choose(e.target.value)}>
        <option value="">No one yet</option>
        {options.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
      {suggested && (
        <Button variant="ghost" className="mt-3 h-10 text-sm" onClick={() => choose(suggested.id)}>
          Assign {suggested.name}
        </Button>
      )}
      {vendor && !vendor.is_in_house && (
        <p className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-chip bg-panel px-3 py-2 text-sm">
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
