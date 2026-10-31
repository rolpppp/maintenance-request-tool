import { Clock, Wrench } from 'lucide-react';
import { submitRequest } from '@/app/actions/submit-request';
import { COMPANY_NAME, emergencyPhone } from '@/config/company';
import { createAdminClient } from '@/lib/supabase/admin';
import { EmergencyBanner } from '@/components/request-form/EmergencyBanner';
import { RequestForm } from '@/components/request-form/RequestForm';
import type { PropertyOption, UnitOption } from '@/components/request-form/StepWhere';

// Reads the database on every request, so it must not be prerendered at build time.
export const dynamic = 'force-dynamic';

const natural = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export default async function TenantFormPage() {
  const admin = createAdminClient();
  const [properties, units] = await Promise.all([
    admin.from('properties').select('id, name').returns<PropertyOption[]>(),
    admin.from('units').select('id, unit_number, property_id').returns<UnitOption[]>(),
  ]);
  if (properties.error || units.error) throw new Error('Could not load properties and units');

  const phone = emergencyPhone();
  return (
    <main className="mx-auto max-w-[480px] px-4 pt-8 pb-16">
      <p className="flex items-center gap-2 font-semibold">
        <span className="grid size-8 place-items-center rounded-chip bg-accent text-white">
          <Wrench size={17} aria-hidden="true" />
        </span>
        {COMPANY_NAME} Maintenance
      </p>
      <h1 className="mt-6 text-[30px] leading-[1.12] font-bold tracking-[-0.025em]">Something need fixing?</h1>
      <p className="mt-2 text-muted">Tell us what&apos;s wrong and it goes straight to the maintenance team.</p>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
        <Clock size={15} aria-hidden="true" />
        About 2 minutes · No account needed
      </p>

      <EmergencyBanner phone={phone} />
      <RequestForm
        properties={properties.data.sort((a, b) => natural.compare(a.name, b.name))}
        units={units.data.sort((a, b) => natural.compare(a.unit_number, b.unit_number))}
        phone={phone}
        submit={submitRequest}
      />
    </main>
  );
}
