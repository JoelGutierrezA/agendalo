import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BusinessService } from '../../features/settings/services/business.service';
import { AuthService } from './auth.service';

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'skedia_last_activity';

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private loggingOut = false;
  private readonly activityEvents = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

  constructor(
    private authService: AuthService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  start(): void {
    this.recordActivity();

    this.activityEvents.forEach(eventName => {
      window.addEventListener(eventName, this.recordActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.timerId = setInterval(() => this.checkTimeout(), 60 * 1000);
  }

  private readonly recordActivity = (): void => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  private readonly handleVisibilityChange = (): void => {
    if (!document.hidden) {
      this.checkTimeout();
      this.recordActivity();
    }
  };

  private checkTimeout(): void {
    if (this.loggingOut || !this.authService.isAuthenticated()) {
      return;
    }

    const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) ?? Date.now());
    if (Date.now() - lastActivity < INACTIVITY_LIMIT_MS) {
      return;
    }

    this.loggingOut = true;
    this.authService.logout().subscribe({
      complete: () => {
        this.businessService.clearBusiness();
        this.loggingOut = false;
        this.router.navigate(['/login']);
      },
    });
  }
}
