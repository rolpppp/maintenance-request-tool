import { Siren } from 'lucide-react';

/** Red is reserved for emergencies (HANDOFF §4.1); the icon and the word mean colour isn't the only signal. */
export function EmergencyLabel({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-danger ${className}`}>
      <Siren size={14} aria-hidden="true" />
      Emergency
    </span>
  );
}
