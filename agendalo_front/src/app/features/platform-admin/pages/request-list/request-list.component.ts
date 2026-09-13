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
type RequestStatusFilter =
  | 'all'
  | 'pending'
  | 'pending_approval'
  | 'pending_payment'
  | 'instructions_sent'
  | 'approved'
  | 'completed'
  | 'cancelled';

interface RequestInboxItem {
  id: string;
  source: 'registration' | 'subscription';
  registrationKind: 'request' | 'legacy' | null;
  typeLabel: string;
  userName: string;
  userEmail: string;
  businessName: string;
  currentPlan: string;
  requestedPlan: string;
  requestedPlanCode: string | null;
  remainingDays: number | null;
  requestedPeriodDays: number | null;
  includedTrialDays: number | null;
  planPriceSnapshot: number | null;
  currentSubscriptionStatus: string;
  currentEndsAt: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  instructionsSentAt: string | null;
  instructionsEmailId: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  approvedAt: string | null;
  activationDeadline: string | null;
  paymentConfirmedAt: string | null;
  activationEmailSentAt: string | null;
  activationEmailId: string | null;
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
          <p class="mt-1 text-2xl font-bold text-text-primary">{{ newRegistrationCount() }}</p>
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
              @for (option of statusFilterOptions(); track option.value) {
                <option [value]="option.value">{{ option.label }}</option>
              }
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
            <table class="w-full min-w-[980px] text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-border">
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Tipo</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Usuario</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Plan solicitado</th>
                  <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Detalle</th>
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
                    <td class="p-4 text-text-primary font-semibold">{{ request.requestedPlan }}</td>
                    <td class="p-4 text-text-secondary font-medium">{{ listDetail(request) }}</td>
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
                @if (selectedRequest.registrationKind === 'request') {
                  <span class="text-xs font-semibold text-text-secondary">Transiciones seguras desde servidor.</span>
                }
              </div>

              @if (selectedRequest.source === 'subscription') {
                <div class="rounded-lg border border-border bg-gray-50 p-4">
                  <p class="text-sm font-semibold text-text-primary">{{ subscriptionRequestStageText(selectedRequest) }}</p>
                </div>
              } @else if (selectedRequest.registrationKind === 'request') {
                <div class="rounded-lg border border-border bg-gray-50 p-4">
                  <p class="text-sm font-semibold text-text-primary">{{ registrationRequestStageText(selectedRequest) }}</p>
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
                } @else if (selectedRequest.registrationKind === 'request') {
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Plan solicitado</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.requestedPlan }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Tipo</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.typeLabel }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Dias incluidos</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ daysLabel(selectedRequest.includedTrialDays) }}</p>
                  </div>
                  @if (selectedRequest.requestedPlanCode !== 'trial') {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Precio snapshot</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatPrice(selectedRequest.planPriceSnapshot) }}</p>
                    </div>
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Dias comprados</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ daysLabel(selectedRequest.requestedPeriodDays) }}</p>
                    </div>
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Total estimado</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ daysLabel(totalRegistrationDays(selectedRequest)) }}</p>
                    </div>
                  }
                  @if (selectedRequest.instructionsSentAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Instrucciones enviadas</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.instructionsSentAt) }}</p>
                    </div>
                  }
                  @if (selectedRequest.activationEmailSentAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Correo activacion</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.activationEmailSentAt) }}</p>
                    </div>
                  }
                  @if (selectedRequest.paymentConfirmedAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Pago confirmado</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.paymentConfirmedAt) }}</p>
                    </div>
                  }
                  @if (selectedRequest.approvedAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Aprobada</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.approvedAt) }}</p>
                    </div>
                  }
                  @if (selectedRequest.activationDeadline) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Fecha limite activacion</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.activationDeadline) }}</p>
                    </div>
                  }
                  @if (selectedRequest.cancelledAt) {
                    <div class="rounded-lg border border-border p-4">
                      <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Cancelada</p>
                      <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedRequest.cancelledAt) }}</p>
                    </div>
                  }
                  <div class="rounded-lg border border-border p-4 sm:col-span-2">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Notas admin</p>
                    <p class="mt-1 text-sm text-text-secondary whitespace-pre-line">{{ selectedRequest.notes || '-' }}</p>
                  </div>
                } @else {
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Rol</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedRequest.raw.role === 'admin_platform' ? 'Admin plataforma' : 'Dueno de negocio' }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Estado</p>
                    <p class="mt-1 font-semibold text-text-primary">Pendiente de aprobacion</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Plan solicitado</p>
                    <p class="mt-1 font-semibold text-text-primary">Sin seleccion</p>
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
              @if (selectedRequest.registrationKind === 'legacy') {
                <button type="button" class="btn-primary justify-center" [disabled]="approvingProfileId === selectedRequest.raw.id" (click)="approveRegistration(selectedRequest)">
                  @if (approvingProfileId === selectedRequest.raw.id) { Aprobando... } @else { Aprobar usuario }
                </button>
              } @else if (canCancelRegistrationRequest(selectedRequest)) {
                <button type="button" class="btn-secondary justify-center text-red-700 border-red-200 hover:bg-red-50" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="cancelRegistrationRequest(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Procesando... } @else { Cancelar solicitud }
                </button>
              } @else if (canCancelSubscriptionRequest(selectedRequest)) {
                <button type="button" class="btn-secondary justify-center text-red-700 border-red-200 hover:bg-red-50" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="cancelSubscriptionRequest(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Procesando... } @else { Cancelar solicitud }
                </button>
              }
              @if (canApproveTrialRegistration(selectedRequest)) {
                <button type="button" class="btn-primary justify-center" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="approveTrialRegistrationRequest(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Aprobando... } @else { Aprobar prueba }
                </button>
              }
              @if (canSendRegistrationInstructions(selectedRequest)) {
                <button type="button" class="btn-primary justify-center" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="sendRegistrationPaymentInstructions(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Enviando... } @else { Enviar instrucciones }
                </button>
              }
              @if (canCompletePaidRegistration(selectedRequest)) {
                <button type="button" class="btn-primary justify-center" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="completePaidRegistrationRequest(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Activando... } @else { Confirmar pago y activar cuenta }
                </button>
              }
              @if (canSendRegistrationActivationEmail(selectedRequest)) {
                <button type="button" class="btn-primary justify-center" [disabled]="resolvingRequestId === selectedRequest.raw.id" (click)="sendRegistrationActivationEmail(selectedRequest)">
                  @if (resolvingRequestId === selectedRequest.raw.id) { Enviando... } @else { Enviar correo de activacion }
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
  registrationRequests: any[] = [];
  legacyPendingProfiles: any[] = [];
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
      registrationRequests: this.platformService.getRegistrationRequests(),
      pendingProfiles: this.platformService.getPendingProfiles(),
      subscriptionRequests: this.platformService.getSubscriptionRequests(),
      pendingCount: this.platformService.getPendingRequestsCount(),
    }).subscribe({
      next: (res: {
        registrationRequests: ApiResponse<any[]>;
        pendingProfiles: ApiResponse<any[]>;
        subscriptionRequests: ApiResponse<any[]>;
        pendingCount: ApiResponse<any>;
      }) => {
        this.registrationRequests = res.registrationRequests.data;
        this.legacyPendingProfiles = res.pendingProfiles.data;
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
    if (!this.statusFilterOptions().some(option => option.value === this.statusFilter)) {
      this.statusFilter = 'all';
    }
  }

  openDetail(request: RequestInboxItem): void {
    this.selectedRequest = request;
  }

  closeDetail(): void {
    this.selectedRequest = null;
  }

  approveRegistration(request: RequestInboxItem): void {
    if (request.registrationKind !== 'legacy') return;
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

  canApproveTrialRegistration(request: RequestInboxItem): boolean {
    return request.registrationKind === 'request'
      && request.requestedPlanCode === 'trial'
      && request.status === 'pending_approval';
  }

  canSendRegistrationInstructions(request: RequestInboxItem): boolean {
    return request.registrationKind === 'request'
      && ['agenda', 'premium'].includes(request.requestedPlanCode ?? '')
      && request.status === 'pending_payment';
  }

  canCompletePaidRegistration(request: RequestInboxItem): boolean {
    return request.registrationKind === 'request'
      && ['agenda', 'premium'].includes(request.requestedPlanCode ?? '')
      && request.status === 'instructions_sent';
  }

  canCancelRegistrationRequest(request: RequestInboxItem): boolean {
    return request.registrationKind === 'request'
      && ['pending_approval', 'pending_payment', 'instructions_sent'].includes(request.status);
  }

  canSendRegistrationActivationEmail(request: RequestInboxItem): boolean {
    return request.registrationKind === 'request'
      && request.status === 'approved'
      && !request.activationEmailSentAt;
  }

  newRegistrationCount(): number {
    return this.registrationRequests.length + this.legacyPendingProfiles.length;
  }

  statusFilterOptions(): Array<{ value: RequestStatusFilter; label: string }> {
    if (this.activeTab === 'registrations') {
      return [
        { value: 'all', label: 'Todos los estados' },
        { value: 'pending_approval', label: 'Pendiente aprobacion' },
        { value: 'pending_payment', label: 'Pendiente pago' },
        { value: 'instructions_sent', label: 'Instrucciones enviadas' },
        { value: 'approved', label: 'Aprobada' },
        { value: 'cancelled', label: 'Cancelada' },
      ];
    }

    if (this.activeTab === 'subscriptions') {
      return [
        { value: 'all', label: 'Todos los estados' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'instructions_sent', label: 'Instrucciones enviadas' },
        { value: 'completed', label: 'Completada' },
        { value: 'cancelled', label: 'Cancelada' },
      ];
    }

    return [
      { value: 'all', label: 'Todos los estados' },
      { value: 'pending_approval', label: 'Pendiente aprobacion' },
      { value: 'pending_payment', label: 'Pendiente pago' },
      { value: 'pending', label: 'Pendiente suscripcion' },
      { value: 'instructions_sent', label: 'Instrucciones enviadas' },
      { value: 'approved', label: 'Aprobada' },
      { value: 'completed', label: 'Completada' },
      { value: 'cancelled', label: 'Cancelada' },
    ];
  }

  async approveTrialRegistrationRequest(request: RequestInboxItem): Promise<void> {
    if (!this.canApproveTrialRegistration(request)) return;

    const result = await Swal.fire({
      title: 'Aprobar cuenta',
      html: this.approveTrialConfirmationHtml(request),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar cuenta',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.approveTrialRegistrationRequest(request.raw.id).subscribe({
      next: () => {
        this.sendActivationEmailAfterAccountActivation(request.raw.id, 'Cuenta activada');
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo aprobar la cuenta.');
        this.resolvingRequestId = null;
      },
    });
  }

  async sendRegistrationPaymentInstructions(request: RequestInboxItem): Promise<void> {
    if (!this.canSendRegistrationInstructions(request)) return;

    const result = await Swal.fire({
      title: 'Enviar instrucciones de pago?',
      html: this.registrationInstructionsConfirmationHtml(request),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, enviar instrucciones',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.sendRegistrationPaymentInstructions(request.raw.id).subscribe({
      next: () => {
        this.toastService.success('Instrucciones enviadas.');
        this.resolvingRequestId = null;
        this.closeDetail();
        this.loadRequests();
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudieron enviar las instrucciones.');
        this.resolvingRequestId = null;
      },
    });
  }

  async completePaidRegistrationRequest(request: RequestInboxItem): Promise<void> {
    if (!this.canCompletePaidRegistration(request)) return;

    const result = await Swal.fire({
      title: 'Confirmar pago y activar cuenta',
      html: this.completePaidRegistrationConfirmationHtml(request),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar pago y activar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.completePaidRegistrationRequest(request.raw.id).subscribe({
      next: () => {
        this.sendActivationEmailAfterAccountActivation(request.raw.id, 'Pago confirmado y cuenta activada');
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo activar la cuenta.');
        this.resolvingRequestId = null;
      },
    });
  }

  async cancelRegistrationRequest(request: RequestInboxItem): Promise<void> {
    if (!this.canCancelRegistrationRequest(request)) return;

    const result = await Swal.fire({
      title: 'Cancelar solicitud',
      text: 'La solicitud quedara cerrada. La cuenta no sera activada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, cancelar solicitud',
      cancelButtonText: 'Volver',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.cancelRegistrationRequest(request.raw.id).subscribe({
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

  async sendRegistrationActivationEmail(request: RequestInboxItem): Promise<void> {
    if (!this.canSendRegistrationActivationEmail(request)) return;

    const result = await Swal.fire({
      title: 'Enviar correo de activacion?',
      text: 'Se notificara al usuario que su cuenta ya esta activa.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Enviar correo',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.resolvingRequestId = request.raw.id;
    this.platformService.sendRegistrationActivationEmail(request.raw.id).subscribe({
      next: () => {
        this.toastService.success('Correo de activacion enviado.');
        this.resolvingRequestId = null;
        this.closeDetail();
        this.loadRequests();
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo enviar el correo de activacion.');
        this.resolvingRequestId = null;
      },
    });
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

  private sendActivationEmailAfterAccountActivation(requestId: number, successTitle: string): void {
    this.platformService.sendRegistrationActivationEmail(requestId).subscribe({
      next: () => {
        this.toastService.success(`${successTitle}. Se envio el correo al usuario.`);
        void Swal.fire({
          title: successTitle,
          text: 'Se envio el correo al usuario.',
          icon: 'success',
          confirmButtonText: 'Entendido',
        });
        this.resolvingRequestId = null;
        this.closeDetail();
        this.loadRequests();
      },
      error: (err) => {
        this.toastService.warning('Cuenta activada, pero no se pudo enviar el correo de notificacion.');
        void Swal.fire({
          title: successTitle,
          text: err?.message ?? 'La cuenta fue activada, pero no se pudo enviar el correo de notificacion.',
          icon: 'warning',
          confirmButtonText: 'Entendido',
        });
        this.resolvingRequestId = null;
        this.closeDetail();
        this.loadRequests();
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
      pending_approval: 'Pendiente de aprobacion',
      pending_payment: 'Pendiente de pago',
      instructions_sent: 'Instrucciones enviadas',
      approved: 'Aprobada',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };

    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700',
      pending_approval: 'bg-amber-100 text-amber-700',
      pending_payment: 'bg-blue-100 text-blue-700',
      instructions_sent: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700',
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

  listDetail(request: RequestInboxItem): string {
    if (request.registrationKind === 'request') {
      if (request.requestedPlanCode === 'trial') {
        return `${this.daysLabel(request.includedTrialDays)} incluidos`;
      }

      return `${this.formatPrice(request.planPriceSnapshot)} - ${this.daysLabel(request.requestedPeriodDays)} comprados + ${this.daysLabel(request.includedTrialDays)} incluidos`;
    }

    if (request.registrationKind === 'legacy') {
      return 'Registro anterior sin seleccion de plan';
    }

    const business = request.businessName !== '-' ? request.businessName : 'Sin negocio';
    return `${business} - actual: ${request.currentPlan}`;
  }

  totalRegistrationDays(request: RequestInboxItem): number | null {
    if (request.registrationKind !== 'request') return null;
    return (request.requestedPeriodDays ?? 0) + (request.includedTrialDays ?? 0);
  }

  detailTitle(request: RequestInboxItem): string {
    return request.source === 'registration'
      ? request.userName
      : `${request.businessName} - ${request.requestedPlan}`;
  }

  registrationRequestStageText(request: RequestInboxItem): string {
    if (request.status === 'pending_approval') return 'Prueba gratuita pendiente de aprobacion. Puedes aprobar la cuenta o cancelar la solicitud.';
    if (request.status === 'pending_payment') return 'Pendiente de envio de instrucciones. Puedes enviar el correo de transferencia o cancelar la solicitud.';
    if (request.status === 'instructions_sent') return 'Instrucciones enviadas. Puedes confirmar el pago y activar la cuenta o cancelar la solicitud.';
    if (request.status === 'approved') return 'Registro aprobado. La cuenta ya puede ingresar; la suscripcion se creara cuando exista el negocio.';
    if (request.status === 'cancelled') return 'Registro cancelado. La cuenta no fue activada por esta solicitud.';

    return 'Solicitud de registro.';
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
    const registrationRequestItems = this.registrationRequests.map(request => this.mapRegistrationRequest(request));
    const legacyRegistrationItems = this.legacyPendingProfiles.map(profile => this.mapPendingProfile(profile));
    const subscriptionItems = this.subscriptionRequests.map(request => this.mapSubscriptionRequest(request));

    return [...registrationRequestItems, ...legacyRegistrationItems, ...subscriptionItems].sort((a, b) => {
      if (this.isOpenRequestStatus(a) && !this.isOpenRequestStatus(b)) return -1;
      if (!this.isOpenRequestStatus(a) && this.isOpenRequestStatus(b)) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  private mapRegistrationRequest(request: any): RequestInboxItem {
    return {
      id: `registration-request:${request.id}`,
      source: 'registration',
      registrationKind: 'request',
      typeLabel: request.requested_plan_code === 'trial' ? 'Prueba gratis' : 'Registro con plan',
      userName: request.profile?.name || 'Usuario',
      userEmail: request.profile?.email || '-',
      businessName: '-',
      currentPlan: '-',
      requestedPlan: this.registrationPlanLabel(request.requested_plan_code, request.requested_plan?.name),
      requestedPlanCode: request.requested_plan_code,
      remainingDays: null,
      requestedPeriodDays: request.purchased_period_days,
      includedTrialDays: request.included_trial_days,
      planPriceSnapshot: request.plan_price_snapshot,
      currentSubscriptionStatus: '-',
      currentEndsAt: null,
      notes: request.admin_notes,
      status: request.status,
      createdAt: request.created_at,
      instructionsSentAt: request.instructions_sent_at,
      instructionsEmailId: request.instructions_email_id,
      completedAt: null,
      cancelledAt: request.cancelled_at,
      approvedAt: request.approved_at,
      activationDeadline: request.activation_deadline,
      paymentConfirmedAt: request.payment_confirmed_at,
      activationEmailSentAt: request.activation_email_sent_at,
      activationEmailId: request.activation_email_id,
      raw: request,
    };
  }

  private mapPendingProfile(profile: any): RequestInboxItem {
    return {
      id: `legacy-registration:${profile.id}`,
      source: 'registration',
      registrationKind: 'legacy',
      typeLabel: 'Registro legacy',
      userName: profile.name || 'Usuario',
      userEmail: profile.email || '-',
      businessName: '-',
      currentPlan: '-',
      requestedPlan: 'Sin seleccion',
      requestedPlanCode: null,
      remainingDays: null,
      requestedPeriodDays: null,
      includedTrialDays: null,
      planPriceSnapshot: null,
      currentSubscriptionStatus: '-',
      currentEndsAt: null,
      notes: null,
      status: 'pending_approval',
      createdAt: profile.created_at,
      instructionsSentAt: null,
      instructionsEmailId: null,
      completedAt: null,
      cancelledAt: null,
      approvedAt: null,
      activationDeadline: null,
      paymentConfirmedAt: null,
      activationEmailSentAt: null,
      activationEmailId: null,
      raw: profile,
    };
  }

  private mapSubscriptionRequest(request: any): RequestInboxItem {
    return {
      id: `subscription:${request.id}`,
      source: 'subscription',
      registrationKind: null,
      typeLabel: this.requestTypeLabel(request.request_type),
      userName: request.profile?.name || 'Usuario',
      userEmail: request.profile?.email || '-',
      businessName: request.business?.name || '-',
      currentPlan: request.current_plan?.name || '-',
      requestedPlan: request.requested_plan?.name || '-',
      requestedPlanCode: request.requested_plan?.code ?? null,
      remainingDays: request.remaining_days_snapshot,
      requestedPeriodDays: request.requested_period_days,
      includedTrialDays: null,
      planPriceSnapshot: request.requested_plan?.price_clp ?? null,
      currentSubscriptionStatus: request.current_subscription_status || '-',
      currentEndsAt: request.current_ends_at,
      notes: request.notes,
      status: request.status,
      createdAt: request.created_at,
      instructionsSentAt: request.instructions_sent_at,
      instructionsEmailId: null,
      completedAt: request.completed_at,
      cancelledAt: request.cancelled_at,
      approvedAt: null,
      activationDeadline: null,
      paymentConfirmedAt: null,
      activationEmailSentAt: null,
      activationEmailId: null,
      raw: request,
    };
  }

  private registrationPlanLabel(planCode: string | null | undefined, planName: string | null | undefined): string {
    const labels: Record<string, string> = {
      trial: 'Prueba gratis',
      agenda: 'Agenda',
      premium: 'Premium',
    };

    return labels[planCode ?? ''] ?? planName ?? '-';
  }

  private isOpenRequestStatus(request: RequestInboxItem): boolean {
    if (request.source === 'registration') {
      return ['pending_approval', 'pending_payment', 'instructions_sent'].includes(request.status);
    }

    return ['pending', 'instructions_sent'].includes(request.status);
  }

  private approveTrialConfirmationHtml(request: RequestInboxItem): string {
    return `
      <div class="text-left space-y-3">
        <p><strong>Usuario:</strong> ${this.escapeHtml(request.userName)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(request.userEmail)}</p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p><strong>Plan:</strong> Prueba gratis</p>
          <p><strong>Dias incluidos:</strong> ${this.daysLabel(request.includedTrialDays)}</p>
        </div>
        <p>El usuario podra ingresar a Skedia una vez aprobada la cuenta.</p>
        <p>Tendra hasta 5 dias para configurar su negocio. Su periodo comenzara al completar la configuracion o, como maximo, al cumplirse ese plazo.</p>
      </div>
    `;
  }

  private completePaidRegistrationConfirmationHtml(request: RequestInboxItem): string {
    return `
      <div class="text-left space-y-3">
        <p><strong>Usuario:</strong> ${this.escapeHtml(request.userName)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(request.userEmail)}</p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p><strong>Plan solicitado:</strong> ${this.escapeHtml(request.requestedPlan)}</p>
          <p><strong>Precio snapshot:</strong> ${this.escapeHtml(this.formatPrice(request.planPriceSnapshot))}</p>
          <p><strong>Dias incluidos:</strong> ${this.daysLabel(request.includedTrialDays)}</p>
          <p><strong>Dias comprados:</strong> ${this.daysLabel(request.requestedPeriodDays)}</p>
          <p><strong>Total esperado:</strong> ${this.daysLabel(this.totalRegistrationDays(request))}</p>
        </div>
        <p>Al confirmar, la cuenta quedara habilitada.</p>
        <p>El usuario tendra hasta 5 dias para configurar su negocio. La suscripcion se creara posteriormente cuando exista el negocio.</p>
      </div>
    `;
  }

  private registrationInstructionsConfirmationHtml(request: RequestInboxItem): string {
    return `
      <div class="text-left space-y-3">
        <p><strong>Usuario:</strong> ${this.escapeHtml(request.userName)}</p>
        <p><strong>Email:</strong> ${this.escapeHtml(request.userEmail)}</p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p><strong>Plan:</strong> ${this.escapeHtml(request.requestedPlan)}</p>
          <p><strong>Precio:</strong> ${this.escapeHtml(this.formatPrice(request.planPriceSnapshot))}</p>
          <p><strong>Dias incluidos:</strong> ${this.daysLabel(request.includedTrialDays)}</p>
          <p><strong>Dias comprados:</strong> ${this.daysLabel(request.requestedPeriodDays)}</p>
          <p><strong>Total:</strong> ${this.daysLabel(this.totalRegistrationDays(request))}</p>
        </div>
        <p>Se enviara un correo con las instrucciones de transferencia.</p>
        <p>La cuenta todavia no sera activada.</p>
      </div>
    `;
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

  formatPrice(value: number | null | undefined): string {
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
