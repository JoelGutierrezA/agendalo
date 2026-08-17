import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppointmentsService, CalendarEvent } from '../../services/appointments.service';

type CalendarView = 'year' | 'month' | 'week';

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  weekday: string;
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface CalendarMonth {
  date: Date;
  label: string;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="h-[calc(100dvh-92px)] min-h-0 flex flex-col sm:h-[calc(100dvh-120px)] lg:h-[calc(100vh-150px)] lg:min-h-[620px]">
      <div class="page-header shrink-0 mb-3 sm:mb-4">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/Interfaz/Agenda.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
        </div>
      </div>

      <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-3 sm:mb-4 shrink-0 bg-surface p-3 sm:p-4 rounded-xl border border-border">
        <div class="flex items-center justify-between gap-2">
          <button (click)="previous()" class="btn-secondary btn-sm px-3" aria-label="Periodo anterior">&larr;</button>
          <span class="text-sm font-semibold text-text-primary min-w-0 flex-1 text-center capitalize sm:min-w-[210px]">{{ periodLabel }}</span>
          <button (click)="next()" class="btn-secondary btn-sm px-3" aria-label="Periodo siguiente">&rarr;</button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex rounded-lg border border-border bg-white p-1">
            @for (option of viewOptions; track option.id) {
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                [class.bg-primary]="viewMode === option.id"
                [class.text-white]="viewMode === option.id"
                [class.text-text-secondary]="viewMode !== option.id"
                (click)="setView(option.id)"
              >
                {{ option.label }}
              </button>
            }
          </div>
          <button (click)="goToday()" class="btn-secondary btn-sm">Hoy</button>
        </div>
      </div>

      <div class="card flex-1 min-h-0 p-0 overflow-hidden flex flex-col">
        @if (loading) {
          <div class="flex-1 flex items-center justify-center">
            <span class="text-text-secondary animate-pulse">Cargando agenda...</span>
          </div>
        } @else if (viewMode === 'year') {
          <div class="flex-1 overflow-auto bg-gray-50/30 p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              @for (month of yearMonths; track month.label) {
                <button
                  type="button"
                  class="bg-white border border-border rounded-xl p-4 text-left hover:border-primary-light hover:shadow-sm transition-all"
                  (click)="openMonth(month.date)"
                >
                  <div class="flex items-center justify-between gap-3 mb-3">
                    <h3 class="font-bold text-text-primary capitalize">{{ month.label }}</h3>
                    <span class="text-xs rounded-full bg-primary-light text-primary px-2 py-1 font-semibold">
                      {{ month.events.length }}
                    </span>
                  </div>

                  @if (month.events.length === 0) {
                    <p class="text-sm text-text-secondary py-6 text-center border border-dashed border-border rounded-lg">Sin citas</p>
                  } @else {
                    <div class="space-y-2">
                      @for (event of month.events.slice(0, 4); track event.id) {
                        <div class="rounded-lg px-2 py-1.5 text-xs text-white" [style.backgroundColor]="event.backgroundColor">
                          <p class="font-semibold truncate">{{ formatDayMonth(event.start) }} - {{ event.extendedProps.client_name }}</p>
                          <p class="opacity-90 truncate">{{ event.extendedProps.service_name }}</p>
                        </div>
                      }
                      @if (month.events.length > 4) {
                        <p class="text-xs text-text-secondary">+{{ month.events.length - 4 }} citas más</p>
                      }
                    </div>
                  }
                </button>
              }
            </div>
          </div>
        } @else {
          <div class="flex-1 min-h-0 overflow-hidden md:overflow-auto bg-gray-50/30">
            <div class="min-w-0 h-full flex flex-col md:min-w-[920px]">
              <div class="grid grid-cols-7 border-b border-border bg-surface sticky top-0 z-20 shadow-sm">
                @for (dayName of weekdayNames; track dayName) {
                  <div class="px-1 py-2 sm:p-3 text-center border-r border-border last:border-0">
                    <p class="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-text-secondary">{{ dayName }}</p>
                  </div>
                }
              </div>

              <div class="grid grid-cols-7 flex-1" [class.auto-rows-fr]="viewMode === 'month'">
                @for (day of visibleDays; track day.dateStr) {
                  <div
                    class="border-r border-b border-border last:border-r-0 relative p-1 sm:p-2 flex flex-col gap-1 sm:gap-1.5 min-h-[42px] sm:min-h-[62px] lg:min-h-[70px]"
                    [class.bg-white]="day.isCurrentMonth || viewMode === 'week'"
                    [class.bg-gray-50]="!day.isCurrentMonth && viewMode === 'month'"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        class="text-left"
                        [class.text-text-disabled]="!day.isCurrentMonth && viewMode === 'month'"
                        [class.text-primary]="day.isToday"
                        [class.font-bold]="day.isToday"
                        (click)="openDay(day.date)"
                      >
                        <span class="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm"
                              [class.bg-primary]="day.isToday"
                              [class.text-white]="day.isToday">
                          {{ day.dayNumber }}
                        </span>
                      </button>

                      @if (getEventsForDay(day.dateStr).length > 0) {
                        <span class="text-[10px] sm:text-[11px] rounded-full bg-gray-100 text-text-secondary px-1.5 sm:px-2 py-0.5">
                          {{ getEventsForDay(day.dateStr).length }}
                        </span>
                      }
                    </div>

                    <div class="hidden sm:flex flex-col gap-1 overflow-hidden">
                      @for (event of getEventsForDay(day.dateStr).slice(0, viewMode === 'week' ? 8 : 3); track event.id) {
                        @if (event.extendedProps.read_only) {
                          <div
                            class="rounded-lg p-2 text-xs text-white shadow-sm border border-white/20"
                            [style.backgroundColor]="event.backgroundColor"
                            title="Evento de Google Calendar (solo lectura)"
                          >
                            <p class="font-semibold truncate">{{ formatTime(event.start) }} - {{ event.extendedProps.client_name }}</p>
                            <p class="opacity-90 truncate text-[10px] mt-0.5">{{ event.extendedProps.service_name }} · Solo lectura</p>
                          </div>
                        } @else {
                          <a
                            class="rounded-lg p-2 text-xs text-white shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                            [style.backgroundColor]="event.backgroundColor"
                            [title]="event.extendedProps.service_name + ' - ' + event.extendedProps.status"
                            [routerLink]="['/app/citas', event.id, 'editar']"
                          >
                            <p class="font-semibold truncate">{{ formatTime(event.start) }} - {{ event.extendedProps.client_name }}</p>
                            <p class="opacity-90 truncate text-[10px] mt-0.5">{{ event.extendedProps.service_name }}</p>
                          </a>
                        }
                      }

                      @if (getEventsForDay(day.dateStr).length > (viewMode === 'week' ? 8 : 3)) {
                        <button type="button" class="text-xs text-primary text-left font-semibold" (click)="openDay(day.date)">
                          +{{ getEventsForDay(day.dateStr).length - (viewMode === 'week' ? 8 : 3) }} más
                        </button>
                      }
                    </div>

                    @if (getEventsForDay(day.dateStr).length === 0) {
                      <a
                        routerLink="/app/citas/nueva"
                        class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        title="Nueva cita"
                      >
                        <span class="text-2xl text-border mix-blend-multiply">+</span>
                      </a>
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
  viewMode: CalendarView = 'month';
  visibleDays: CalendarDay[] = [];
  yearMonths: CalendarMonth[] = [];
  periodLabel = '';

  readonly weekdayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly viewOptions: { id: CalendarView; label: string }[] = [
    { id: 'year', label: 'Año' },
    { id: 'month', label: 'Mes' },
    { id: 'week', label: 'Semana' },
  ];

  get pageTitle(): string {
    const titles: Record<CalendarView, string> = {
      year: 'Agenda Anual',
      month: 'Agenda Mensual',
      week: 'Agenda Semanal',
    };
    return titles[this.viewMode];
  }

  constructor(private appointmentsService: AppointmentsService) {}

  ngOnInit(): void {
    void this.refreshView();
  }

  setView(view: CalendarView): void {
    this.viewMode = view;
    void this.refreshView();
  }

  previous(): void {
    if (this.viewMode === 'year') {
      this.currentDate = new Date(this.currentDate.getFullYear() - 1, 0, 1);
    } else if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    } else {
      const nextDate = new Date(this.currentDate);
      nextDate.setDate(nextDate.getDate() - 7);
      this.currentDate = nextDate;
    }

    void this.refreshView();
  }

  next(): void {
    if (this.viewMode === 'year') {
      this.currentDate = new Date(this.currentDate.getFullYear() + 1, 0, 1);
    } else if (this.viewMode === 'month') {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    } else {
      const nextDate = new Date(this.currentDate);
      nextDate.setDate(nextDate.getDate() + 7);
      this.currentDate = nextDate;
    }

    void this.refreshView();
  }

  goToday(): void {
    this.currentDate = new Date();
    void this.refreshView();
  }

  openMonth(date: Date): void {
    this.currentDate = new Date(date);
    this.viewMode = 'month';
    void this.refreshView();
  }

  openDay(date: Date): void {
    this.currentDate = new Date(date);
    this.viewMode = 'week';
    void this.refreshView();
  }

  async refreshView(): Promise<void> {
    if (this.viewMode === 'year') {
      await this.generateYear();
    } else if (this.viewMode === 'month') {
      await this.generateMonth();
    } else {
      await this.generateWeek();
    }
  }

  async generateYear(): Promise<void> {
    const year = this.currentDate.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    this.periodLabel = String(year);
    await this.loadEvents(this.toDateKey(start), this.toDateKey(end));

    this.yearMonths = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(year, index, 1);
      const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
      return {
        date,
        label: date.toLocaleDateString('es-CL', { month: 'long' }),
        events: this.events.filter(event => event.start.startsWith(monthKey)),
      };
    });
  }

  async generateMonth(): Promise<void> {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const gridStart = this.getMonday(startOfMonth);
    const gridEnd = new Date(this.getMonday(endOfMonth));
    gridEnd.setDate(gridEnd.getDate() + 6);

    this.periodLabel = startOfMonth.toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric',
    });

    this.visibleDays = this.buildDays(gridStart, gridEnd, month);
    await this.loadEvents(this.toDateKey(gridStart), this.toDateKey(gridEnd));
  }

  async generateWeek(): Promise<void> {
    const startOfWeek = this.getMonday(this.currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (startOfWeek.getMonth() !== endOfWeek.getMonth()) {
      this.periodLabel = `${startOfWeek.getDate()} ${startOfWeek.toLocaleDateString('es-CL', { month: 'short' })} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}`;
    } else {
      this.periodLabel = startOfWeek.toLocaleDateString('es-CL', {
        month: 'long',
        year: 'numeric',
      });
    }

    this.visibleDays = this.buildDays(startOfWeek, endOfWeek, this.currentDate.getMonth());
    await this.loadEvents(this.toDateKey(startOfWeek), this.toDateKey(endOfWeek));
  }

  async loadEvents(start: string, end: string): Promise<void> {
    this.loading = true;
    try {
      this.events = await this.appointmentsService.calendar(start, end);
    } catch {
      this.events = [];
    } finally {
      this.loading = false;
    }
  }

  getEventsForDay(dateStr: string): CalendarEvent[] {
    return this.events
      .filter(event => this.toDateKey(new Date(event.start)) === dateStr)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDayMonth(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
    });
  }

  private buildDays(start: Date, end: Date, activeMonth: number): CalendarDay[] {
    const days: CalendarDay[] = [];
    const todayKey = this.toDateKey(new Date());
    const cursor = new Date(start);

    while (cursor <= end) {
      const date = new Date(cursor);
      const dateStr = this.toDateKey(date);
      days.push({
        date,
        dateStr,
        dayNumber: date.getDate(),
        weekday: date.toLocaleDateString('es-CL', { weekday: 'short' }),
        isToday: dateStr === todayKey,
        isCurrentMonth: date.getMonth() === activeMonth,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }

  private getMonday(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    return result;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
