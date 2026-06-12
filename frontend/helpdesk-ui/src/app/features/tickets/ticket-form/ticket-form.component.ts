import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TicketService } from '../../../core/services/ticket.service';
import { Priority } from '../../../core/models/ticket.model';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent, SpinnerComponent],
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.scss']
})
export class TicketFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  isEditMode = false;
  ticketId?: number;
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  readonly priorityOptions = [
    { label: 'Low', value: Priority.Low },
    { label: 'Medium', value: Priority.Medium },
    { label: 'High', value: Priority.High },
    { label: 'Critical', value: Priority.Critical }
  ];

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    priority: [Priority.Low, Validators.required]
  });

  ngOnInit(): void {
    this.ticketId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.ticketId;

    if (this.isEditMode && this.ticketId) {
      this.loading = true;
      this.ticketService.getById(this.ticketId).subscribe({
        next: ticket => {
          this.form.patchValue({
            title: ticket.title,
            description: ticket.description,
            priority: ticket.priority
          });
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
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    const value = this.form.getRawValue() as { title: string; description: string; priority: Priority };

    const request$ = this.isEditMode && this.ticketId
      ? this.ticketService.update(this.ticketId, value)
      : this.ticketService.create(value);

    request$.subscribe({
      next: ticket => {
        this.submitting = false;
        this.router.navigate(['/tickets', ticket.id]);
      },
      error: err => {
        this.errorMessage = err.message;
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }
}