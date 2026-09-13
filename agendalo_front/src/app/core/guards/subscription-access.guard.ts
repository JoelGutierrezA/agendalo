import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SubscriptionService } from '../../features/subscription/services/subscription.service';

export const subscriptionAccessGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user?.role === 'admin_platform') {
    return true;
  }

  if (!user?.business_id) {
    const targetUrl = state.url.split('?')[0].split('#')[0];
    const allowedOnboardingUrls = ['/app/dashboard', '/app/configuracion/negocio'];

    return allowedOnboardingUrls.includes(targetUrl)
      ? true
      : router.createUrlTree(['/app/configuracion/negocio']);
  }

  return subscriptionService.ensureLoaded().pipe(
    map(subscription => {
      const state = subscriptionService.effectiveState(subscription);
      if (state === 'active' || state === 'grace') return true;

      return router.createUrlTree(['/app/suscripcion'], {
        queryParams: { subscriptionRequired: '1' },
      });
    }),
    catchError(() => of(router.createUrlTree(['/app/suscripcion'], {
      queryParams: { subscriptionRequired: '1' },
    })))
  );
};
