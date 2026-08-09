import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state fade-in">
      <div class="bg-gray-50 p-6 rounded-full mb-4">
        <span class="text-5xl">{{ icon }}</span>
      </div>
      <h3 class="text-lg font-bold text-text-primary mb-2">{{ title }}</h3>
      <p class="text-text-secondary max-w-sm mb-6">{{ description }}</p>
      
      <button 
        *ngIf="actionLabel" 
        (click)="onAction.emit()" 
        class="btn-primary"
      >
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon: string = '🔍';
  @Input() title: string = 'No se encontraron resultados';
  @Input() description: string = 'Intenta ajustar tus filtros o agregar un nuevo registro.';
  @Input() actionLabel?: string;
  
  @Output() onAction = new EventEmitter<void>();
}
