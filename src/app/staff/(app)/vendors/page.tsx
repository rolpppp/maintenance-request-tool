import { VendorsTable } from '@/components/vendors/VendorsTable';
import { requireStaff } from '@/lib/auth';
import { listVendors, openRequestCounts } from '@/lib/staff-requests';

export const metadata = { title: 'Vendors' };

export default async function VendorsPage() {
  const { supabase } = await requireStaff();
  const [vendors, counts] = await Promise.all([listVendors(supabase), openRequestCounts(supabase)]);
  const active = vendors.filter((v) => v.is_active).map((v) => ({ ...v, openRequests: counts[v.id] ?? 0 }));

  return (
    <main className="mx-auto max-w-[900px] px-4 pt-8 pb-16">
      <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.025em]">Vendors</h1>
      <p className="mt-1 text-muted">Who requests can be assigned to. Vendors don&apos;t log in; this list is for your team.</p>
      <VendorsTable vendors={active} />
    </main>
  );
}
