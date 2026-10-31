'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { CATEGORY_BY_ID } from '@/config/categories';
import { fieldErrors, requestSchema } from '@/lib/validation';
import { INITIAL_VALUES, type FormValues, type SubmitResult } from './form-state';
import { StepContact } from './StepContact';
import { StepDetails } from './StepDetails';
import { StepProblem } from './StepProblem';
import { StepWhere, type PropertyOption, type UnitOption } from './StepWhere';

type Props = {
  properties: PropertyOption[];
  units: UnitOption[];
  phone: { display: string; tel: string };
  /** The tenant page passes submitRequest, the staff page logPhoneRequest. */
  submit: (data: FormData) => Promise<SubmitResult>;
  /** Staff logging a call: the caller is not asked to try the quick check first. */
  staff?: boolean;
};

/** The fields the server validates, in the shape of requestSchema. */
function requestInput(v: FormValues) {
  return {
    unitId: v.unitId,
    name: v.name,
    phone: v.phone,
    email: v.email,
    category: v.category,
    answers: v.answers,
    description: v.description,
    entry: v.entry,
  };
}

function toFormData(v: FormValues) {
  const data = new FormData();
  for (const [key, value] of Object.entries(requestInput(v))) {
    data.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  v.photos.forEach((p) => data.append('photos', p.file));
  data.set('website', v.website);
  return data;
}

export function RequestForm({ properties, units, phone, submit, staff = false }: Props) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [showErrors, setShowErrors] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Preview URLs live as long as the form; free them when it goes away.
  const photosRef = useRef(values.photos);
  useEffect(() => {
    photosRef.current = values.photos;
  }, [values.photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const update = (patch: Partial<FormValues>) => setValues((v) => ({ ...v, ...patch }));

  // Each step appears once the one before it is done. The send button lives in step 4,
  // so anything that can be submitted has passed through every visible step.
  const category = values.category ? CATEGORY_BY_ID[values.category] : null;
  const showContact = values.unitId !== '';
  const showProblem = showContact && values.name.trim() !== '' && (values.phone.trim() !== '' || values.email.trim() !== '');
  const showFollowUps = category !== null && (staff || !category.quickCheck || values.quickCheck === 'still_broken');
  const showDetails = showProblem && showFollowUps && category.questions.every((q) => q.optional || values.answers[q.key]);

  const parsed = requestSchema.safeParse(requestInput(values));
  const errors = showErrors && !parsed.success ? fieldErrors(parsed.error) : {};

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    setServerError(null);
    if (!parsed.success) return;
    startTransition(async () => {
      // On success the action redirects to /sent, so a result only ever means failure.
      const result = await submit(toFormData(values));
      if (result) setServerError(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <StepWhere values={values} errors={errors} update={update} properties={properties} units={units} />
      {showContact && <StepContact values={values} errors={errors} update={update} />}
      {showProblem && <StepProblem values={values} errors={errors} update={update} phone={phone} staff={staff} />}
      {showDetails && <StepDetails values={values} errors={errors} update={update} pending={pending} />}
      {serverError && (
        <p role="alert" className="mt-4 rounded-control border border-danger-line bg-danger-tint px-4 py-3 text-danger-hover">
          {serverError}
        </p>
      )}
      {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => update({ website: e.target.value })} />
        </label>
      </div>
    </form>
  );
}
