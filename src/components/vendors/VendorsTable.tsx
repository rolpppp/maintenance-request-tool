'use client';

import { useState } from 'react';
import { addVendor, updateVendor } from '@/app/staff/actions';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FieldError } from '@/components/Field';
import { useSave } from '@/components/Toast';
import { RemoveVendorDialog } from '@/components/vendors/RemoveVendorDialog';
import type { Vendor } from '@/lib/staff-requests';
import { vendorInputErrors, type VendorInputErrors } from '@/lib/vendor-input';

export type VendorRow = Vendor & { openRequests: number };

export function VendorsTable({ vendors }: { vendors: VendorRow[] }) {
  const [removing, setRemoving] = useState<VendorRow | null>(null);

  return (
    <>
      <div className="mt-6 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-line text-xs font-semibold text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">
                Name
              </th>
              <th scope="col" className="px-4 py-3">
                Phone
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {vendors.map((vendor) => (
              <VendorRowView key={vendor.id} vendor={vendor} onRemove={() => setRemoving(vendor)} />
            ))}
          </tbody>
        </table>
      </div>

      <AddVendorForm />
      <p className="mt-4 text-sm text-muted">
        Removing a vendor only hides it from the list. Requests already assigned to it keep the name in their history.
      </p>

      <RemoveVendorDialog vendor={removing} onClose={() => setRemoving(null)} />
    </>
  );
}

function VendorRowView({ vendor, onRemove }: { vendor: VendorRow; onRemove: () => void }) {
  const save = useSave();
  const [name, setName] = useState(vendor.name);
  const [phone, setPhone] = useState(vendor.phone ?? '');
  const [errors, setErrors] = useState<VendorInputErrors>({});

  // Saves when a field loses focus (Enter just blurs it). If it fails, the typed text stays so "Try again" saves it.
  // A rejected value stays too, with its message under the field, so it can be corrected.
  async function commit() {
    if (name === vendor.name && phone === (vendor.phone ?? '')) return;
    const invalid = vendorInputErrors(name, phone);
    setErrors(invalid ?? {});
    if (invalid) return;
    // Past the checks above, the only rejection left is a duplicate name.
    const result = await save(() => updateVendor(vendor.id, name, phone));
    if (!result.ok && result.message) setErrors({ name: result.message });
  }
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };

  return (
    <tr>
      <td className="px-4 py-2">
        <input
          aria-label={`Name of ${vendor.name}`}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? `${vendor.id}-name-error` : undefined}
          className="control h-10! text-sm"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={onKeyDown}
        />
        {errors.name && <FieldError id={`${vendor.id}-name-error`}>{errors.name}</FieldError>}
      </td>
      <td className="px-4 py-2">
        <input
          aria-label={`Phone of ${vendor.name}`}
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? `${vendor.id}-phone-error` : undefined}
          className="control h-10! text-sm"
          type="tel"
          inputMode="tel"
          maxLength={40}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={onKeyDown}
        />
        {errors.phone && <FieldError id={`${vendor.id}-phone-error`}>{errors.phone}</FieldError>}
      </td>
      <td className="px-4 py-2 text-right">
        {vendor.is_in_house ? (
          <span className="text-muted">Your team</span>
        ) : (
          <Button variant="ghost" className="h-10 px-4 text-sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </td>
    </tr>
  );
}

function AddVendorForm() {
  const save = useSave();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<VendorInputErrors>({});
  const [pending, setPending] = useState(false);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const invalid = vendorInputErrors(name, phone);
    setErrors(invalid ?? {});
    if (invalid) return;
    setPending(true);
    const result = await save(() => addVendor(name, phone));
    if (result.ok) {
      setName('');
      setPhone('');
    } else if (result.message) {
      // Past the checks above, the only rejection left is a duplicate name.
      setErrors({ name: result.message });
    }
    setPending(false);
  }

  return (
    <Card title="Add a vendor" className="mt-5">
      <form onSubmit={add} className="flex flex-wrap items-end gap-3">
        <label className="block min-w-[200px] flex-1 text-[13px] font-semibold">
          Name
          <input
            className="control mt-1 h-10! text-sm font-normal"
            maxLength={80}
            value={name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'add-vendor-name-error' : undefined}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <FieldError id="add-vendor-name-error">{errors.name}</FieldError>}
        </label>
        <label className="block min-w-[160px] flex-1 text-[13px] font-semibold">
          Phone <span className="font-normal text-muted">· optional</span>
          <input
            className="control mt-1 h-10! text-sm font-normal"
            type="tel"
            inputMode="tel"
            maxLength={40}
            value={phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'add-vendor-phone-error' : undefined}
            onChange={(e) => setPhone(e.target.value)}
          />
          {errors.phone && <FieldError id="add-vendor-phone-error">{errors.phone}</FieldError>}
        </label>
        <Button type="submit" className="h-10" pending={pending} pendingLabel="Adding…" disabled={name.trim() === ''}>
          Add
        </Button>
      </form>
    </Card>
  );
}
