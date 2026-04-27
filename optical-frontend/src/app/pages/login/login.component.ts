import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, PasswordModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    public theme: ThemeService,
  ) {}

  get themeIcon(): string {
    return this.theme.current() === 'dark' ? 'pi pi-sun' : 'pi pi-moon';
  }

  get themeAriaLabel(): string {
    return this.theme.current() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }

  onLogin() {
    if (!this.username || !this.password) {
      this.error = 'Please enter your username and password.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error = 'Invalid username or password. Please try again.';
        this.loading = false;
      },
    });
  }
}
