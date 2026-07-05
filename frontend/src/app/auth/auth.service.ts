import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  
  // Signals for state management
  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRole = computed(() => this._currentUser()?.role || '');

  constructor(private http: HttpClient, private router: Router) {
    this.loadToken();
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('crm_token', response.token);
        this._currentUser.set(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('crm_token');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private loadToken(): void {
    const token = localStorage.getItem('crm_token');
    if (token) {
      // Decode JWT token helper (minimal, since we don't need a heavy library)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (!isExpired) {
          this._currentUser.set({
            id: payload.id,
            username: payload.username,
            email: payload.email,
            role: payload.role,
            name: payload.name
          });
        } else {
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    }
  }

  getToken(): string | null {
    return localStorage.getItem('crm_token');
  }
}
