import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketStatus, Priority } from '../../../core/models/ticket.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="badgeClass">{{ label }}</span>
  `
})
export class StatusBadgeComponent {
  @Input() status?: TicketStatus;
  @Input() priority?: Priority;

  get badgeClass(): string {
    if (this.status != null) {
      const map: Record<TicketStatus, string> = {
        [TicketStatus.Open]: 'bg-primary',
        [TicketStatus.InProgress]: 'bg-warning text-dark',
        [TicketStatus.Resolved]: 'bg-success',
        [TicketStatus.Closed]: 'bg-secondary'
      };
      return map[this.status];
    }
    if (this.priority != null) {
      const map: Record<Priority, string> = {
        [Priority.Low]: 'bg-info text-dark',
        [Priority.Medium]: 'bg-warning text-dark',
        [Priority.High]: 'bg-danger',
        [Priority.Critical]: 'bg-dark'
      };
      return map[this.priority];
    }
    return 'bg-secondary';
  }

  get label(): string {
    if (this.status != null) return TicketStatus[this.status];
    if (this.priority != null) return Priority[this.priority];
    return '';
  }
}