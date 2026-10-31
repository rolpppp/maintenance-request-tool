import { Wrench } from 'lucide-react';
import { COMPANY_NAME } from '@/config/company';
import { signOut } from '@/app/staff/actions';
import { StaffNav } from '@/components/staff/StaffNav';

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('');

export function StaffHeader({ name }: { name: string }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="grid size-7 place-items-center rounded-chip bg-accent text-white">
            <Wrench size={15} aria-hidden="true" />
          </span>
          {COMPANY_NAME}
        </p>
        <StaffNav />
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="grid size-8 place-items-center rounded-full bg-fill text-xs font-semibold text-ink-2" aria-hidden="true">
            {initials(name)}
          </span>
          <span className="font-medium">{name}</span>
          <form action={signOut}>
            <button type="submit" className="h-9 rounded-chip px-3 font-medium text-ink-2 hover:bg-fill">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
