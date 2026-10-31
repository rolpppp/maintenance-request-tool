import { CallButton } from '@/components/CallButton';
import { EXTREME_HEAT_F } from '@/config/categories';

/** Always visible, above the form (HANDOFF §5.1). */
export function EmergencyBanner({ phone }: { phone: { display: string; tel: string } }) {
  return (
    <section aria-labelledby="emergency-title" className="mt-6 rounded-card border border-danger-line bg-danger-tint p-4">
      <h2 id="emergency-title" className="font-[650] text-danger-hover">
        Emergency? Call now. Don&apos;t use this form.
      </h2>
      <ul className="mt-2 list-disc pl-5 text-danger-hover">
        <li>Gas smell</li>
        <li>Flooding or water spreading</li>
        <li>No AC and it&apos;s over {EXTREME_HEAT_F}°F inside</li>
      </ul>
      <CallButton phone={phone} className="mt-3 w-full" />
    </section>
  );
}
