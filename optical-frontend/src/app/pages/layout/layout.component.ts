import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import {
  trigger, transition, style, animate, query, group
} from '@angular/animations';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { BrandMarkComponent } from '../../shared/brand-mark/brand-mark.component';

/* Step 9 — Route transition: fade + 8px slide on every route change. */
const routeTransition = trigger('routeTransition', [
  transition('* <=> *', [
    group([
      query(':leave', [
        animate('140ms ease-in', style({ opacity: 0, transform: 'translateY(-4px)' }))
      ], { optional: true }),
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate('210ms 60ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true }),
    ])
  ])
]);

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, BrandMarkComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  animations: [routeTransition],
})
export class LayoutComponent {
  constructor(public auth: AuthService, public theme: ThemeService) {}

  get isDark(): boolean {
    return this.theme.current() === 'dark';
  }

  get themeAriaLabel(): string {
    return this.isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  /* Returns the activated route path as the animation state key. */
  getRouteState(outlet: RouterOutlet): string {
    return outlet.isActivated
      ? (outlet.activatedRoute.snapshot.url[0]?.path ?? 'root')
      : '';
  }
}
