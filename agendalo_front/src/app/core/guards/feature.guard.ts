import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { FeatureKey, SubscriptionService } from '../../features/subscription/services/subscription.service';

export const featureGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);
  const feature = route.data?.['feature'] as FeatureKey | undefined;

  if (!feature || authService.currentUser()?.role === 'admin_platform') {
    return true;
  }

  return subscriptionService.ensureLoaded().pipe(
    map(() => {
      if (subscriptionService.hasFeature(feature)) return true;

      return router.createUrlTree(['/app/suscripcion'], {
        queryParams: { blockedFeature: feature },
      });
    }),
    catchError(() => of(router.createUrlTree(['/app/suscripcion'])))
  );
};
