import type { ComponentProps, ReactNode } from 'react';
import { Input } from './input';
import { Select } from './select';
import { Textarea } from './textarea';

interface FieldProps {
  name: string;
  label: string;
  errors?: string[];
}

// The attributes that link a control to its label and its error message, so screen readers read the error.
const controlAria = (name: string, errors?: string[]) => {
  const hasError = Boolean(errors?.length);
  return { id: name, name, 'aria-invalid': hasError, 'aria-describedby': hasError ? `${name}-error` : undefined };
};

// Label + control + error messages: the same layout for every kind of field.
function FieldShell({ name, label, errors, children }: FieldProps & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {Boolean(errors?.length) && (
        <p id={`${name}-error`} className="text-sm text-danger">
          {errors!.join(' ')}
        </p>
      )}
    </div>
  );
}

export function FormField({ name, label, errors, ...inputProps }: FieldProps & ComponentProps<'input'>) {
  return (
    <FieldShell name={name} label={label} errors={errors}>
      <Input {...controlAria(name, errors)} {...inputProps} />
    </FieldShell>
  );
}

export function TextareaField({ name, label, errors, ...textareaProps }: FieldProps & ComponentProps<'textarea'>) {
  return (
    <FieldShell name={name} label={label} errors={errors}>
      <Textarea {...controlAria(name, errors)} {...textareaProps} />
    </FieldShell>
  );
}

// The <option>s are passed as children.
export function SelectField({ name, label, errors, ...selectProps }: FieldProps & ComponentProps<'select'>) {
  return (
    <FieldShell name={name} label={label} errors={errors}>
      <Select {...controlAria(name, errors)} {...selectProps} />
    </FieldShell>
  );
}
