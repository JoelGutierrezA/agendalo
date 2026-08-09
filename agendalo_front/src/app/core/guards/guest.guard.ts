import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { BusinessService } from '../../features/settings/services/business.service';
import { AuthService } from '../auth/auth.service';

/**
 * Guard: redirige al panel si el usuario YA está autenticado.
 * Usado para rutas de login/registro.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const businessService = inject(BusinessService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!authService.isAuthenticated()) {
    return true;
  }

  if (businessService.hasBusiness()) {
    return router.createUrlTree(['/app/dashboard']);
  }

  if (user?.business_id) {
    return businessService.getBusiness().pipe(
      map(() => router.createUrlTree(['/app/dashboard'])),
      catchError(() => of(router.createUrlTree(['/onboarding'])))
    );
  }

  return router.createUrlTree(['/onboarding']);
};
