import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 text-text-primary flex flex-col">
      <header class="bg-white border-b border-border">
        <div class="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <a routerLink="/" class="flex items-center gap-3">
            <img src="assets/Skedia_sf.png" alt="Skedia" class="h-10 w-10 object-contain">
            <span class="text-lg font-bold tracking-tight">Skedia</span>
          </a>

          <nav class="flex items-center gap-2">
            <a routerLink="/login" class="btn-secondary">Ingresar</a>
            <a routerLink="/registro" class="btn-primary">Registrarse</a>
          </nav>
        </div>
      </header>

      <main class="flex-1">
        <section class="max-w-6xl mx-auto px-5 py-16 sm:py-24 grid lg:grid-cols-[1fr_420px] gap-10 items-center">
          <div class="space-y-7">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-semibold border border-blue-100">
              Agenda online para negocios de servicios
            </div>

            <div class="space-y-4">
              <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight tracking-normal text-slate-900">
                Gestiona reservas, clientes y servicios desde un solo lugar.
              </h1>
              <p class="text-base sm:text-lg text-text-secondary max-w-2xl">
                Skedia te ayuda a organizar tu agenda, publicar una pagina de reservas y mantener el control diario de tu negocio.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <a routerLink="/registro" class="btn-primary justify-center px-5 py-3">Crear cuenta</a>
              <a routerLink="/login" class="btn-secondary justify-center px-5 py-3">Ingresar</a>
            </div>
          </div>

          <div class="bg-white border border-border rounded-lg shadow-card p-5">
            <div class="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <p class="text-xs text-text-secondary uppercase font-bold tracking-wider">Hoy</p>
                <h2 class="text-xl font-bold">Agenda del negocio</h2>
              </div>
              <span class="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">24</span>
            </div>

            <div class="space-y-3">
              <div class="p-4 rounded-lg bg-slate-50 border border-border flex items-center justify-between gap-3">
                <div>
                  <p class="font-semibold">Corte clasico</p>
                  <p class="text-sm text-text-secondary">09:30 · Cliente confirmado</p>
                </div>
                <span class="badge-confirmed">Confirmada</span>
              </div>
              <div class="p-4 rounded-lg bg-slate-50 border border-border flex items-center justify-between gap-3">
                <div>
                  <p class="font-semibold">Consulta inicial</p>
                  <p class="text-sm text-text-secondary">11:00 · Nueva reserva</p>
                </div>
                <span class="badge-pending">Pendiente</span>
              </div>
              <div class="grid grid-cols-3 gap-3 pt-2">
                <div class="rounded-lg bg-green-50 border border-green-100 p-3">
                  <p class="text-xs text-green-700 font-semibold">Ingresos</p>
                  <p class="text-lg font-bold">$0</p>
                </div>
                <div class="rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <p class="text-xs text-blue-700 font-semibold">Citas</p>
                  <p class="text-lg font-bold">2</p>
                </div>
                <div class="rounded-lg bg-amber-50 border border-amber-100 p-3">
                  <p class="text-xs text-amber-700 font-semibold">Servicios</p>
                  <p class="text-lg font-bold">5</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="bg-white border-t border-border">
        <div class="max-w-6xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-text-secondary">
          <p>Skedia · Plataforma de agendamiento</p>
          <div class="flex items-center gap-4">
            <a routerLink="/login" class="hover:text-primary">Ingresar</a>
            <a routerLink="/registro" class="hover:text-primary">Crear cuenta</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class HomeComponent {}
