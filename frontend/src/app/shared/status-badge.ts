import { Component, computed, input } from '@angular/core';

const COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-900',
  CONFIRMED: 'bg-sky-100 text-sky-900',
  SHIPPED: 'bg-indigo-100 text-indigo-900',
  DELIVERED: 'bg-emerald-100 text-emerald-900',
  PAID: 'bg-emerald-100 text-emerald-900',
  CANCELLED: 'bg-blood/15 text-blood-dark',
};

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="colors()">{{ status() }}</span>`,
})
export class StatusBadge {
  status = input.required<string>();
  protected colors = computed(() => COLORS[this.status()] ?? 'bg-bone text-ink');
}
