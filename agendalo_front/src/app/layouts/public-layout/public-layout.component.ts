import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header mínimo para páginas públicas -->
      <header class="bg-white border-b border-gray-100 px-6 py-4">
        <div class="max-w-4xl mx-auto flex items-center h-8">
          <img src="assets/Skedia_sf.png" alt="Skedia" class="h-full w-auto">
        </div>
      </header>

      <!-- Página pública -->
      <main>
        <router-outlet />
      </main>

      <!-- Footer mínimo -->
      <footer class="py-6 text-center text-sm text-gray-400 border-t border-gray-100 mt-12">
        <span>Powered by </span>
        <span class="font-medium text-gray-600">Skedia</span>
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {}
