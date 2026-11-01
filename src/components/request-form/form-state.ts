import type { CategoryId } from '@/config/categories';

export type Photo = { id: string; file: File; /** Object URL for the preview; revoked when the photo is removed. */ url: string };

export type FormValues = {
  propertyId: string;
  unitId: string;
  name: string;
  phone: string;
  email: string;
  category: CategoryId | '';
  quickCheck: 'unanswered' | 'fixed' | 'still_broken';
  answers: Record<string, string>;
  description: string;
  photos: Photo[];
  entry: 'yes' | 'no' | '';
  /** Honeypot: real people never see this field. */
  website: string;
};

export const INITIAL_VALUES: FormValues = {
  propertyId: '',
  unitId: '',
  name: '',
  phone: '',
  email: '',
  category: '',
  quickCheck: 'unanswered',
  answers: {},
  description: '',
  photos: [],
  entry: '',
  website: '',
};

export type Errors = Record<string, string>;

/** One thing to fix: the id of the control that has it, and what is wrong. */
export type Problem = { id: string; message: string };

/** A tenant on file for the chosen unit. Only the staff form ever receives these. */
export type TenantOption = { unit_id: string; full_name: string; phone: string | null; email: string | null };

/** Props every step receives. `errors` holds only the problems that should be visible now. */
export type StepProps = {
  values: FormValues;
  errors: Errors;
  update: (patch: Partial<FormValues>) => void;
  /** The step appeared because of something the person did (not on first load). */
  announce: boolean;
};

/** What a submit action returns. Only failures come back; success redirects away. */
export type SubmitResult = { ok: false; message: string };
