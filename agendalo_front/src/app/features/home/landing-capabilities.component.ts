import { Component } from '@angular/core';

@Component({
  selector: 'app-landing-capabilities',
  standalone: true,
  template: `
    <section class="bg-gradient-to-br from-[#071c3f] via-[#082752] to-[#0b3268]">
      <div class="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 py-16 sm:py-20">
        <div class="max-w-6xl mx-auto text-center">
          <h2 class="text-3xl sm:text-4xl font-extrabold text-white leading-tight lg:whitespace-nowrap">
            Lo esencial para organizar tu día a día
          </h2>
          <p class="mt-3 text-base sm:text-lg text-blue-100/85 lg:whitespace-nowrap">
            Gestiona tus reservas, clientes, servicios y movimientos del negocio desde un mismo lugar.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-10">
          <article class="bg-white border border-blue-100/70 rounded-lg shadow-xl shadow-blue-950/10 p-6 sm:p-7">
            <div class="flex items-start gap-4">
              <img src="assets/Iconos/Organiza.png" alt="" class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain flex-shrink-0" aria-hidden="true">
              <h3 class="text-xl font-bold text-slate-900">
                Organiza tus horas sin depender de mensajes
              </h3>
            </div>
            <p class="mt-4 text-sm sm:text-base text-text-secondary leading-6">
              Gestiona tus reservas y horarios desde una agenda clara, y permite que tus clientes soliciten horas desde tu página de reservas.
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <span class="capability-chip">Agenda</span>
              <span class="capability-chip">Reservas</span>
              <span class="capability-chip">Horarios de atención</span>
              <span class="capability-chip">Página de reservas</span>
            </div>
          </article>

          <article class="bg-white border border-blue-100/70 rounded-lg shadow-xl shadow-blue-950/10 p-6 sm:p-7">
            <div class="flex items-start gap-4">
              <img src="assets/Iconos/Clientes.png" alt="" class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain flex-shrink-0" aria-hidden="true">
              <h3 class="text-xl font-bold text-slate-900">
                Ten la información de tus clientes y servicios siempre a mano
              </h3>
            </div>
            <p class="mt-4 text-sm sm:text-base text-text-secondary leading-6">
              Organiza tus clientes y define qué servicios ofreces, cuánto duran y cuánto cuestan.
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <span class="capability-chip">Clientes</span>
              <span class="capability-chip">Servicios</span>
              <span class="capability-chip">Duración</span>
              <span class="capability-chip">Precios</span>
            </div>
          </article>

          <article class="bg-white border border-blue-100/70 rounded-lg shadow-xl shadow-blue-950/10 p-6 sm:p-7">
            <div class="flex items-start gap-4">
              <img src="assets/Iconos/Negocio.png" alt="" class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain flex-shrink-0" aria-hidden="true">
              <h3 class="text-xl font-bold text-slate-900">
                Entiende mejor cómo se mueve tu negocio
              </h3>
            </div>
            <p class="mt-4 text-sm sm:text-base text-text-secondary leading-6">
              Registra ingresos y gastos, revisa tu balance y conoce cuánto estás generando a través de los servicios que realizas.
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <span class="capability-chip">Ingresos</span>
              <span class="capability-chip">Egresos</span>
              <span class="capability-chip">Balance</span>
              <span class="capability-chip">Indicadores</span>
            </div>
          </article>

          <article class="bg-white border border-blue-100/70 rounded-lg shadow-xl shadow-blue-950/10 p-6 sm:p-7">
            <div class="flex items-start gap-4">
              <img src="assets/Iconos/Horarios.png" alt="" class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-contain flex-shrink-0" aria-hidden="true">
              <h3 class="text-xl font-bold text-slate-900">
                Evita organizar tus horarios en distintos lugares
              </h3>
            </div>
            <p class="mt-4 text-sm sm:text-base text-text-secondary leading-6">
              Sincroniza Skedia con Google Calendar y mantén tus compromisos y reservas mejor organizados.
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <span class="capability-chip">Google Calendar</span>
              <span class="capability-chip">Sincronización de agenda</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .capability-chip {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1rem;
      padding: 0.35rem 0.65rem;
    }
  `],
})
export class LandingCapabilitiesComponent {}
