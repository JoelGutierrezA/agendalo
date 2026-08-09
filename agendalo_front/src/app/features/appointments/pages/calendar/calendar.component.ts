import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface CalendarEvent {
  id: number | string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: {
    status: string;
    client_name: string;
    service_name: string;
    source?: 'skedia' | 'google';
    read_only?: boolean;
  };
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-[calc(100vh-80px)] flex flex-col">
      <div class="page-header shrink-0">
        <div>
          <h1 class="page-title">Agenda Semanal</h1>
          <p class="text-text-secondary text-sm">Visualiza tus citas de la semana</p>
        </div>
        <div class="flex gap-2">
          <a routerLink="/app/citas" class="btn-secondary">📋 Lista</a>
          <a routerLink="/app/citas/nueva" class="btn-primary"><span>+</span> Nueva cita</a>
        </div>
      </div>

      <div class="flex items-center justify-between mb-4 shrink-0 bg-surface p-4 rounded-xl border border-border">
        <div class="flex items-center gap-3">
          <button (click)="previousWeek()" class="btn-secondary btn-sm px-3">←</button>
          <span class="text-sm font-semibold text-text-primary min-w-[150px] text-center capitalize">{{ weekLabel }}</span>
          <button (click)="nextWeek()" class="btn-secondary btn-sm px-3">→</button>
        </div>
        <button (click)="currentWeek()" class="btn-secondary btn-sm">Hoy</button>
      </div>

      <div class="card flex-1 p-0 overflow-hidden flex flex-col">
        @if (loading) {
          <div class="flex-1 flex items-center justify-center">
            <span class="text-text-secondary animate-pulse">Cargando agenda...</span>
          </div>
        } @else {
          <div class="flex-1 overflow-auto bg-gray-50/30">
            <div class="min-w-[800px] h-full flex flex-col">
              <!-- Cabecera de días -->
              <div class="grid grid-cols-7 border-b border-border bg-surface sticky top-0 z-20 shadow-sm">
                @for (day of weekDays; track day.date) {
                  <div class="p-3 text-center border-r border-border last:border-0"
                       [class.bg-primary-light]="day.isToday"
                       [class.text-primary-dark]="day.isToday">
                    <p class="text-[11px] uppercase font-bold tracking-wider" [class.text-text-secondary]="!day.isToday">{{ day.name }}</p>
                    <p class="text-xl font-semibold mt-0.5" [class.text-text-primary]="!day.isToday">{{ day.dayNumber }}</p>
                  </div>
                }
              </div>

              <!-- Grid de eventos -->
              <div class="grid grid-cols-7 flex-1 min-h-[500px]">
                @for (day of weekDays; track day.date) {
                  <div class="border-r border-border last:border-0 relative p-1.5 flex flex-col gap-1.5">
                    @for (event of getEventsForDay(day.dateStr); track event.id) {
                      @if (event.extendedProps.read_only) {
                        <div class="rounded-lg p-2 text-xs text-white shadow-sm border border-white/20"
                             [style.backgroundColor]="event.backgroundColor"
                             [title]="'Evento de Google Calendar (solo lectura)'">
                          <p class="font-semibold truncate">{{ formatTime(event.start) }} - {{ event.extendedProps.client_name }}</p>
                          <p class="opacity-90 truncate text-[10px] mt-0.5">{{ event.extendedProps.service_name }} • Solo lectura</p>
                        </div>
                      } @else {
                        <div class="rounded-lg p-2 text-xs text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                             [style.backgroundColor]="event.backgroundColor"
                             [title]="event.extendedProps.service_name + ' - ' + event.extendedProps.status"
                             [routerLink]="['/app/citas', event.id, 'editar']">
                          <p class="font-semibold truncate">{{ formatTime(event.start) }} - {{ event.extendedProps.client_name }}</p>
                          <p class="opacity-90 truncate text-[10px] mt-0.5">{{ event.extendedProps.service_name }}</p>
                        </div>
                      }
                    }
                    @if (getEventsForDay(day.dateStr).length === 0) {
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span class="text-2xl text-border mix-blend-multiply">+</span>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  loading = true;
  events: CalendarEvent[] = [];
  
  currentDate = new Date();
  weekDays: any[] = [];
  weekLabel = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.generateWeek();
  }

  generateWeek(): void {
    this.weekDays = [];
    // Ir al lunes de la semana actual
    const startOfWeek = new Date(this.currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunes
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo

    const opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
      this.weekLabel = `${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString('es-CL', { month: 'short' })} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-CL', opts)}`;
    } else {
      this.weekLabel = `${startOfWeek.toLocaleDateString('es-CL', opts)}`;
    }

    const todayStr = new Date().toLocaleDateString('en-CA');

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toLocaleDateString('en-CA');

      this.weekDays.push({
        date: d,
        dateStr: dateStr,
        name: d.toLocaleDateString('es-CL', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr
      });
    }

    this.loadEvents(this.weekDays[0].dateStr, this.weekDays[6].dateStr);
  }

  loadEvents(start: string, end: string): void {
    this.loading = true;
    this.http.get<{ data: CalendarEvent[] }>(`${environment.apiUrl}/appointments/calendar`, {
      params: { start: `${start} 00:00:00`, end: `${end} 23:59:59` }
    }).subscribe({
      next: (res) => {
        this.events = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  getEventsForDay(dateStr: string): CalendarEvent[] {
    return this.events
      .filter(e => e.start.startsWith(dateStr))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  previousWeek(): void {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.generateWeek();
  }

  nextWeek(): void {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.generateWeek();
  }

  currentWeek(): void {
    this.currentDate = new Date();
    this.generateWeek();
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  }
}
