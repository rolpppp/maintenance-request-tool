'use client';

import { useActionState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { signIn, type SignInState } from './actions';

const initial: SignInState = { email: '', errors: {} };

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    // noValidate: the server action validates and the errors show inline, in our own style.
    <form action={action} noValidate className="mt-6 space-y-4">
      {state.banner && (
        <p role="alert" className="flex items-start gap-2 rounded-control border border-danger-line bg-danger-tint p-3 text-sm text-danger-hover">
          <CircleAlert size={18} className="mt-px shrink-0" aria-hidden="true" />
          {state.banner}
        </p>
      )}
      <Field id="email" label="Email" error={state.errors.email}>
        {(props) => <input {...props} name="email" type="email" autoComplete="email" inputMode="email" defaultValue={state.email} className="control" />}
      </Field>
      <Field id="password" label="Password" error={state.errors.password}>
        {(props) => <input {...props} name="password" type="password" autoComplete="current-password" className="control" />}
      </Field>
      <Button type="submit" pending={pending} pendingLabel="Signing in…" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
