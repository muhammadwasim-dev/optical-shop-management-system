import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import {
  trigger, transition, style, animate
} from '@angular/animations';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { BrandMarkComponent } from '../../shared/brand-mark/brand-mark.component';

const routeTransition = trigger('routeTransition', [
  transition('* <=> *', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate('220ms cubic-bezier(0.16, 1, 0.3, 1)',
      style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, BrandMarkComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  animations: [routeTransition],
})
export class LayoutComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);

  currentRoute = toSignal(
    inject(Router).events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects.split('/')[1] || 'home'),
    ),
    { initialValue: 'home' },
  );

  get isDark(): boolean { return this.theme.current() === 'dark'; }
  get themeAriaLabel(): string { return this.isDark ? 'Switch to light mode' : 'Switch to dark mode'; }
}
