import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const adminPlatformGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user?.role === 'admin_platform') {
    return true;
  }

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authService.me().pipe(
    map(profile => (
      profile.role === 'admin_platform'
        ? true
        : router.createUrlTree(['/app/dashboard'])
    )),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};
