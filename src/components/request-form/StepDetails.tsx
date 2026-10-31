import { Lock } from 'lucide-react';
import { Button } from '@/components/Button';
import { Field, FieldError } from '@/components/Field';
import { Step } from './Step';
import { PhotoPicker } from './PhotoPicker';
import { RadioCard } from './RadioCard';
import type { StepProps } from './form-state';

const ENTRY_OPTIONS = [
  { value: 'yes', label: 'Yes, you may enter', sub: 'Usually the fastest way to get it fixed.' },
  { value: 'no', label: 'No, contact me first', sub: "We'll arrange a time when you're home." },
] as const;

export function StepDetails({ values, errors, update, pending }: StepProps & { pending: boolean }) {
  const count = Object.keys(errors).length;
  return (
    <Step n={4} title="A few more details">
      <Field id="description" label="Description" hint="Where in the unit, when it started, anything you've noticed." error={errors.description}>
        {(a11y) => (
          <textarea
            {...a11y}
            name="description"
            className="control"
            maxLength={4000}
            value={values.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        )}
      </Field>

      <PhotoPicker photos={values.photos} onChange={(photos) => update({ photos })} />

      <fieldset aria-describedby={errors.entry ? 'entry-error' : undefined}>
        <legend className="mb-2 text-[15px] font-semibold">If no one&apos;s home, may staff enter?</legend>
        <div className="space-y-2">
          {ENTRY_OPTIONS.map((o) => (
            <RadioCard key={o.value} name="entry" value={o.value} indicator="dot" checked={values.entry === o.value} onChange={() => update({ entry: o.value })}>
              <span className="block font-semibold">{o.label}</span>
              <span className="block text-sm text-muted">{o.sub}</span>
            </RadioCard>
          ))}
        </div>
        {errors.entry && <FieldError id="entry-error">{errors.entry}</FieldError>}
      </fieldset>

      {count > 0 && (
        <p role="alert" className="rounded-control border border-danger-line bg-danger-tint px-4 py-3 text-danger-hover">
          {count === 1 ? '1 thing needs' : `${count} things need`} fixing above before you can send.
        </p>
      )}
      <Button type="submit" className="w-full" pending={pending} pendingLabel="Sending your request…">
        Send request
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
        <Lock size={14} aria-hidden="true" />
        Only maintenance staff can see your request and photos.
      </p>
    </Step>
  );
}
