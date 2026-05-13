import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const STORAGE_KEY = 'hms.theme';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly html = this.document.documentElement;

  readonly mode = signal<ThemeMode>(this.readInitial());

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    this.apply();
  }

  toggleLightDark(): void {
    const next = this.html.classList.contains('dark') ? 'light' : 'dark';
    this.setMode(next);
  }

  private readInitial(): ThemeMode {
    const v = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (v === 'light' || v === 'dark' || v === 'system') return v;
    return 'system';
  }

  init(): void {
    this.apply();
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.mode() === 'system') this.apply();
      });
    }
  }

  private apply(): void {
    const mode = this.mode();
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = mode === 'dark' || (mode === 'system' && prefersDark);
    this.html.classList.toggle('dark', dark);
    this.html.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
