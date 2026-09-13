import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiResponse } from '../../../../models/auth.models';
import { PlatformService } from '../../services/platform.service';

type RequestTab = 'all' | 'registrations' | 'subscriptions';
type RequestStatusFilter = 'all' | 'pending' | 'instructions_sent' | 'completed' | 'cancelled';

interface RequestInboxItem {
  id: string;
  source: 'registration' | 'subscription';
  typeLabel: string;
  userName: string;
  userEmail: string;
  businessName: string;
  currentPlan: string;
  requestedPlan: string;
  remainingDays: number | null;
  requestedPeriodDays: number | null;
  currentSubscriptionStatus: string;
  currentEndsAt: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  instructionsSentAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  raw: any;
}

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-[1400px] mx-auto p-6">
      <div class="page-header">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/Interfaz/Finanzas.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
            <h1 class="page-title">Solicitudes</h1>
          </div>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary" (click)="loadRequests()" [disabled]="loading">Recargar</button>
          <a routerLink="/admin-plataforma" class="btn-secondary">Volver</a>
        </div>
      </div>

      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="card p-4 border-l-4 border-primary">
          <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Pendientes</p>
          <p class="mt-1 text-2xl font-bold text-text-primary">{{ pendingTotal }}</p>
        </div>
        <div class="card p-4 border-l-4 border-amber-500">
          <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Nuevos registros</p>
          <p class="mt-1 text-2xl font-bold text-text-primary">{{ pendingProfiles.length }}</p>
        </div>
        <div class="card p-4 border-l-4 border-blue-500">
          <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Solicitudes de suscripcion</p>
          <p class="mt-1 text-2xl font-bold text-text-primary">{{ subscriptionRequests.length }}</p>
        </div>
      </section>

      <section class="card p-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn-secondary btn-sm" [class.bg-primary]="activeTab === 'all'" [class.text-white]="activeTab === 'all'" (click)="setTab('all')">
              Todas
            </button>
            <button type="button" class="btn-secondary btn-sm" [class.bg-primary]="activeTab === 'registrations'" [class.text-white]="activeTab === 'registrations'" (click)="setTab('registrations')">
              Nuevos registros
            </button>
            <button type="button" class="btn-secondary btn-sm" [class.bg-primary]="activeTab === 'subscriptions'" [class.text-white]="activeTab === 'subscriptions'" (click)="setTab('subscriptions')">
              Suscripciones
            </button>
          </div>

          <label class="flex flex-col gap-1 text-sm font-semibold text-text-secondary sm:min-w-[220px]">
            Estado
            <select class="form-input h-10" [(ngModel)]="statusFilter">
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="instructions_sent">Instrucciones enviadas</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </label>
        </div>
      </section>

      <section class="card p-0 overflow-hidden">
        @if (loading) {
          <div class="p-8">
            <div class="skeleton h-8 w-48"></div>
            <div class="mt-5 space-y-3">
              @for (row of [1, 2, 3, 4]; track row) {
                <div class="skeleton h-14 w-full rounded-lg"></div>
              }
            </div>
          </div>
        } @else if (filteredRequests().length === 0) {
          <div class="empty-state fade-in">
            <div class="bg-gray-50 p-6 rounded-full mb-4">
              <img src="assets/Interfaz/Finanzas.png" alt="" class="h-12 w-12 object-contain" aria-hidden="true">
            </div>
            <h3 class="text-lg font-bold text-text-primary mb-2">{{ emptyTitle() }}</h3>
            <p class="text-text-secondary max-w-sm mb-0">{{ emptyDescription() }}</p>
          </div>
        } @else {
          <div class="overflow-x-auto text-sm">
            <table class="w-full min-w-[1180px] text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-border">
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Tipo</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Usuario</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Negocio</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Plan actual</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Plan solicitado</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider whitespace-nowrap">Dias snapshot</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Fecha</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Estado</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider text-right">Accion</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                @for (request of filteredRequests(); track request.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors fade-in">
                    <td class="p-4 font-semibold text-text-primary">{{ request.typeLabel }}</td>
                    <td class="p-4">
                      <p class="font-semibold text-text-primary">{{ request.userName }}</p>
                      <p class="text-xs text-text-secondary break-all">{{ request.userEmail }}</p>
                    </td>
                    <td class="p-4 text-text-secondary font-medium">{{ request.businessName }}</td>
                    <td class="p-4 text-text-secondary font-medium">{{ request.currentPlan }}</td>
                    <td class="p-4 text-text-primary font-semibold">{{ request.requestedPlan }}</td>
                    <td class="p-4 text-text-secondary font-medium whitespace-nowrap">{{ daysLabel(request.remainingDays) }}</td>
                    <td class="p-4 text-text-secondary font-medium whitespace-nowrap">{{ formatDate(request.createdAt) }}</td>
                    <td class="p-4">
                      <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold" [class]="statusClass(request.status)">
                        {{ statusLabel(request.status) }}
                      </span>
                    </td>
                    <td class="p-4 text-right whitespace-nowrap">
                      <button type="button" class="btn-secondary btn-sm" (click)="openDetail(request)">Ver detalle</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      @if (selectedRequest) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <button type="button" class="absolute inset-0" aria-label="Cerrar detalle" (click)="closeDetail()"></button>

          <section class="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div class="flex items-start justify-between gap-4 border-b border-border p-5">
              <div>
                <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ selectedRequest.typeLabel }}</p>
                <h2 class="mt-1 text-2xl font-bold text-text-primary">{{ detailTitle(selectedRequest) }}</h2>
              </div>
              <button type="button" class="text-2xl font-bold text-text-secondary hover:text-text-primary" aria-label="Cerrar" (click)="closeDetail()">x</button>
            </div>

            <div class="space-y-5 p-5">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold" [class]="statusClass(selectedRequest.status)">
                  {{ statusLabel(selectedRequest.status) }}
                </span>
                @if (selectedRequest.source === 'subscription') {
                  <span class="text-xs font-semibold text-text-secondary">Snapshot informativo; no modifica la suscripcion.</span>
                }
              </div>

              @if (selectedRequest.source === 'subscription') {
                <div class="rounded-lg border border-border bg-gray-50 p-4">
                  <p class="text-sm font-semibold text-text-primary">{{ subscriptionRequestStageText(selectedRequest) }}</p>
                </div>
              }

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="rounded-lg border border-border p-4">
                  <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Usuario</p>
                  <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.userName }}</p>
                </div>
                <div class="rounded-lg border border-border p-4">
                  <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Email</p>
                  <p class="mt-1 font-semibold text-text-primary break-all">{{ selectedRequest.userEmail }}</p>
                </div>

                @if (selectedRequest.source === 'subscription') {
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Negocio</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.businessName }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Tipo de solicitud</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.typeLabel }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Plan actual</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.currentPlan }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Plan solicitado</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.requestedPlan }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Estado suscripcion</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ subscriptionStatusLabel(selectedRequest.currentSubscriptionStatus) }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Dias restantes al solicitar</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ daysLabel(selectedRequest.remainingDays) }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Periodo solicitado</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ daysLabel(selectedRequest.requestedPeriodDays) }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Vencimiento que tenia</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.currentEndsAt) }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4 sm:col-span-2">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Notas</p>
                    <p class="mt-1 text-sm text-text-secondary whitespace-pre-line">{{ selectedRequest.notes || '-' }}</p>
                  </div>
                  @if (selectedRequest.completedAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Completada</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.completedAt) }}</p>
                    </div>
                  }
                  @if (selectedRequest.instructionsSentAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Instrucciones enviadas</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.instructionsSentAt) }}</p>
                    </div>
                  }
                  @if (selectedRequest.cancelledAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Cancelada</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.cancelledAt) }}</p>
                    </div>
                  }
                } @else {
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Rol</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.raw.role === 'admin_platform' ? 'Admin plataforma' : 'Dueno de negocio' }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Estado</p>
                    <p class="mt-1 font-semibold text-text-primary">Pendiente de aprobacion</p>
                  </div>
                }

                <div class="rounded-lg border border-border p-4">
                  <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Fecha de solicitud</p>
                  <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.createdAt) }}</p>
                </div>
              </div>
            </div>

            <div class="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
              <button type="button" class="btn-secondary justify-center" (click)="closeDetail()">Cerrar</button>
              @if (selectedRequest.source === 'registration') {
                <button type="button" class="btn-primary justify-center" [disabled]="approvingProfileId === selectedRequest.raw.id" (click)="approveRegistration(selectedRequest)">
                  @if (approvingProfileId === selectedRequest.raw.id) { Aprobando... } @else { Aprobar usuario }
                </button>
              } @else if (canCancelSubscriptionRequest(selectedRequest)) {
                <button type="button" class="btn-secondary justify-center text-red-700 border-red-200 hover:bg-red-50" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="cancelSubscriptionRequest(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Procesando... } @else { Cancelar solicitud }
                </button>
              }
              @if (selectedRequest.source === 'subscription' && canSendSubscriptionInstructions(selectedRequest)) {
                <button type="button" class="btn-primary justify-center" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="sendSubscriptionInstructions(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Enviando... } @else { Enviar instrucciones }
                </button>
              }
              @if (selectedRequest.source === 'subscription' && canCompleteSubscriptionRequest(selectedRequest)) {
                <button type="button" class="btn-primary justify-center" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="completeSubscriptionRequest(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Aplicando... } @else { Confirmar pago y aplicar plan }
                </button>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
})
export class RequestListComponent implements OnInit {
  pendingProfiles: any[] = [];
  subscriptionRequests: any[] = [];
  loading = true;
  pendingTotal = 0;
  activeTab: RequestTab = 'all';
  statusFilter: RequestStatusFilter = 'all';
  selectedRequest: RequestInboxItem | null = null;
  approvingProfileId: string | null = null;
  resolvingRequestId: number | null = null;

  constructor(
    private platformService: PlatformService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading = true;

    forkJoin({
      pendingProfiles: this.platformService.getPendingProfiles(),
      subscriptionRequests: this.platformService.getSubscriptionRequests(),
      pendingCount: this.platformService.getPendingRequestsCount(),
    }).subscribe({
      next: (res: {
        pendingProfiles: ApiResponse<any[]>;
        subscriptionRequests: ApiResponse<any[]>;
        pendingCount: ApiResponse<any>;
      }) => {
        this.pendingProfiles = res.pendingProfiles.data;
        this.subscriptionRequests = res.subscriptionRequests.data;
        this.pendingTotal = res.pendingCount.data.total;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err?.message ?? 'No se pudieron cargar las solicitudes.');
      },
    });
  }

  filteredRequests(): RequestInboxItem[] {
    return this.allRequests()
      .filter(request => this.activeTab === 'all' || request.source === this.sourceFromTab(this.activeTab))
      .filter(request => this.statusFilter === 'all' || request.status === this.statusFilter);
  }

  setTab(tab: RequestTab): void {
    this.activeTab = tab;
  }

  openDetail(request: RequestInboxItem): void {
    this.selectedRequest = request;
  }

  closeDetail(): void {
    this.selectedRequest = null;
  }

  approveRegistration(request: RequestInboxItem): void {
    if (request.source !== 'registration') return;
    if (!confirm(`Aceptar la solicitud de ${request.userName}? Desde ese momento podra iniciar sesion.`)) return;

    this.approvingProfileId = request.raw.id;
    this.platformService.approveUser(request.raw.id).subscribe({
      next: () => {
        this.toastService.success('Usuario aprobado. Ya puede iniciar sesion.');
        this.approvingProfileId = null;
        this.closeDetail();
        this.loadRequests();
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo aprobar el usuario.');
        this.approvingProfileId = null;
      },
    });
  }

  canCompleteSubscriptionRequest(request: RequestInboxItem): boolean {
    return request.source === 'subscription' && request.status === 'instructions_sent';
  }

  canCancelSubscriptionRequest(request: RequestInboxItem): boolean {
    return request.source === 'subscription' && ['pending', 'instructions_sent'].includes(request.status);
  }

  canSendSubscriptionInstructions(request: RequestInboxItem): boolean {
    return request.source === 'subscription' && request.status === 'pending';
  }

  async sendSubscriptionInstructions(request: RequestInboxItem): Promise<void> {
    if (!this.canSendSubscriptionInstructions(request)) return;

    const result = await Swal.fire({
      title: 'Enviar instrucciones de pago?',
      html: this.sendInstructionsConfirmationHtml(request),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, enviar instrucciones',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.sendSubscriptionInstructions(request.raw.id).subscribe({
      next: () => {
        this.toastService.success('Instrucciones enviadas.');
        void Swal.fire({
          title: 'Instrucciones enviadas',
          text: 'El usuario recibio las instrucciones para continuar con el proceso.',
          icon: 'success',
          confirmButtonText: 'Entendido',
        });
        this.resolvingRequestId = null;
        this.closeDetail();
        this.loadRequests();
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudieron enviar las instrucciones.');
        void Swal.fire({
          title: 'No se pudieron enviar las instrucciones.',
          text: err?.message ?? 'La solicitud continua pendiente.',
          icon: 'error',
          confirmButtonText: 'Entendido',
        });
        this.resolvingRequestId = null;
      },
    });
  }

  async completeSubscriptionRequest(request: RequestInboxItem): Promise<void> {
    if (!this.canCompleteSubscriptionRequest(request)) return;

    const result = await Swal.fire({
      title: '¿Confirmar pago y aplicar suscripcion?',
      html: this.completeConfirmationHtml(request),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, confirmar y aplicar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.completeSubscriptionRequest(request.raw.id).subscribe({
      next: (res: ApiResponse<any>) => {
        this.toastService.success('Suscripcion actualizada.');
        void Swal.fire({
          title: 'Suscripcion actualizada',
          text: `${res.data?.plan_name ?? request.requestedPlan} queda activa hasta ${this.formatDate(res.data?.new_ends_at)}.`,
          icon: 'success',
          confirmButtonText: 'Entendido',
        });
        this.resolvingRequestId = null;
        this.closeDetail();
        this.loadRequests();
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo completar la solicitud.');
        this.resolvingRequestId = null;
      },
    });
  }

  async cancelSubscriptionRequest(request: RequestInboxItem): Promise<void> {
    if (!this.canCancelSubscriptionRequest(request)) return;

    const result = await Swal.fire({
      title: '¿Cancelar esta solicitud?',
      text: 'La solicitud quedara cerrada y no se aplicara ningun cambio a la suscripcion.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, cancelar solicitud',
      cancelButtonText: 'Volver',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.cancelSubscriptionRequest(request.raw.id).subscribe({
      next: () => {
        this.toastService.success('Solicitud cancelada.');
        this.resolvingRequestId = null;
        this.closeDetail();
        this.loadRequests();
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo cancelar la solicitud.');
        this.resolvingRequestId = null;
      },
    });
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      instructions_sent: 'Instrucciones enviadas',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };

    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      instructions_sent: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };

    return classes[status] ?? 'bg-slate-100 text-slate-600';
  }

  subscriptionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      trialing: 'Prueba gratuita',
      active: 'Activa',
      past_due: 'Pago pendiente',
      expired: 'Vencida',
      cancelled: 'Cancelada',
    };

    return labels[status] ?? status ?? '-';
  }

  daysLabel(days: number | null): string {
    if (days === null || days === undefined) return '-';
    return days === 1 ? '1 dia' : `${days} dias`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  detailTitle(request: RequestInboxItem): string {
    return request.source === 'registration'
      ? request.userName
      : `${request.businessName} - ${request.requestedPlan}`;
  }

  subscriptionRequestStageText(request: RequestInboxItem): string {
    if (request.status === 'pending') return 'Esperando envio de instrucciones.';
    if (request.status === 'instructions_sent') return 'Instrucciones enviadas. Puedes confirmar el pago y aplicar el plan cuando corresponda.';
    if (request.status === 'completed') return 'Solicitud completada. La suscripcion ya fue actualizada.';
    if (request.status === 'cancelled') return 'Solicitud cancelada. No se aplico ningun cambio a la suscripcion.';

    return 'Solicitud de suscripcion.';
  }

  emptyTitle(): string {
    return this.activeTab === 'all' && this.statusFilter === 'all'
      ? 'No tienes solicitudes pendientes.'
      : 'No hay solicitudes para este filtro.';
  }

  emptyDescription(): string {
    return this.activeTab === 'all' && this.statusFilter === 'all'
      ? 'Cuando existan registros o solicitudes de suscripcion apareceran aqui.'
      : 'Prueba cambiando el tipo o el estado seleccionado.';
  }

  private allRequests(): RequestInboxItem[] {
    const registrationItems = this.pendingProfiles.map(profile => this.mapPendingProfile(profile));
    const subscriptionItems = this.subscriptionRequests.map(request => this.mapSubscriptionRequest(request));

    return [...registrationItems, ...subscriptionItems].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private mapPendingProfile(profile: any): RequestInboxItem {
    return {
      id: `registration:${profile.id}`,
      source: 'registration',
      typeLabel: 'Nuevo registro',
      userName: profile.name || 'Usuario',
      userEmail: profile.email || '-',
      businessName: '-',
      currentPlan: '-',
      requestedPlan: '-',
      remainingDays: null,
      requestedPeriodDays: null,
      currentSubscriptionStatus: '-',
      currentEndsAt: null,
      notes: null,
      status: 'pending',
      createdAt: profile.created_at,
      instructionsSentAt: null,
      completedAt: null,
      cancelledAt: null,
      raw: profile,
    };
  }

  private mapSubscriptionRequest(request: any): RequestInboxItem {
    return {
      id: `subscription:${request.id}`,
      source: 'subscription',
      typeLabel: this.requestTypeLabel(request.request_type),
      userName: request.profile?.name || 'Usuario',
      userEmail: request.profile?.email || '-',
      businessName: request.business?.name || '-',
      currentPlan: request.current_plan?.name || '-',
      requestedPlan: request.requested_plan?.name || '-',
      remainingDays: request.remaining_days_snapshot,
      requestedPeriodDays: request.requested_period_days,
      currentSubscriptionStatus: request.current_subscription_status || '-',
      currentEndsAt: request.current_ends_at,
      notes: request.notes,
      status: request.status,
      createdAt: request.created_at,
      instructionsSentAt: request.instructions_sent_at,
      completedAt: request.completed_at,
      cancelledAt: request.cancelled_at,
      raw: request,
    };
  }

  private completeConfirmationHtml(request: RequestInboxItem): string {
    return `
      <div class="text-left space-y-3">
        <p><strong>Negocio:</strong> ${this.escapeHtml(request.businessName)}</p>
        <p><strong>Usuario:</strong> ${this.escapeHtml(request.userName)} (${this.escapeHtml(request.userEmail)})</p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p><strong>Plan actual:</strong> ${this.escapeHtml(request.currentPlan)}</p>
          <p><strong>Plan solicitado:</strong> ${this.escapeHtml(request.requestedPlan)}</p>
          <p><strong>Dias restantes snapshot:</strong> ${this.daysLabel(request.remainingDays)}</p>
          <p><strong>Periodo solicitado:</strong> ${this.daysLabel(request.requestedPeriodDays)}</p>
        </div>
        <p>Skedia recalculara los dias todavia vigentes y los conservara antes de sumar el nuevo periodo.</p>
      </div>
    `;
  }

  private sendInstructionsConfirmationHtml(request: RequestInboxItem): string {
    return `
      <div class="text-left space-y-3">
        <p><strong>Usuario:</strong> ${this.escapeHtml(request.userName)} (${this.escapeHtml(request.userEmail)})</p>
        <p><strong>Negocio:</strong> ${this.escapeHtml(request.businessName)}</p>
        <p><strong>Tipo de solicitud:</strong> ${this.escapeHtml(request.typeLabel)}</p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p><strong>Plan solicitado:</strong> ${this.escapeHtml(request.requestedPlan)}</p>
          <p><strong>Precio:</strong> ${this.escapeHtml(this.formatPrice(request.raw?.requested_plan?.price_clp))}</p>
        </div>
        <p>Se enviara un correo con las instrucciones de transferencia. La suscripcion todavia no sera modificada.</p>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private requestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      subscription_activation: 'Activacion de plan',
      subscription_renewal: 'Renovacion de plan',
      subscription_change: 'Cambio de plan',
    };

    return labels[type] ?? 'Solicitud de suscripcion';
  }

  private formatPrice(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';

    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  private sourceFromTab(tab: RequestTab): RequestInboxItem['source'] | null {
    if (tab === 'registrations') return 'registration';
    if (tab === 'subscriptions') return 'subscription';
    return null;
  }
}
