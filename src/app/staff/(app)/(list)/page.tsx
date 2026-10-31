import Link from 'next/link';
import { Plus } from 'lucide-react';
import { buttonClass } from '@/components/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { StatusCounters } from '@/components/dashboard/StatusCounters';
import { requireStaff } from '@/lib/auth';
import { applyFilters, groupRequests, parseFilters, statusCounters } from '@/lib/dashboard';
import { listPropertyNames, listRequests } from '@/lib/staff-requests';

export const metadata = { title: 'Requests' };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireStaff();
  const filters = parseFilters(await searchParams);
  const now = new Date();
  const [all, properties] = await Promise.all([listRequests(supabase, now), listPropertyNames(supabase)]);

  // Counters ignore the status filter, so picking one doesn't zero the others.
  const counters = statusCounters(applyFilters(all, { ...filters, status: undefined }), now);
  const shown = applyFilters(all, filters);
  const groups = groupRequests(shown, now);
  const allGroups = groupRequests(all, now);
  const open = all.length - allGroups.done.length;

  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.025em]">Requests</h1>
          <p className="mt-1 text-muted">
            {open} open · {allGroups.attention.length} need attention
          </p>
        </div>
        <Link href="/staff/requests/new" className={buttonClass('primary', 'h-10')}>
          <Plus size={16} aria-hidden="true" />
          Log a phone request
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        <StatusCounters counters={counters} filters={filters} />
        <FilterBar filters={filters} properties={properties} shown={shown.length} total={all.length} />

        {all.length === 0 ? (
          <EmptyState title="All caught up">No requests right now. New ones from the tenant form land here, and so do the phone requests you log.</EmptyState>
        ) : shown.length === 0 ? (
          <EmptyState
            title="No requests match"
            action={
              <Link href="/staff" className={buttonClass('ghost', 'h-10')}>
                Clear filters
              </Link>
            }
          >
            Try a different search or clear the filters.
          </EmptyState>
        ) : (
          <RequestTable groups={groups} now={now} />
        )}
      </div>
    </main>
  );
}
