import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { BusinessService } from '../../features/settings/services/business.service';
import { AuthService } from '../auth/auth.service';

/**
 * Guard: verifica que el usuario tenga un negocio configurado.
 * Si no tiene negocio, permite cargar /app para que el layout muestre
 * el modal obligatorio de configuracion inicial.
 */
export const businessSetupGuard: CanActivateFn = () => {
  const businessService = inject(BusinessService);
  const authService = inject(AuthService);

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
      catchError(() => {
        businessService.clearBusiness();
        return of(true);
      })
    );
  }

  return true;
};
