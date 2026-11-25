import type { ComponentProps } from 'react';
import { Input } from './input';

type FormFieldProps = ComponentProps<'input'> & {
  name: string;
  label: string;
  errors?: string[];
};

// Label + input + error messages, linked with aria-describedby so screen readers read the error.
export function FormField({ name, label, errors, ...inputProps }: FormFieldProps) {
  const errorId = `${name}-error`;
  const hasError = Boolean(errors?.length);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input id={name} name={name} aria-invalid={hasError} aria-describedby={hasError ? errorId : undefined} {...inputProps} />
      {hasError && (
        <p id={errorId} className="text-sm text-danger">
          {errors!.join(' ')}
        </p>
      )}
    </div>
  );
}
