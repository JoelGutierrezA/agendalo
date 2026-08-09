import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          class="toast-card flex items-center gap-3 p-4 rounded-2xl shadow-2xl border pointer-events-auto transition-all duration-300 animate-slide-in"
          [ngClass]="{
            'bg-emerald-50/90 border-emerald-100 text-emerald-800 backdrop-blur-md': toast.type === 'success',
            'bg-rose-50/90 border-rose-100 text-rose-800 backdrop-blur-md': toast.type === 'error',
            'bg-blue-50/90 border-blue-100 text-blue-800 backdrop-blur-md': toast.type === 'info',
            'bg-amber-50/90 border-amber-100 text-amber-800 backdrop-blur-md': toast.type === 'warning'
          }"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg"
               [ngClass]="{
                 'bg-emerald-100': toast.type === 'success',
                 'bg-rose-100': toast.type === 'error',
                 'bg-blue-100': toast.type === 'info',
                 'bg-amber-100': toast.type === 'warning'
               }">
            @if (toast.type === 'success') { ✅ }
            @else if (toast.type === 'error') { ❌ }
            @else if (toast.type === 'info') { ℹ️ }
            @else if (toast.type === 'warning') { ⚠️ }
          </div>

          <!-- Message -->
          <div class="flex-1">
            <p class="text-sm font-medium leading-tight">{{ toast.message }}</p>
          </div>

          <!-- Close Button -->
          <button 
            (click)="toastService.remove(toast.id)"
            class="p-1 hover:bg-black/5 rounded-lg transition-colors opacity-50 hover:opacity-100"
          >
            <span class="text-xs">✕</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-slide-in {
      animation: slideIn 0.3s ease-out forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }

    .toast-card {
      min-width: 280px;
      max-width: 400px;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
