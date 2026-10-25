import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  text: string;
}
interface ConfirmDialog {
  message: string;
  confirmLabel: string;
  resolve: (answer: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class NotifyService {
  readonly toasts = signal<Toast[]>([]);
  readonly dialog = signal<ConfirmDialog | null>(null);
  private nextId = 1;

  success(text: string) {
    this.push('success', text);
  }
  error(text: string) {
    this.push('error', text);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  confirm(message: string, confirmLabel = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => this.dialog.set({ message, confirmLabel, resolve }));
  }

  answer(value: boolean) {
    const current = this.dialog();
    this.dialog.set(null);
    current?.resolve(value);
  }

  private push(kind: Toast['kind'], text: string) {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}
