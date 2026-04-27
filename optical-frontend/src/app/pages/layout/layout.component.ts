import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent {
  constructor(public auth: AuthService, public theme: ThemeService) {}

  get themeIcon(): string {
    return this.theme.current() === 'dark' ? 'pi pi-sun' : 'pi pi-moon';
  }

  get themeAriaLabel(): string {
    return this.theme.current() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}
