import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="bg-slate-950 text-slate-300">
      <div class="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 py-12 sm:py-14">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_0.8fr_0.75fr_0.75fr] gap-10 lg:gap-14">
          <div class="max-w-sm">
            <a routerLink="/" class="inline-flex items-center">
              <img src="assets/Skedia%20Fondo%20Oscuro.png" alt="Skedia" class="h-14 w-auto max-w-[170px] object-contain">
            </a>
            <p class="mt-5 text-sm leading-6 text-slate-300">
              Agenda online, reservas públicas, clientes y gestión diaria para negocios de servicios.
            </p>

            <div class="flex items-center gap-3 mt-6" aria-label="Redes sociales">
              <a
                href="mailto:contacto@skedia.cl"
                class="w-10 h-10 rounded-full border border-slate-700 text-sky-300 flex items-center justify-center hover:border-sky-400 hover:bg-sky-400/10 transition-colors"
                title="Correo"
                aria-label="Correo"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 6.5h16v11H4v-11z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M5 7l7 6 7-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener"
                class="w-10 h-10 rounded-full border border-slate-700 text-sky-300 flex items-center justify-center hover:border-sky-400 hover:bg-sky-400/10 transition-colors"
                title="Instagram"
                aria-label="Instagram"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="2"/>
                  <circle cx="17" cy="7" r="1.2" fill="currentColor"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener"
                class="w-10 h-10 rounded-full border border-slate-700 text-sky-300 flex items-center justify-center hover:border-sky-400 hover:bg-sky-400/10 transition-colors"
                title="Facebook"
                aria-label="Facebook"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14.2 8.4V6.9c0-.7.5-1.1 1.2-1.1h1.8V3h-2.6c-2.8 0-4.2 1.6-4.2 4v1.4H8.3v3.1h2.1V21h3.8v-9.5h2.6l.5-3.1h-3.1z"/>
                </svg>
              </a>
            </div>
          </div>

          <nav aria-label="Plataforma">
            <h2 class="text-sm font-bold text-white">Plataforma</h2>
            <ul class="mt-5 space-y-3 text-sm">
              <li><a routerLink="/" class="footer-link">Inicio</a></li>
              <li><a routerLink="/planes" class="footer-link">Planes</a></li>
              <li><a routerLink="/login" class="footer-link">Plataforma</a></li>
            </ul>
          </nav>

          <nav aria-label="Contacto">
            <h2 class="text-sm font-bold text-white">Contacto</h2>
            <ul class="mt-5 space-y-3 text-sm">
              <li><a href="mailto:contacto@skedia.cl" class="footer-link">Contacto comercial</a></li>
              <li><a href="mailto:soporte@skedia.cl" class="footer-link">Soporte tecnico</a></li>
              <li><a href="mailto:contacto@skedia.cl?subject=Demo%20Skedia" class="footer-link">Agenda una demo</a></li>
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h2 class="text-sm font-bold text-white">Legal</h2>
            <ul class="mt-5 space-y-3 text-sm">
              <li><a href="mailto:contacto@skedia.cl?subject=Terminos%20y%20condiciones" class="footer-link">Terminos y condiciones</a></li>
              <li><a href="mailto:contacto@skedia.cl?subject=Politica%20de%20privacidad" class="footer-link">Politica de privacidad</a></li>
              <li><a href="mailto:soporte@skedia.cl?subject=Seguridad%20Skedia" class="footer-link">Seguridad</a></li>
            </ul>
          </nav>

          <nav aria-label="Recursos">
            <h2 class="text-sm font-bold text-white">Recursos</h2>
            <ul class="mt-5 space-y-3 text-sm">
              <li><a href="mailto:soporte@skedia.cl?subject=Preguntas%20frecuentes" class="footer-link">Preguntas frecuentes</a></li>
              <li><a routerLink="/registro" class="footer-link">Crear cuenta</a></li>
              <li><a routerLink="/recuperar-contrasena" class="footer-link">Recuperar acceso</a></li>
            </ul>
          </nav>
        </div>
      </div>

      <div class="border-t border-slate-800">
        <div class="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 py-5 text-center text-xs text-slate-500">
          © 2026 Skedia. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-link {
      color: #7dd3fc;
      transition: color 150ms ease;
    }

    .footer-link:hover {
      color: #ffffff;
    }
  `],
})
export class PublicFooterComponent {}
