import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-[#020b24] text-white flex flex-col">
      <header class="bg-[#020b24] border-b border-white/10 px-5 py-5">
        <div class="max-w-4xl mx-auto flex items-center h-10">
          <img src="assets/Skedia%20Fondo%20Oscuro.png" alt="Skedia" class="h-full w-auto object-contain">
        </div>
      </header>

      <main class="flex-1">
        <router-outlet />
      </main>

      <footer class="py-6 text-center text-sm text-white/50 border-t border-white/10 mt-12">
        <span>Powered by </span>
        <span class="font-medium text-white/80">Skedia</span>
      </footer>
    </div>
  `,
})
export class PublicLayoutComponent {}
