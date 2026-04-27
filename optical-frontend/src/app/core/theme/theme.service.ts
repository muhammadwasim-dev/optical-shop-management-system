import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'osms.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly _theme = signal<Theme>('light');

  /** Read-only signal reflecting the current theme. */
  readonly current = this._theme.asReadonly();

  /**
   * Called once at app bootstrap (via APP_INITIALIZER).
   * Reads localStorage first; falls back to prefers-color-scheme.
   */
  init(): void {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved: Theme = stored ?? (systemDark ? 'dark' : 'light');
    this._apply(resolved);
  }

  toggle(): void {
    const next: Theme = this._theme() === 'light' ? 'dark' : 'light';
    this._apply(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  private _apply(theme: Theme): void {
    this._theme.set(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
