import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiResponse } from '../../../../models/auth.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PlatformService } from '../../services/platform.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <div class="space-y-6 max-w-[1400px] mx-auto p-6">
      <div class="page-header">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/Interfaz/Clientes.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
            <h1 class="page-title">Administracion de Usuarios</h1>
          </div>
        </div>
        <a routerLink="/admin-plataforma" class="btn-secondary">Volver</a>
      </div>

      <div class="card p-0 overflow-hidden">
        <div class="overflow-x-auto text-sm">
          <table class="w-full min-w-[1220px] text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="p-4 w-[230px] font-bold uppercase text-text-secondary tracking-wider">Usuario</th>
                <th class="p-4 w-[280px] font-bold uppercase text-text-secondary tracking-wider">Email</th>
                <th class="p-4 w-[85px] font-bold uppercase text-text-secondary tracking-wider">Rol</th>
                <th class="p-4 w-[115px] font-bold uppercase text-text-secondary tracking-wider">Estado</th>
                <th class="p-4 w-[140px] font-bold uppercase text-text-secondary tracking-wider">Plan</th>
                <th class="p-4 w-[135px] font-bold uppercase text-text-secondary tracking-wider whitespace-nowrap">Dias restantes</th>
                <th class="p-4 w-[190px] font-bold uppercase text-text-secondary tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @if (loading) {
                @for (i of [1,2,3,4,5]; track i) {
                  <tr>
                    <td class="p-4"><div class="skeleton-text w-32 h-4"></div><div class="skeleton-text w-16 h-2 mt-2"></div></td>
                    <td class="p-4"><div class="skeleton-text w-48 h-4"></div></td>
                    <td class="p-4"><div class="skeleton w-16 h-6 rounded-lg"></div></td>
                    <td class="p-4"><div class="skeleton w-20 h-6 rounded-lg"></div></td>
                    <td class="p-4"><div class="skeleton w-24 h-6 rounded-lg"></div></td>
                    <td class="p-4"><div class="skeleton-text w-20 h-4"></div></td>
                    <td class="p-4 text-right"><div class="skeleton w-24 h-10 rounded-xl ml-auto"></div></td>
                  </tr>
                }
              } @else {
                @for (user of users; track user.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors fade-in">
                    <td class="p-4">
                      <div class="font-bold text-text-primary">{{ user.name }}</div>
                    </td>
                    <td class="p-4 text-text-secondary font-medium">{{ user.email }}</td>
                    <td class="p-4">
                      <span
                        class="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight"
                        [class]="user.role === 'admin_platform' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                      >
                        {{ user.role === 'admin_platform' ? 'Admin' : 'Dueño' }}
                      </span>
                    </td>
                    <td class="p-4 text-xs font-semibold">
                      <span
                        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        [class]="statusClass(user)"
                      >
                        <span class="w-2 h-2 rounded-full" [class]="statusDotClass(user)"></span>
                        {{ statusLabel(user) }}
                      </span>
                    </td>
                    <td class="p-4 text-xs font-semibold">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded-lg whitespace-nowrap"
                        [class]="planClass(user)"
                      >
                        {{ planLabel(user) }}
                      </span>
                    </td>
                    <td class="p-4 text-text-secondary font-medium whitespace-nowrap">
                      {{ daysRemainingLabel(user) }}
                    </td>
                    <td class="p-4 text-right whitespace-nowrap">
                      <div class="inline-flex flex-nowrap justify-end gap-2">
                        <button
                          type="button"
                          (click)="openUserModal(user)"
                          class="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all border text-blue-700 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                          aria-label="Ver usuario"
                          title="Ver"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>

                      @if (user.role !== 'admin_platform') {
                          @if (isPendingUser(user)) {
                            <button
                              type="button"
                              (click)="approveUser(user)"
                              class="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all border text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                              [disabled]="updatingUserId === user.id || deletingUserId === user.id"
                              aria-label="Aceptar usuario"
                              title="Aceptar"
                            >
                              @if (updatingUserId === user.id) {
                                <span class="h-4 w-4 rounded-full border-2 border-green-200 border-t-green-700 animate-spin" aria-hidden="true"></span>
                              } @else {
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                  <path d="M20 6 9 17l-5-5"></path>
                                </svg>
                              }
                            </button>
                          } @else {
                            <button
                              type="button"
                              (click)="toggleStatus(user)"
                              class="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
                              [disabled]="updatingUserId === user.id || deletingUserId === user.id"
                              [attr.aria-label]="user.is_active ? 'Dar de baja usuario' : 'Dar de alta usuario'"
                              [title]="user.is_active ? 'Dar de baja' : 'Dar de alta'"
                              [class]="user.is_active ? 'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300' : 'text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300'"
                            >
                              @if (user.is_active) {
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                  <path d="M12 2v10"></path>
                                  <path d="M18.4 6.6a9 9 0 1 1-12.8 0"></path>
                                </svg>
                              } @else {
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                  <path d="M20 6 9 17l-5-5"></path>
                                </svg>
                              }
                            </button>
                          }
                          <button
                            type="button"
                            (click)="deleteUser(user)"
                            class="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all border text-red-700 border-red-300 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            [disabled]="updatingUserId === user.id || deletingUserId === user.id"
                            [attr.aria-label]="isPendingUser(user) ? 'Rechazar usuario' : 'Eliminar usuario'"
                            [title]="isPendingUser(user) ? 'Rechazar' : 'Eliminar'"
                          >
                            @if (deletingUserId === user.id) {
                              <span class="h-4 w-4 rounded-full border-2 border-red-200 border-t-red-700 animate-spin" aria-hidden="true"></span>
                            } @else {
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M3 6h18"></path>
                                <path d="M8 6V4h8v2"></path>
                                <path d="M19 6l-1 14H6L5 6"></path>
                                <path d="M10 11v5"></path>
                                <path d="M14 11v5"></path>
                              </svg>
                            }
                          </button>
                      }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
          @if (users.length === 0 && !loading) {
            <app-empty-state
              icon="users"
              title="No hay usuarios registrados"
              description="Aun no hay usuarios registrados en la plataforma."
            ></app-empty-state>
          }
        </div>

        <div class="p-4 border-t border-border flex justify-between items-center bg-gray-50/30">
          <span class="text-xs font-medium text-text-secondary">Pagina {{ currentPage }} de {{ lastPage }}</span>
          <div class="flex gap-2">
            <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage === 1" class="btn-secondary btn-sm px-4">Anterior</button>
            <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage === lastPage" class="btn-secondary btn-sm px-4">Siguiente</button>
          </div>
        </div>
      </div>

      @if (selectedUser) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <button
            type="button"
            class="absolute inset-0"
            aria-label="Cerrar detalle"
            (click)="closeUserModal()"
          ></button>

          <section class="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header class="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
              <div class="min-w-0">
                <h2 class="text-2xl font-bold text-text-primary truncate">{{ selectedUser.name }}</h2>
              </div>
              <button
                type="button"
                class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-gray-50 hover:text-text-primary"
                aria-label="Cerrar"
                title="Cerrar"
                (click)="closeUserModal()"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </button>
            </header>

            <div class="bg-slate-100 px-6 pt-5">
              <div class="flex items-end gap-3">
                <button
                  type="button"
                  class="relative h-12 min-w-[132px] px-5 rounded-t-2xl border border-b-0 text-sm font-bold transition-all duration-200"
                  [class]="activeDetailTab === 'user' ? 'bg-white border-border text-primary shadow-sm translate-y-px' : 'bg-amber-300 border-amber-300 text-amber-950 hover:bg-amber-200'"
                  (click)="activeDetailTab = 'user'"
                >
                  Usuario
                </button>
                <button
                  type="button"
                  class="relative h-12 min-w-[132px] px-5 rounded-t-2xl border border-b-0 text-sm font-bold transition-all duration-200"
                  [class]="activeDetailTab === 'business' ? 'bg-white border-border text-primary shadow-sm translate-y-px' : 'bg-sky-500 border-sky-500 text-white hover:bg-sky-400'"
                  (click)="activeDetailTab = 'business'"
                >
                  Negocio
                </button>
              </div>
            </div>

            <div class="max-h-[62vh] overflow-y-auto border-t border-border bg-white p-6">
              @if (activeDetailTab === 'user') {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Nombre</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedUser.name || '-' }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Email de cuenta</p>
                    <p class="mt-1 font-semibold text-text-primary break-all">{{ selectedUser.email || '-' }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Rol</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ selectedUser.role === 'admin_platform' ? 'Admin' : 'Dueño' }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Estado</p>
                    <span class="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold" [class]="statusClass(selectedUser)">
                      <span class="w-2 h-2 rounded-full" [class]="statusDotClass(selectedUser)"></span>
                      {{ statusLabel(selectedUser) }}
                    </span>
                  </div>
                  @if (canManageSubscription(selectedUser)) {
                    <div class="rounded-lg border border-border bg-gray-50/60 p-4 sm:col-span-2">
                      <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Gestion de suscripcion</p>
                          <p class="mt-1 text-sm text-text-secondary">Administra planes, vencimientos y dias manuales.</p>
                        </div>
                        @if (updatingSubscriptionUserId === selectedUser.id) {
                          <span class="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                            <span class="h-4 w-4 rounded-full border-2 border-blue-200 border-t-primary animate-spin" aria-hidden="true"></span>
                            Guardando
                          </span>
                        }
                      </div>

                      <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div class="rounded-lg border border-border bg-white p-3">
                          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Plan actual</p>
                          <p class="mt-1 text-sm font-bold text-text-primary">{{ currentPlanLabel(selectedUser) }}</p>
                        </div>
                        <div class="rounded-lg border border-border bg-white p-3">
                          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Estado</p>
                          <span class="mt-2 inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold" [class]="subscriptionStatusClass(selectedUser)">
                            {{ subscriptionStatusLabel(selectedUser) }}
                          </span>
                        </div>
                        <div class="rounded-lg border border-border bg-white p-3">
                          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Inicio</p>
                          <p class="mt-1 text-sm font-semibold text-text-primary">{{ formatDate(selectedUser.subscription?.starts_at) }}</p>
                        </div>
                        <div class="rounded-lg border border-border bg-white p-3">
                          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Vencimiento</p>
                          <p class="mt-1 text-sm font-semibold text-text-primary">{{ formatDate(selectedUser.subscription?.ends_at) }}</p>
                        </div>
                        <div class="rounded-lg border border-border bg-white p-3">
                          <p class="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Dias restantes</p>
                          <p class="mt-1 text-sm font-bold text-text-primary">{{ daysRemainingLabel(selectedUser) }}</p>
                        </div>
                      </div>

                      @if (selectedUser.subscription) {
                        <div class="mt-4 rounded-lg border border-border bg-white p-3">
                          <label class="text-xs font-bold uppercase tracking-wider text-text-secondary" [attr.for]="'custom-days-' + selectedUser.id">Dias personalizados</label>
                          <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <input
                              [id]="'custom-days-' + selectedUser.id"
                              type="number"
                              inputmode="numeric"
                              min="1"
                              step="1"
                              class="input-field h-10 sm:max-w-[180px]"
                              placeholder="Ej. 45"
                              [value]="customDaysValue(selectedUser)"
                              (input)="setCustomDays(selectedUser, $any($event.target).value)"
                            >
                            <span class="text-xs text-text-secondary">Debe ser un numero entero mayor a 0.</span>
                          </div>
                          @if (customDaysErrorMessage(selectedUser)) {
                            <p class="mt-2 text-xs font-semibold text-red-600">{{ customDaysErrorMessage(selectedUser) }}</p>
                          }
                        </div>

                        <div class="mt-4 space-y-4">
                          @if (isTrialSubscription(selectedUser)) {
                            <div class="rounded-lg border border-cyan-100 bg-cyan-50/50 p-3">
                              <p class="text-sm font-bold text-text-primary">Extender trial</p>
                              <div class="mt-3 flex flex-wrap gap-2">
                                @for (days of dayOptions; track days) {
                                  <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="extendTrial(selectedUser, days)">+{{ days }} dias</button>
                                }
                                <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="extendTrial(selectedUser)">Personalizado</button>
                              </div>
                            </div>

                            <div class="rounded-lg border border-border p-3">
                              <p class="text-sm font-bold text-text-primary">Convertir trial a suscripcion activa</p>
                              <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                @for (plan of planOptions; track plan.code) {
                                  <div class="rounded-lg border border-border p-3">
                                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ plan.name }}</p>
                                    <div class="mt-3 flex flex-wrap gap-2">
                                      @for (days of dayOptions; track days) {
                                        <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="convertTrialToPlan(selectedUser, plan.code, days)">{{ days }} dias</button>
                                      }
                                      <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="convertTrialToPlan(selectedUser, plan.code)">Personalizado</button>
                                    </div>
                                  </div>
                                }
                              </div>
                            </div>
                          } @else if (isActiveSubscription(selectedUser)) {
                            <div class="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                              <p class="text-sm font-bold text-text-primary">Extender suscripcion</p>
                              <div class="mt-3 flex flex-wrap gap-2">
                                @for (days of dayOptions; track days) {
                                  <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="extendActiveSubscription(selectedUser, days)">+{{ days }} dias</button>
                                }
                                <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="extendActiveSubscription(selectedUser)">Personalizado</button>
                              </div>
                            </div>

                            <div class="rounded-lg border border-border p-3">
                              <p class="text-sm font-bold text-text-primary">Cambiar plan</p>
                              <div class="mt-3 flex flex-wrap gap-2">
                                @for (plan of alternativePlans(selectedUser); track plan.code) {
                                  <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="changePlan(selectedUser, plan.code)">Cambiar a {{ plan.name }}</button>
                                }
                              </div>
                            </div>
                          } @else if (isExpiredSubscription(selectedUser)) {
                            <div class="rounded-lg border border-red-100 bg-red-50/50 p-3">
                              <p class="text-sm font-bold text-text-primary">Reactivar suscripcion vencida</p>
                              <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                @for (plan of planOptions; track plan.code) {
                                  <div class="rounded-lg border border-red-100 bg-white p-3">
                                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ plan.name }}</p>
                                    <div class="mt-3 flex flex-wrap gap-2">
                                      @for (days of dayOptions; track days) {
                                        <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="reactivateSubscription(selectedUser, plan.code, days)">{{ days }} dias</button>
                                      }
                                      <button type="button" class="btn-secondary btn-sm" [disabled]="isUpdatingSubscription(selectedUser)" (click)="reactivateSubscription(selectedUser, plan.code)">Personalizado</button>
                                    </div>
                                  </div>
                                }
                              </div>
                            </div>
                          } @else {
                            <div class="rounded-lg border border-dashed border-border p-3">
                              <p class="text-sm font-semibold text-text-secondary">No hay acciones manuales disponibles para este estado.</p>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="mt-4 rounded-lg border border-dashed border-border p-4 text-sm font-semibold text-text-secondary">
                          Este negocio aun no tiene una suscripcion registrada.
                        </div>
                      }
                    </div>
                  }
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Creado</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedUser.created_at) }}</p>
                  </div>
                  <div class="rounded-lg border border-border p-4">
                    <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Actualizado</p>
                    <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedUser.updated_at) }}</p>
                  </div>
                </div>
              } @else {
                @if (selectedUser.business) {
                  <div class="space-y-5">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-border p-4">
                      <div class="min-w-0">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Negocio registrado</p>
                        <h3 class="mt-1 text-xl font-bold text-text-primary truncate">{{ selectedUser.business.name }}</h3>
                      </div>
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold self-start"
                        [class]="selectedUser.business.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        <span class="w-2 h-2 rounded-full" [class]="selectedUser.business.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                        {{ selectedUser.business.is_active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div class="rounded-lg border border-border p-4">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Email publico</p>
                        <p class="mt-1 font-semibold text-text-primary break-all">{{ selectedUser.business.email || '-' }}</p>
                      </div>
                      <div class="rounded-lg border border-border p-4">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Telefono</p>
                        <p class="mt-1 font-semibold text-text-primary">{{ selectedUser.business.phone || '-' }}</p>
                      </div>
                      <div class="rounded-lg border border-border p-4">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Ciudad</p>
                        <p class="mt-1 font-semibold text-text-primary">{{ selectedUser.business.city || '-' }}</p>
                      </div>
                      <div class="rounded-lg border border-border p-4">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Pais</p>
                        <p class="mt-1 font-semibold text-text-primary">{{ selectedUser.business.country || '-' }}</p>
                      </div>
                      <div class="rounded-lg border border-border p-4 sm:col-span-2">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Direccion</p>
                        <p class="mt-1 font-semibold text-text-primary">{{ selectedUser.business.address || '-' }}</p>
                      </div>
                      <div class="rounded-lg border border-border p-4 sm:col-span-2">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Descripcion</p>
                        <p class="mt-1 text-sm text-text-secondary whitespace-pre-line">{{ selectedUser.business.description || '-' }}</p>
                      </div>
                      <div class="rounded-lg border border-border p-4">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Creado</p>
                        <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedUser.business.created_at) }}</p>
                      </div>
                      <div class="rounded-lg border border-border p-4">
                        <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Actualizado</p>
                        <p class="mt-1 font-semibold text-text-primary">{{ formatDate(selectedUser.business.updated_at) }}</p>
                      </div>
                    </div>
                  </div>
                } @else {
                  <div class="rounded-lg border border-dashed border-border p-8 text-center">
                    <p class="text-lg font-bold text-text-primary">Sin negocio registrado</p>
                    <p class="mt-2 text-sm text-text-secondary">Este usuario todavia no ha completado el onboarding del negocio.</p>
                  </div>
                }
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = true;
  currentPage = 1;
  lastPage = 1;
  deletingUserId: string | null = null;
  updatingUserId: string | null = null;
  updatingSubscriptionUserId: string | null = null;
  customDaysByUserId: Record<string, string> = {};
  customDaysErrors: Record<string, string> = {};
  selectedUser: any | null = null;
  activeDetailTab: 'user' | 'business' = 'user';
  readonly dayOptions = [7, 14, 30];
  planOptions: any[] = [
    { code: 'agenda', name: 'Agenda' },
    { code: 'premium', name: 'Premium' },
  ];

  constructor(
    private platformService: PlatformService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPlans();
    this.loadPage(1);
  }

  loadPlans(): void {
    this.platformService.getPlans().subscribe({
      next: (res: ApiResponse<any>) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          this.planOptions = res.data;
        }
      },
      error: () => undefined,
    });
  }

  loadPage(page: number): void {
    this.loading = true;
    this.platformService.getUsers(page).subscribe({
      next: (res: ApiResponse<any>) => {
        this.users = res.data.data;
        this.currentPage = res.data.current_page;
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openUserModal(user: any): void {
    this.selectedUser = user;
    this.activeDetailTab = 'user';
  }

  closeUserModal(): void {
    this.selectedUser = null;
    this.activeDetailTab = 'user';
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

  toggleStatus(user: any): void {
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!confirm(`Estas seguro de que deseas ${action} el acceso de ${user.name}?`)) return;

    this.updatingUserId = user.id;
    this.platformService.toggleUserStatus(user.id).subscribe({
      next: () => {
        user.is_active = !user.is_active;
        this.toastService.success(`Usuario ${user.is_active ? 'activado' : 'desactivado'}.`);
        this.updatingUserId = null;
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo actualizar el usuario');
        this.updatingUserId = null;
      },
    });
  }

  approveUser(user: any): void {
    if (!confirm(`Aceptar la solicitud de ${user.name}? Desde ese momento podra iniciar sesion.`)) return;

    this.updatingUserId = user.id;
    this.platformService.approveUser(user.id).subscribe({
      next: () => {
        user.is_active = true;
        this.toastService.success('Usuario aprobado. Ya puede iniciar sesion.');
        this.updatingUserId = null;
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo aprobar el usuario');
        this.updatingUserId = null;
      },
    });
  }

  deleteUser(user: any): void {
    const confirmed = confirm(
      this.isPendingUser(user)
        ? `Rechazar y eliminar la solicitud de ${user.name} (${user.email})? Esta accion no se puede deshacer.`
        : `Esta accion eliminara definitivamente la cuenta de ${user.name} (${user.email}) y sus datos asociados. Esta accion no se puede deshacer.`
    );

    if (!confirmed) return;

    this.deletingUserId = user.id;
    this.platformService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(current => current.id !== user.id);
        this.toastService.success(this.isPendingUser(user) ? 'Solicitud rechazada.' : 'Usuario eliminado definitivamente.');

        if (this.users.length === 0 && this.currentPage > 1) {
          this.loadPage(this.currentPage - 1);
          return;
        }

        this.deletingUserId = null;
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo eliminar el usuario');
        this.deletingUserId = null;
      },
    });
  }

  canManageSubscription(user: any): boolean {
    return user.role !== 'admin_platform' && !!user.business?.id;
  }

  extendTrial(user: any, days?: number): void {
    const resolvedDays = days ?? this.resolveCustomDays(user);
    if (!resolvedDays || !user.business?.id) return;

    if (!confirm(`Extender la prueba gratuita de ${user.name} por ${resolvedDays} dias?`)) return;

    this.runSubscriptionUpdate(
      user,
      this.platformService.extendTrialSubscription(user.business.id, resolvedDays),
      `Trial extendido ${resolvedDays} dias.`
    );
  }

  extendActiveSubscription(user: any, days?: number): void {
    const resolvedDays = days ?? this.resolveCustomDays(user);
    if (!resolvedDays || !user.business?.id) return;

    if (!confirm(`Extender la suscripcion de ${user.name} por ${resolvedDays} dias?`)) return;

    this.runSubscriptionUpdate(
      user,
      this.platformService.extendActiveSubscription(user.business.id, resolvedDays),
      `Suscripcion extendida ${resolvedDays} dias.`
    );
  }

  changePlan(user: any, planCode: string): void {
    if (!user.business?.id) return;

    const planName = this.planName(planCode);
    if (!confirm(`Cambiar el plan de ${user.name} a ${planName} conservando el vencimiento actual?`)) return;

    this.runSubscriptionUpdate(
      user,
      this.platformService.changeBusinessSubscriptionPlan(user.business.id, planCode),
      `Plan cambiado a ${planName}.`
    );
  }

  convertTrialToPlan(user: any, planCode: string, days?: number): void {
    const resolvedDays = days ?? this.resolveCustomDays(user);
    if (!resolvedDays || !user.business?.id) return;

    const planName = this.planName(planCode);
    if (!confirm(`Convertir el trial de ${user.name} a ${planName} activo por ${resolvedDays} dias desde hoy?`)) return;

    this.runSubscriptionUpdate(
      user,
      this.platformService.convertTrialToPlan(user.business.id, planCode, resolvedDays),
      `Trial convertido a ${planName} por ${resolvedDays} dias.`
    );
  }

  reactivateSubscription(user: any, planCode: string, days?: number): void {
    const resolvedDays = days ?? this.resolveCustomDays(user);
    if (!resolvedDays || !user.business?.id) return;

    const planName = this.planName(planCode);
    if (!confirm(`Reactivar la suscripcion de ${user.name} como ${planName} por ${resolvedDays} dias desde hoy?`)) return;

    this.runSubscriptionUpdate(
      user,
      this.platformService.reactivateBusinessSubscription(user.business.id, planCode, resolvedDays),
      `Suscripcion reactivada como ${planName} por ${resolvedDays} dias.`
    );
  }

  private runSubscriptionUpdate(user: any, request: Observable<ApiResponse<any>>, successMessage: string): void {
    this.updatingSubscriptionUserId = user.id;
    request.subscribe({
      next: (res: ApiResponse<any>) => {
        this.applySubscriptionUpdate(user.id, res.data);
        this.toastService.success(successMessage);
        this.updatingSubscriptionUserId = null;
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo actualizar la suscripcion');
        this.updatingSubscriptionUserId = null;
      },
    });
  }

  private applySubscriptionUpdate(userId: string, subscription: any): void {
    this.users = this.users.map(user => (
      user.id === userId
        ? { ...user, subscription }
        : user
    ));

    if (this.selectedUser?.id === userId) {
      this.selectedUser = { ...this.selectedUser, subscription };
    }
  }

  private planName(planCode: string): string {
    return this.planOptions.find(plan => plan.code === planCode)?.name ?? 'seleccionado';
  }

  customDaysValue(user: any): string {
    return this.customDaysByUserId[user.id] ?? '';
  }

  setCustomDays(user: any, value: string): void {
    this.customDaysByUserId[user.id] = value;
    delete this.customDaysErrors[user.id];
  }

  customDaysErrorMessage(user: any): string {
    return this.customDaysErrors[user.id] ?? '';
  }

  isUpdatingSubscription(user: any): boolean {
    return this.updatingSubscriptionUserId === user.id;
  }

  currentPlanLabel(user: any): string {
    if (!user.subscription) return 'Sin plan';
    if (user.subscription.status === 'trialing') return 'Premium';
    return user.subscription.plan?.name ?? 'Plan';
  }

  subscriptionStatusLabel(user: any): string {
    if (!user.subscription) return 'Sin suscripcion';
    if (this.isExpiredSubscription(user)) return 'Vencida';
    if (user.subscription.status === 'trialing') return 'Prueba gratuita';
    if (user.subscription.status === 'active') return 'Activa';
    if (user.subscription.status === 'past_due') return 'Pago pendiente';
    if (user.subscription.status === 'cancelled') return 'Cancelada';
    return user.subscription.status;
  }

  subscriptionStatusClass(user: any): string {
    if (!user.subscription) return 'bg-slate-100 text-slate-600';
    if (this.isExpiredSubscription(user)) return 'bg-red-100 text-red-700';
    if (user.subscription.status === 'trialing') return 'bg-cyan-100 text-cyan-700';
    if (user.subscription.status === 'active') return 'bg-green-100 text-green-700';
    if (user.subscription.status === 'past_due') return 'bg-amber-100 text-amber-700';
    if (user.subscription.status === 'cancelled') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }

  isTrialSubscription(user: any): boolean {
    return user.subscription?.status === 'trialing' && !this.isExpiredSubscription(user);
  }

  isActiveSubscription(user: any): boolean {
    return user.subscription?.status === 'active' && !this.isExpiredSubscription(user);
  }

  isExpiredSubscription(user: any): boolean {
    if (!user.subscription) return false;
    if (user.subscription.status === 'expired') return true;
    if (user.subscription.status === 'cancelled') return false;

    const days = this.daysRemaining(user);
    return days !== null && days === 0;
  }

  alternativePlans(user: any): any[] {
    const currentPlanCode = user.subscription?.plan?.code;
    return this.planOptions.filter(plan => plan.code !== currentPlanCode);
  }

  private resolveCustomDays(user: any): number | null {
    const rawValue = this.customDaysValue(user).trim();
    const days = Number(rawValue);

    if (!rawValue || !Number.isInteger(days) || days <= 0) {
      this.customDaysErrors[user.id] = 'Ingresa una cantidad de dias mayor a 0.';
      return null;
    }

    return days;
  }

  isPendingUser(user: any): boolean {
    return !user.is_active && !user.business_id;
  }

  planLabel(user: any): string {
    if (user.role === 'admin_platform') return 'No aplica';
    if (this.isPendingUser(user)) return 'Pendiente';
    if (!user.subscription) return 'Sin plan';

    const planName = user.subscription.plan?.name ?? 'Plan';

    if (this.isExpiredSubscription(user)) return `${planName} vencido`;
    if (user.subscription.status === 'trialing') return 'Prueba gratuita';
    if (user.subscription.status === 'past_due') return `${planName} pendiente`;
    if (user.subscription.status === 'cancelled') return `${planName} cancelado`;

    return planName;
  }

  planClass(user: any): string {
    if (user.role === 'admin_platform') return 'bg-slate-100 text-slate-600';
    if (this.isPendingUser(user)) return 'bg-amber-100 text-amber-700';
    if (!user.subscription) return 'bg-slate-100 text-slate-600';
    if (this.isExpiredSubscription(user)) return 'bg-red-100 text-red-700';
    if (user.subscription.status === 'trialing') return 'bg-cyan-100 text-cyan-700';
    if (user.subscription.status === 'past_due') return 'bg-amber-100 text-amber-700';
    if (user.subscription.status === 'cancelled') return 'bg-red-100 text-red-700';
    if (user.subscription.plan?.code === 'premium') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  }

  daysRemainingLabel(user: any): string {
    if (user.role === 'admin_platform') return 'N/A';
    if (this.isPendingUser(user)) return 'Pendiente';
    if (!user.subscription) return 'Sin plan';
    if (user.subscription.status === 'cancelled') return 'Cancelado';

    const days = this.daysRemaining(user);
    if (days === null) return '-';

    return days === 1 ? '1 dia' : `${days} dias`;
  }

  daysRemaining(user: any): number | null {
    const endsAt = user.subscription?.ends_at;
    if (!endsAt) return null;

    const endTime = new Date(endsAt).getTime();
    if (Number.isNaN(endTime)) return null;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.ceil((endTime - Date.now()) / millisecondsPerDay));
  }

  statusLabel(user: any): string {
    if (this.isPendingUser(user)) return 'Pendiente';
    return user.is_active ? 'Activo' : 'Inactivo';
  }

  statusClass(user: any): string {
    if (this.isPendingUser(user)) return 'bg-amber-100 text-amber-700';
    return user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  }

  statusDotClass(user: any): string {
    if (this.isPendingUser(user)) return 'bg-amber-500';
    return user.is_active ? 'bg-green-500' : 'bg-red-500';
  }
}
