'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/staff', label: 'Requests' },
  { href: '/staff/vendors', label: 'Vendors' },
];

export function StaffNav() {
  const pathname = usePathname();
  // Request pages belong to "Requests", so match the section, not just the exact path.
  const isCurrent = (href: string) =>
    href === '/staff' ? pathname === '/staff' || pathname.startsWith('/staff/requests') : pathname.startsWith(href);

  return (
    <nav aria-label="Main">
      <ul className="flex gap-1 text-sm font-medium">
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isCurrent(href) ? 'page' : undefined}
              className="inline-block rounded-chip px-3 py-2 text-muted hover:bg-fill aria-[current=page]:bg-fill aria-[current=page]:text-ink"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
