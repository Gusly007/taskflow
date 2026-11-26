'use client';

import { useActionState } from 'react';
import { register } from '../auth.actions';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField
        name="name"
        label="Name"
        autoComplete="name"
        defaultValue={state?.values?.name}
        errors={state?.fieldErrors?.name}
        required
      />
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
        autoComplete="new-password"
        errors={state?.fieldErrors?.password}
        required
      />
      {state?.message && <Alert>{state.message}</Alert>}
      <Button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
