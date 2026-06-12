import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { TicketService } from '../../../core/services/ticket.service';
import { TicketSummary, TicketStatus, Priority, TicketFilters } from '../../../core/models/ticket.model';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SpinnerComponent, AlertComponent, StatusBadgeComponent],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss']
})
export class TicketListComponent implements OnInit {
  private readonly ticketService = inject(TicketService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly searchSubject = new Subject<string>();

  tickets: TicketSummary[] = [];
  loading = false;
  errorMessage = '';
  total = 0;

  filters: TicketFilters = { page: 1, pageSize: 10 };
  searchText = '';

  readonly statusOptions = Object.entries(TicketStatus)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => ({ label: k, value: v as number }));

  readonly priorityOptions = Object.entries(Priority)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => ({ label: k, value: v as number }));

  readonly TicketStatus = TicketStatus;
  readonly Priority = Priority;

  get totalPages(): number {
    return Math.ceil(this.total / this.filters.pageSize);
  }

  ngOnInit(): void {
    this.loadTickets();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(q => {
      this.filters = { ...this.filters, q, page: 1 };
      this.loadTickets();
    });
  }

  loadTickets(): void {
    this.loading = true;
    this.errorMessage = '';

    this.ticketService.getTickets(this.filters).subscribe({
      next: result => {
        this.tickets = result.items;
        this.total = result.total;
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

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusChange(value: string): void {
    this.filters = {
      ...this.filters,
      status: value !== '' ? +value as TicketStatus : null,
      page: 1
    };
    this.loadTickets();
  }

  onPriorityChange(value: string): void {
    this.filters = {
      ...this.filters,
      priority: value !== '' ? +value as Priority : null,
      page: 1
    };
    this.loadTickets();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.filters = { ...this.filters, page };
    this.loadTickets();
  }

  goToDetail(id: number): void {
    this.router.navigate(['/tickets', id]);
  }
}