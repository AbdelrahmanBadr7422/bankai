import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApi = req.url.startsWith(environment.apiUrl);
  const outgoing =
    isApi && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    catchError((err: unknown) => {
      const authCall = ['/auth/login', '/auth/register', '/auth/me'].some((p) =>
        req.url.endsWith(p),
      );
      if (isApi && token && !authCall && err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout(true);
      }
      return throwError(() => err);
    }),
  );
};
