import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { suggestEmail } from '@/lib/email-typo';
import { Step } from './Step';
import type { StepProps, TenantOption } from './form-state';

/** `onFile`: the tenants on file for this unit, offered as a one-click fill. Staff form only. */
export function StepContact({ values, errors, update, announce, onFile = [] }: StepProps & { onFile?: TenantOption[] }) {
  const emailSuggestion = suggestEmail(values.email);
  return (
    <Step n={2} title="How can we reach you?" announce={announce}>
      {onFile.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {onFile.map((t) => (
            <Button
              key={t.full_name}
              variant="ghost"
              className="h-11"
              onClick={() => update({ name: t.full_name, phone: t.phone ?? '', email: t.email ?? '' })}
            >
              Use {t.full_name} (on file)
            </Button>
          ))}
        </div>
      )}
      <Field id="name" label="Name" error={errors.name}>
        {(a11y) => (
          <input {...a11y} name="name" className="control" type="text" autoComplete="name" maxLength={120} value={values.name} onChange={(e) => update({ name: e.target.value })} />
        )}
      </Field>
      <Field id="phone" label="Phone" error={errors.phone}>
        {(a11y) => (
          <input {...a11y} name="phone" className="control" type="tel" inputMode="tel" autoComplete="tel" maxLength={40} value={values.phone} onChange={(e) => update({ phone: e.target.value })} />
        )}
      </Field>
      <div>
        <Field id="email" label="Email" hint="A phone number or an email is enough." error={errors.email}>
          {(a11y) => (
            <input {...a11y} name="email" className="control" type="email" inputMode="email" autoComplete="email" maxLength={254} value={values.email} onChange={(e) => update({ email: e.target.value })} />
          )}
        </Field>
        {/* A hint, not an error: it never stops the form from being sent. */}
        {emailSuggestion && (
          <p className="mt-1.5 text-sm text-muted">
            Did you mean{' '}
            <button type="button" className="font-semibold text-accent underline" onClick={() => update({ email: emailSuggestion })}>
              {emailSuggestion}
            </button>
            ?
          </p>
        )}
      </div>
    </Step>
  );
}
