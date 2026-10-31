import { Phone } from 'lucide-react';
import { buttonClass } from '@/components/Button';

/** Red `tel:` button for the emergency number. */
export function CallButton({ phone, now = false, className = '' }: { phone: { display: string; tel: string }; now?: boolean; className?: string }) {
  return (
    <a href={`tel:${phone.tel}`} className={buttonClass('danger', className)}>
      <Phone size={18} aria-hidden="true" />
      Call {phone.display}
      {now && ' now'}
    </a>
  );
}
