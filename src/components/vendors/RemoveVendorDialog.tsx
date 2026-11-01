'use client';

import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { removeVendor, restoreVendor } from '@/app/staff/actions';
import { Button } from '@/components/Button';
import { Dialog, DialogFooter } from '@/components/Dialog';
import { useSave } from '@/components/Toast';
import type { VendorRow } from '@/components/vendors/VendorsTable';

/** Closed while `vendor` is null. The content is mounted per vendor, so each removal starts at the confirmation. */
export function RemoveVendorDialog({ vendor, onClose }: { vendor: VendorRow | null; onClose: () => void }) {
  return (
    <Dialog open={vendor !== null} onClose={onClose} role="alertdialog" labelledBy="remove-vendor-title" describedBy="remove-vendor-desc">
      {vendor && <Content key={vendor.id} vendor={vendor} onClose={onClose} />}
    </Dialog>
  );
}

function Content({ vendor, onClose }: { vendor: VendorRow; onClose: () => void }) {
  const save = useSave();
  const [step, setStep] = useState<'confirm' | 'removed'>('confirm');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function remove() {
    setPending(true);
    setFailed(false);
    // This dialog shows its own result, so the call doesn't go through the toast.
    const result = await removeVendor(vendor.id).catch(() => ({ ok: false }));
    setPending(false);
    if (result.ok) setStep('removed');
    else setFailed(true);
  }

  async function undo() {
    if ((await save(() => restoreVendor(vendor.id))).ok) onClose();
  }

  if (step === 'removed') {
    return (
      <>
        <div className="p-5 pt-4 sm:pt-5">
          <span className="grid size-10 place-items-center rounded-full bg-accent-tint text-accent">
            <Check size={20} aria-hidden="true" />
          </span>
          <h2 id="remove-vendor-title" className="mt-3 text-lg font-[650] tracking-[-0.012em]">
            {vendor.name} removed
          </h2>
          <p id="remove-vendor-desc" className="mt-1 text-muted">
            It no longer appears in the assign list.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Done
          </Button>
          <Button onClick={undo}>Undo</Button>
        </DialogFooter>
      </>
    );
  }

  const n = vendor.openRequests;
  return (
    <>
      <div className="p-5 pt-4 sm:pt-5">
        <span className="grid size-10 place-items-center rounded-full bg-danger-tint text-danger">
          <Trash2 size={20} aria-hidden="true" />
        </span>
        <h2 id="remove-vendor-title" className="mt-3 text-lg font-[650] tracking-[-0.012em]">
          Remove {vendor.name}?
        </h2>
        <p id="remove-vendor-desc" className="mt-1 text-muted">
          It won&apos;t appear in the assign list anymore. Requests already assigned to it keep the name in their history.
        </p>
        <p className="mt-4 rounded-chip border border-line-soft bg-panel px-3 py-2 text-sm">
          {n === 0
            ? `No open requests are assigned to ${vendor.name}.`
            : `${n} open ${n === 1 ? 'request is' : 'requests are'} assigned to ${vendor.name}. They stay assigned.`}
        </p>
        {failed && (
          <p role="alert" className="mt-3 text-sm text-danger">
            Couldn&apos;t remove it. Nothing changed.
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" pending={pending} pendingLabel="Removing…" onClick={remove}>
          Remove vendor
        </Button>
      </DialogFooter>
    </>
  );
}
