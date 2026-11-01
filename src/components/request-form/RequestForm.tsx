'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { CATEGORY_BY_ID } from '@/config/categories';
import { fieldErrors, hasValidContact, requestSchema } from '@/lib/validation';
import { focusById } from './focus';
import { INITIAL_VALUES, type FormValues, type Problem, type SubmitResult, type TenantOption } from './form-state';
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
  /** From a `/?unit=` link: start with this unit (and its property) chosen. */
  initialUnitId?: string;
  /** Staff form only: tenants on file, so a caller who is one can be filled in with a click. */
  tenants?: TenantOption[];
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

/** Error key (the schema path) and the id of its control, in page order. Entry is a fieldset, focusable via tabIndex. */
const FIELD_IDS = [
  ['unitId', 'unit'],
  ['name', 'name'],
  ['phone', 'phone'],
  ['email', 'email'],
  ['description', 'description'],
  ['entry', 'entry'],
] as const;

export function RequestForm({ properties, units, phone, submit, staff = false, initialUnitId, tenants }: Props) {
  const [values, setValues] = useState(() => {
    const unit = units.find((u) => u.id === initialUnitId);
    return unit ? { ...INITIAL_VALUES, propertyId: unit.property_id, unitId: unit.id } : INITIAL_VALUES;
  });
  const [showErrors, setShowErrors] = useState(false);
  // Fields the person has left at least once. Their errors show from then on.
  const [touched, setTouched] = useState<Set<string>>(new Set());
  // False until the person does something, so nothing scrolls or takes focus on first load.
  const [interacted, setInteracted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Preview URLs live as long as the form; free them when it goes away.
  const photosRef = useRef(values.photos);
  useEffect(() => {
    photosRef.current = values.photos;
  }, [values.photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  const update = (patch: Partial<FormValues>) => {
    setInteracted(true);
    setValues((v) => ({ ...v, ...patch }));
  };

  // Each step appears once the one before it is done. The send button lives in step 4,
  // so anything that can be submitted has passed through every visible step.
  const category = values.category ? CATEGORY_BY_ID[values.category] : null;
  const showContact = values.unitId !== '';
  const showProblem = showContact && hasValidContact(values);
  const showFollowUps = category !== null && (staff || !category.quickCheck || values.quickCheck === 'still_broken');
  const showDetails = showProblem && showFollowUps && category.questions.every((q) => q.optional || values.answers[q.key]);

  const parsed = requestSchema.safeParse(requestInput(values));
  const allErrors = parsed.success ? {} : fieldErrors(parsed.error);
  // A field shows its error once it has been left (and re-checks as they type); Send shows them all.
  const errors = showErrors ? allErrors : Object.fromEntries(Object.entries(allErrors).filter(([field]) => touched.has(field)));
  const problems: Problem[] = FIELD_IDS.filter(([field]) => allErrors[field]).map(([field, id]) => ({ id, message: allErrors[field] }));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setShowErrors(true);
    setServerError(null);
    if (!parsed.success) {
      if (problems.length > 0) focusById(problems[0].id);
      return;
    }
    startTransition(async () => {
      // On success the action redirects to /sent, so a result only ever means failure.
      const result = await submit(toFormData(values));
      if (result) setServerError(result.message);
    });
  }

  return (
    // blur bubbles in React, so one handler on the form sees every field being left.
    <form onSubmit={handleSubmit} onBlur={(e) => setTouched((t) => new Set(t).add(e.target.getAttribute('name') ?? ''))} noValidate>
      <StepWhere values={values} errors={errors} update={update} properties={properties} units={units} />
      {showContact && (
        <StepContact
          values={values}
          errors={errors}
          update={update}
          announce={interacted}
          onFile={tenants?.filter((t) => t.unit_id === values.unitId)}
        />
      )}
      {showProblem && <StepProblem values={values} errors={errors} update={update} announce={interacted} phone={phone} staff={staff} />}
      {showDetails && <StepDetails values={values} errors={errors} update={update} announce={interacted} pending={pending} problems={showErrors ? problems : []} />}
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
