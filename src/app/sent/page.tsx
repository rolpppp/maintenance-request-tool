import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check } from 'lucide-react';
import { buttonClass } from '@/components/Button';
import { CopyRefButton } from '@/components/CopyRefButton';
import { Tag } from '@/components/Tag';
import { emergencyPhone } from '@/config/company';
import { readConfirmation } from '@/lib/confirmation';

const TIMELINE = [
  { title: 'Received', note: 'Just now', state: 'done' },
  { title: 'The team reviews it', note: "They'll call or email you to set a time.", state: 'current' },
  { title: 'Repair visit', note: null, state: 'todo' },
  { title: 'Fixed', note: 'The request is closed.', state: 'todo' },
] as const;

export default async function SentPage() {
  // No cookie, or a forged or expired one: there is nothing to show (and we never look requests up by reference).
  const sent = await readConfirmation();
  if (!sent) redirect('/');
  const phone = emergencyPhone();

  const summary = [
    ['Where', sent.where],
    ['Problem', sent.problem],
    ['Entry', sent.entry],
    ['Photos', sent.photos],
  ];

  return (
    <main className="mx-auto max-w-[480px] px-4 pt-8 pb-16">
      <div className="motion-card rounded-card border border-line bg-surface p-6 shadow-card">
        <span className="motion-tick grid size-14 place-items-center rounded-full bg-accent text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7.5" pathLength="24" />
          </svg>
        </span>
        <h1 className="mt-4 text-[30px] leading-[1.12] font-bold tracking-[-0.025em]">Request sent</h1>
        <p className="mt-2 text-muted">Thanks, {sent.firstName}. The maintenance team has it now.</p>

        <div className="motion-after">
          <p className="mt-6 text-sm font-semibold text-muted">Your reference number</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Tag value={sent.ref} large />
            <CopyRefButton value={sent.ref} />
          </div>
          <p className="mt-3 text-sm text-muted">Keep it in case you call us about this request. Save a screenshot if that&apos;s easier.</p>

          <dl className="mt-6 divide-y divide-line-soft rounded-control bg-panel px-4">
            {summary.map(([term, detail]) => (
              <div key={term} className="flex justify-between gap-4 py-3">
                <dt className="text-muted">{term}</dt>
                <dd className="text-right font-semibold">{detail}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-8 text-[17px] font-[650] tracking-[-0.015em]">What happens next</h2>
          <ol className="mt-3">
            {TIMELINE.map((step, i) => (
              <li key={step.title} className="relative flex gap-3 pb-5 last:pb-0">
                {i < TIMELINE.length - 1 && <span className="absolute top-6 bottom-0 left-[11px] w-px bg-line" aria-hidden="true" />}
                <span
                  className={`relative grid size-6 shrink-0 place-items-center rounded-full ${step.state === 'done' ? 'bg-accent text-white' : step.state === 'current' ? 'border-2 border-accent bg-white' : 'border border-line-strong bg-white'}`}
                  aria-hidden="true"
                >
                  {step.state === 'done' && <Check size={14} strokeWidth={3} />}
                </span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  {step.note && <p className="text-sm text-muted">{step.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Link href="/" className={buttonClass('ghost', 'mt-6 w-full')}>
        Report another problem
      </Link>
      <p className="mt-4 text-center text-sm text-muted">
        Getting worse or unsafe? <CallButtonLink phone={phone} />
      </p>
    </main>
  );
}

function CallButtonLink({ phone }: { phone: { display: string; tel: string } }) {
  return (
    <a href={`tel:${phone.tel}`} className="font-semibold text-accent underline">
      Call {phone.display}
    </a>
  );
}
