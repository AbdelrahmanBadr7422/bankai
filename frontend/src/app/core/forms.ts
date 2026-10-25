import { AbstractControl, FormControl, ValidatorFn } from '@angular/forms';

export const textControl = (...validators: ValidatorFn[]) =>
  new FormControl('', { nonNullable: true, validators });

export function fieldError(control: AbstractControl | null): string {
  if (!control || !control.touched || !control.errors) return '';
  const e = control.errors;
  if (e['required']) return 'This field is required';
  if (e['email']) return 'Enter a valid email address';
  if (e['minlength']) return `Use at least ${e['minlength'].requiredLength} characters`;
  if (e['maxlength']) return `Use at most ${e['maxlength'].requiredLength} characters`;
  if (e['min']) return `Must be at least ${e['min'].min}`;
  if (e['max']) return `Must be at most ${e['max'].max}`;
  if (e['pattern']) return 'Invalid format';
  return 'Invalid value';
}
