import type { ButtonHTMLAttributes } from 'react';
import { Spinner } from '@/components/Spinner';

type Variant = 'primary' | 'ghost' | 'quiet' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  ghost: 'border border-line-strong bg-white text-ink hover:bg-hover-row',
  quiet: 'bg-transparent text-ink-2 hover:bg-fill',
  danger: 'bg-danger text-white hover:bg-danger-hover',
};

/** Also used for links that look like buttons (the `tel:` Call buttons). */
export function buttonClass(variant: Variant = 'primary', extra = '') {
  return `inline-flex h-12 items-center justify-center gap-2 rounded-control px-5 text-base font-semibold transition-[transform,background-color] duration-120 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100 ${VARIANTS[variant]} ${extra}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** While true the button is disabled, shows a spinner and `pendingLabel` ("Sending…"). */
  pending?: boolean;
  pendingLabel?: string;
};

export function Button({ variant = 'primary', pending = false, pendingLabel, className, children, disabled, ...rest }: Props) {
  return (
    <button type="button" className={buttonClass(variant, className)} disabled={disabled || pending} {...rest}>
      {pending && <Spinner />}
      {pending ? pendingLabel : children}
    </button>
  );
}
