import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { BusinessService } from '../../features/settings/services/business.service';
import { AuthService } from '../auth/auth.service';

/**
 * Guard: verifica que el usuario tenga un negocio configurado.
 * Si no tiene negocio, redirige al onboarding.
 */
export const businessSetupGuard: CanActivateFn = () => {
  const businessService = inject(BusinessService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();

  // Si es admin de plataforma, no necesita configurar un negocio personal
  if (user?.role === 'admin_platform') {
    return true;
  }

  if (businessService.hasBusiness()) {
    return true;
  }

  if (user?.business_id) {
    return businessService.getBusiness().pipe(
      map(() => true),
      catchError(() => of(router.createUrlTree(['/onboarding'])))
    );
  }

  return router.createUrlTree(['/onboarding']);
};
