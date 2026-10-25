import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../shared/models/api.models';

export function errorMessage(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Something went wrong. Please try again.';
  if (err.status === 0) return 'Cannot reach the server. Check that the backend is running.';
  const body = err.error as Partial<ApiError> | null;
  const message = body?.message ?? `Request failed (${err.status}).`;
  const fields = Object.entries(body?.fieldErrors ?? {}).map(([name, text]) => `${name} ${text}`);
  return fields.length ? `${message}: ${fields.join('; ')}` : message;
}

export function isNotFound(err: unknown): boolean {
  return err instanceof HttpErrorResponse && err.status === 404;
}
