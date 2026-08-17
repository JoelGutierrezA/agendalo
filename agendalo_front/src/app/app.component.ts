import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionTimeoutService } from './core/auth/session-timeout.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <router-outlet />
    <app-toast />
  `,
})
export class AppComponent {
  constructor(sessionTimeoutService: SessionTimeoutService) {
    sessionTimeoutService.start();
  }
}
