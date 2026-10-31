import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { RequestForm } from '@/components/request-form/RequestForm';
import type { PropertyOption, UnitOption } from '@/components/request-form/StepWhere';
import { emergencyPhone } from '@/config/company';
import { requireStaff } from '@/lib/auth';
import { logPhoneRequest } from './actions';

export const metadata = { title: 'Log a phone request' };

const natural = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export default async function NewRequestPage() {
  const { supabase } = await requireStaff();
  // Staff can read these tables, so their own client is enough; no admin client here.
  const [properties, units] = await Promise.all([
    supabase.from('properties').select('id, name').returns<PropertyOption[]>(),
    supabase.from('units').select('id, unit_number, property_id').returns<UnitOption[]>(),
  ]);
  if (properties.error || units.error) throw new Error('Could not load properties and units');

  return (
    <main className="mx-auto max-w-[480px] px-4 pt-6 pb-16">
      <Link href="/staff" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden="true" />
        All requests
      </Link>
      <h1 className="mt-4 text-[28px] leading-[1.15] font-bold tracking-[-0.025em]">Log a phone request</h1>
      <p className="mt-2 text-muted">Fill this in while the tenant is on the line. It lands in the list like any other request.</p>

      <RequestForm
        staff
        submit={logPhoneRequest}
        properties={properties.data.sort((a, b) => natural.compare(a.name, b.name))}
        units={units.data.sort((a, b) => natural.compare(a.unit_number, b.unit_number))}
        phone={emergencyPhone()}
      />
    </main>
  );
}
