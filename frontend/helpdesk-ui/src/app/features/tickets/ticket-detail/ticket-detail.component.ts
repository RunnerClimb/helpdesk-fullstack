import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { TicketDetail, TicketStatus } from '../../../core/models/ticket.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SpinnerComponent, AlertComponent, StatusBadgeComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss']
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ticketService = inject(TicketService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  ticket?: TicketDetail;
  loading = false;
  errorMessage = '';
  successMessage = '';
  changingStatus = false;
  addingComment = false;

  readonly TicketStatus = TicketStatus;

  readonly statusTransitions: Record<TicketStatus, TicketStatus | null> = {
    [TicketStatus.Open]: TicketStatus.InProgress,
    [TicketStatus.InProgress]: TicketStatus.Resolved,
    [TicketStatus.Resolved]: TicketStatus.Closed,
    [TicketStatus.Closed]: null
  };

  readonly statusLabels: Record<TicketStatus, string> = {
    [TicketStatus.Open]: 'Open',
    [TicketStatus.InProgress]: 'InProgress',
    [TicketStatus.Resolved]: 'Resolved',
    [TicketStatus.Closed]: 'Closed'
  };

  commentForm = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1000)]]
  });

  get nextStatus(): TicketStatus | null {
    return this.ticket ? this.statusTransitions[this.ticket.status] : null;
  }

  get nextStatusLabel(): string {
    return this.nextStatus != null ? this.statusLabels[this.nextStatus] : '';
  }

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.loadTicket(id);
  }

  loadTicket(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.ticketService.getById(id).subscribe({
      next: t => {
        this.ticket = t;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.errorMessage = err.message;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  changeStatus(): void {
    if (!this.ticket || this.nextStatus == null) return;

    this.changingStatus = true;
    this.ticketService.changeStatus(this.ticket.id, this.nextStatus).subscribe({
      next: updated => {
        this.ticket = updated;
        this.successMessage = `Estado actualizado a ${this.nextStatusLabel}`;
        this.changingStatus = false;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.markForCheck();
        }, 3000);
      },
      error: err => {
        this.errorMessage = err.message;
        this.changingStatus = false;
        this.cdr.markForCheck();
      }
    });
  }

  submitComment(): void {
    if (this.commentForm.invalid || !this.ticket) {
      this.commentForm.markAllAsTouched();
      return;
    }

    this.addingComment = true;
    const text = this.commentForm.value.text!;

    this.ticketService.addComment(this.ticket.id, text).subscribe({
      next: comment => {
        this.ticket!.comments = [...this.ticket!.comments, comment];
        this.commentForm.reset();
        this.addingComment = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.errorMessage = err.message;
        this.addingComment = false;
        this.cdr.markForCheck();
      }
    });
  }
}