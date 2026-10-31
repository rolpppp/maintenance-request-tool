import type { ReactNode } from 'react';
import { Check } from 'lucide-react';

/**
 * A real radio input (so arrow keys and screen readers work) with a card drawn over it.
 * The selected look uses `peer-checked` on siblings, which is why the indicator is a sibling of the input.
 */
export function RadioCard({
  name,
  value,
  checked,
  onChange,
  indicator,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  /** `check`: green badge top-right (category tiles). `dot`: ring on the left (entry options). */
  indicator: 'check' | 'dot';
  children: ReactNode;
}) {
  return (
    <label className="relative block cursor-pointer">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <div
        className={`min-h-14 rounded-control border border-line bg-white p-3 transition-colors duration-150 hover:border-line-strong peer-checked:border-accent peer-checked:bg-accent-tint peer-checked:shadow-[inset_0_0_0_1px_var(--color-accent)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent ${indicator === 'dot' ? 'pl-12' : 'pr-11'}`}
      >
        {children}
      </div>
      {indicator === 'check' ? (
        <span className="absolute top-3 right-3 hidden size-5 place-items-center rounded-full bg-accent text-white peer-checked:grid" aria-hidden="true">
          <Check size={13} strokeWidth={3} />
        </span>
      ) : (
        <span
          className="absolute top-1/2 left-4 size-5 -translate-y-1/2 rounded-full border-2 border-field peer-checked:border-accent peer-checked:bg-accent peer-checked:shadow-[inset_0_0_0_3px_var(--color-accent-tint)]"
          aria-hidden="true"
        />
      )}
    </label>
  );
}
