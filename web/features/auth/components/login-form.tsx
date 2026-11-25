'use client';

import { useActionState } from 'react';
import { login } from '../auth.actions';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

export function LoginForm({ next }: { next?: string }) {
  // state = what the action returned last time; pending = true while it runs.
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        defaultValue={state?.values?.email}
        errors={state?.fieldErrors?.email}
        required
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        errors={state?.fieldErrors?.password}
        required
      />
      {state?.message && <Alert>{state.message}</Alert>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
