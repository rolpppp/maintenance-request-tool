import Link from 'next/link';
import { Search } from 'lucide-react';
import { CATEGORIES } from '@/config/categories';
import { FilterSelect } from '@/components/dashboard/FilterSelect';
import { hasFilters, type Filters } from '@/lib/dashboard';

/** Filters are URL search params (a GET form), so they survive a refresh and can be shared. */
export function FilterBar({ filters, properties, shown, total }: { filters: Filters; properties: string[]; shown: number; total: number }) {
  return (
    <form action="/staff" className="flex flex-wrap items-end gap-3">
      {filters.status && <input type="hidden" name="status" value={filters.status} />}
      <FilterSelect name="property" label="Property" value={filters.property ?? ''} options={properties.map((p) => ({ value: p, label: p }))} />
      <FilterSelect name="category" label="Category" value={filters.category ?? ''} options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
      <label className="block min-w-[220px] flex-1 text-[13px] font-semibold">
        Search
        <span className="mt-1 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ''}
            placeholder="Reference, unit or tenant"
            className="control h-10 text-sm font-normal"
          />
          <button type="submit" aria-label="Search" className="grid size-10 shrink-0 place-items-center rounded-chip border border-line-strong hover:bg-hover-row">
            <Search size={16} aria-hidden="true" />
          </button>
        </span>
      </label>
      <p className="ml-auto flex items-center gap-3 pb-2.5 text-sm text-muted">
        Showing {shown} of {total}
        {hasFilters(filters) && (
          <Link href="/staff" className="font-semibold text-accent underline underline-offset-2">
            Clear filters
          </Link>
        )}
      </p>
    </form>
  );
}
