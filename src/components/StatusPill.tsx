import { STATUS_META, type RequestStatus } from '@/config/status';

/** Status colours live only here and in the counter dots (HANDOFF §4.1). */
export function StatusDot({ status }: { status: RequestStatus }) {
  return <span className={`size-1.5 shrink-0 rounded-full ${STATUS_META[status].dot}`} aria-hidden="true" />;
}

export function StatusPill({ status }: { status: RequestStatus }) {
  const { label, pill } = STATUS_META[status];
  return (
    <span className={`inline-flex h-6 items-center gap-1.5 rounded-tag px-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ${pill}`}>
      <StatusDot status={status} />
      {label}
    </span>
  );
}
