import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../shared/models/api.models';
import { NotifyService } from './notify.service';

const TOKEN_KEY = 'bankai.accessToken';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private notify = inject(NotifyService);
  private url = `${environment.apiUrl}/auth`;

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.token() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  login(body: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.url}/login`, body)
      .pipe(tap((r) => this.startSession(r)));
  }

  register(body: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${this.url}/register`, body)
      .pipe(tap((r) => this.startSession(r)));
  }

  /** Runs at app start: if a token is stored, load the user (and its role); drop the token if it is no longer valid. */
  async restore(): Promise<void> {
    if (!this.token()) return;
    try {
      this.user.set(await firstValueFrom(this.http.get<User>(`${this.url}/me`)));
    } catch {
      this.endSession();
    }
  }

  logout(sessionExpired = false) {
    if (sessionExpired) {
      if (!this.token()) return; // several requests can fail at once; react only once
      this.endSession();
      this.notify.error('Your session has expired. Please sign in again.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
    } else {
      this.endSession();
      this.router.navigateByUrl('/');
    }
  }

  private startSession(r: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, r.accessToken);
    this.token.set(r.accessToken);
    this.user.set(r.user);
  }

  private endSession() {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.user.set(null);
  }
}
