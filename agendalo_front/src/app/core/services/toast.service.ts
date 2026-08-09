import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  /** Signal que contiene la lista de toasts activos */
  toasts = signal<Toast[]>([]);
  private counter = 0;

  /**
   * Muestra un mensaje de éxito
   */
  success(message: string, duration = 4000) {
    this.show(message, 'success', duration);
  }

  /**
   * Muestra un mensaje de error
   */
  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }

  /**
   * Muestra un mensaje informativo
   */
  info(message: string, duration = 4000) {
    this.show(message, 'info', duration);
  }

  /**
   * Muestra un mensaje de advertencia
   */
  warning(message: string, duration = 4000) {
    this.show(message, 'warning', duration);
  }

  private show(message: string, type: ToastType, duration: number) {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration };
    
    // Añadir al inicio para que aparezcan arriba
    this.toasts.update(current => [toast, ...current]);

    // Auto-eliminar después del tiempo definido
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  /**
   * Elimina un toast manualmente por su ID
   */
  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
