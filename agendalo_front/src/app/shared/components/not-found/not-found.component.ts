import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/** Página 404 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="min-h-screen bg-background flex items-center justify-center p-4">
      <div class="text-center max-w-sm">
        <p class="text-8xl font-black text-gray-200">404</p>
        <h1 class="text-2xl font-bold text-text-primary mt-4">Página no encontrada</h1>
        <p class="text-text-secondary mt-2">La página que buscas no existe o fue removida.</p>
        <a routerLink="/" class="btn-primary mt-6 inline-flex">← Volver al inicio</a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}
