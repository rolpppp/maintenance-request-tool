import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { CategoryIcon } from '@/components/CategoryIcon';
import { StatusPill } from '@/components/StatusPill';
import { Tag } from '@/components/Tag';
import { ActivityTimeline } from '@/components/request-detail/ActivityTimeline';
import { AssignCard } from '@/components/request-detail/AssignCard';
import { NoteCard } from '@/components/request-detail/NoteCard';
import { PhotoGrid } from '@/components/request-detail/PhotoGrid';
import { StatusCard } from '@/components/request-detail/StatusCard';
import { TenantMessage } from '@/components/request-detail/TenantMessage';
import { TenantPanel } from '@/components/request-detail/TenantPanel';
import { VisitCard } from '@/components/request-detail/VisitCard';
import { CATEGORY_BY_ID } from '@/config/categories';
import { requireStaff } from '@/lib/auth';
import { openMs } from '@/lib/dashboard';
import { ageWords, atLabel } from '@/lib/format';
import { requestTitle } from '@/lib/request-title';
import { getRequest, listEvents, listPhotos } from '@/lib/staff-requests';

// Same shape the database enforces (no 0, O, 1, I or L).
const refSchema = z.string().regex(/^MR-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/);

export default async function RequestDetailPage({ params }: { params: Promise<{ ref: string }> }) {
  const { supabase } = await requireStaff();
  const ref = refSchema.safeParse((await params).ref);
  if (!ref.success) notFound();

  const request = await getRequest(supabase, ref.data);
  if (!request) notFound();
  // Photo links are signed only now, after the staff check above.
  const [events, photos] = await Promise.all([listEvents(supabase, request.id), listPhotos(supabase, request.id)]);

  const now = new Date();
  const source = request.source === 'staff_phone' ? 'Logged' : 'Sent';
  const origin = request.source === 'staff_phone' ? 'a phone call' : 'the tenant form';

  return (
    <main className="mx-auto max-w-[1200px] px-4 pt-6 pb-16">
      <Link href="/staff" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden="true" />
        All requests
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tag value={request.ref} />
          <StatusPill status={request.status} />
          <span className="text-sm text-muted tabular-nums">Open {ageWords(openMs(request, now))}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-chip bg-fill text-ink-2">
            <CategoryIcon category={request.category} size={20} />
          </span>
          <h1 className="text-[28px] leading-[1.15] font-bold tracking-[-0.025em]">{requestTitle(request)}</h1>
        </div>
        <p className="mt-2 text-sm text-muted">
          {request.units.properties.name} · Unit {request.units.unit_number} · {CATEGORY_BY_ID[request.category].label} · {source}{' '}
          {atLabel(request.created_at, now)} from {origin}
        </p>
      </header>

      {/* Below 960px the right column (status and assignment) sits above the details. */}
      <div className="mt-6 flex flex-col-reverse gap-5 min-[960px]:flex-row">
        <div className="min-w-0 space-y-5 min-[960px]:flex-[999_1_560px]">
          <TenantMessage request={request} />
          <PhotoGrid photos={photos} />
          <TenantPanel request={request} />
          <ActivityTimeline events={events} now={now} />
        </div>
        <div className="space-y-5 min-[960px]:sticky min-[960px]:top-5 min-[960px]:flex-[1_1_360px] min-[960px]:self-start">
          <StatusCard status={request.status} />
          <AssignCard vendor={request.vendors} />
          <VisitCard request={request} now={now} />
          <NoteCard />
        </div>
      </div>
    </main>
  );
}
