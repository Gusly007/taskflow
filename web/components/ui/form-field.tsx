import type { ComponentProps, ReactNode } from 'react';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';

interface FieldProps {
  name: string;
  label: string;
  errors?: string[];
  hint?: string; // a short help line under the control, read by screen readers too
}

// The attributes that link a control to its label, hint and error message, so screen readers read them.
const controlAria = (name: string, errors?: string[], hint?: string) => {
  const hasError = Boolean(errors?.length);
  const describedBy = [hint && `${name}-hint`, hasError && `${name}-error`].filter(Boolean).join(' ');
  return { id: name, name, 'aria-invalid': hasError, 'aria-describedby': describedBy || undefined };
};

// Label + control + error messages: the same layout for every kind of field.
function FieldShell({ name, label, errors, hint, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && (
        <p id={`${name}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {Boolean(errors?.length) && (
        <p id={`${name}-error`} className="text-sm text-danger">
          {errors!.join(' ')}
        </p>
      )}
    </div>
  );
}

export function FormField({ name, label, errors, hint, ...inputProps }: FieldProps & ComponentProps<'input'>) {
  return (
    <FieldShell name={name} label={label} errors={errors} hint={hint}>
      <Input {...controlAria(name, errors, hint)} {...inputProps} />
    </FieldShell>
  );
}

export function TextareaField({ name, label, errors, hint, ...textareaProps }: FieldProps & ComponentProps<'textarea'>) {
  return (
    <FieldShell name={name} label={label} errors={errors} hint={hint}>
      <Textarea {...controlAria(name, errors, hint)} {...textareaProps} />
    </FieldShell>
  );
}

// The <option>s are passed as children.
export function SelectField({ name, label, errors, hint, ...selectProps }: FieldProps & ComponentProps<typeof Select>) {
  return (
    <FieldShell name={name} label={label} errors={errors} hint={hint}>
      <Select {...controlAria(name, errors, hint)} {...selectProps} />
    </FieldShell>
  );
}
