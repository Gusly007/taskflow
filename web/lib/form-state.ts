// What a form's Server Action returns to useActionState. Shared by every form of the app.
export type FormState<Field extends string> =
  | {
      fieldErrors?: Partial<Record<Field, string[]>>;
      message?: string; // error from the API, shown above the submit button
      values?: Partial<Record<Field, string>>; // to refill the form (never the password)
    }
  | undefined;
