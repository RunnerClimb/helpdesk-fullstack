import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="alert alert-{{ type }} d-flex align-items-center" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2" *ngIf="type === 'danger'"></i>
      <i class="bi bi-info-circle-fill me-2" *ngIf="type === 'info'"></i>
      <i class="bi bi-check-circle-fill me-2" *ngIf="type === 'success'"></i>
      {{ message }}
    </div>
  `
})
export class AlertComponent {
  @Input() message = '';
  @Input() type: 'danger' | 'warning' | 'success' | 'info' = 'danger';
}