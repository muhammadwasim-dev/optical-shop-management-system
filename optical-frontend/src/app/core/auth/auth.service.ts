import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  role: 'OWNER' | 'WORKER';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http.post<{ token: string; user: AuthUser }>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getUser(): AuthUser | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }

  getRole(): string {
    return this.getUser()?.role ?? '';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  isOwner(): boolean {
    return this.getRole() === 'OWNER';
  }
}
