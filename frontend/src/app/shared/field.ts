import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { fieldError } from '../core/forms';

@Component({
  selector: 'app-field',
  template: `
    <label class="block"
      ><span class="label">{{ label() }}</span
      ><ng-content
    /></label>
    @if (message(); as text) {
      <p class="field-error" role="alert">{{ text }}</p>
    }
  `,
  host: { class: 'block' },
})
export class Field {
  label = input.required<string>();
  control = input<AbstractControl | null>(null);

  protected message() {
    return fieldError(this.control());
  }
}
