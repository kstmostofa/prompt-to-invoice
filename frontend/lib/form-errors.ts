import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/**
 * Map an API 422 body onto form fields.
 *
 * Only fields the form actually registered are set — react-hook-form will
 * happily store an error under a name nothing renders, which silently
 * swallows it, leaving the submitter with a form that rejects them and shows
 * no reason why.
 *
 * Anything unmapped is returned so the caller can surface it in the toast.
 */
export function applyFieldErrors<T extends FieldValues>(
  errors: Record<string, string[]>,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>
): string[] {
  const unmapped: string[] = [];

  for (const [field, messages] of Object.entries(errors)) {
    const message = messages.join(" ");

    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: "server", message });
    } else {
      unmapped.push(message);
    }
  }

  return unmapped;
}
