import { Field } from '@/components/Field';
import { Step } from './Step';
import type { StepProps } from './form-state';

export function StepContact({ values, errors, update }: StepProps) {
  return (
    <Step n={2} title="How can we reach you?">
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
      <Field id="email" label="Email" hint="A phone number or an email is enough." error={errors.email}>
        {(a11y) => (
          <input {...a11y} name="email" className="control" type="email" inputMode="email" autoComplete="email" maxLength={254} value={values.email} onChange={(e) => update({ email: e.target.value })} />
        )}
      </Field>
    </Step>
  );
}
