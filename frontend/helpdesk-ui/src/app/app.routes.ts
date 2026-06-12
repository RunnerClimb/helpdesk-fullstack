import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tickets', pathMatch: 'full' },
  {
    path: 'tickets',
    loadComponent: () =>
      import('./features/tickets/ticket-list/ticket-list.component')
        .then(m => m.TicketListComponent)
  },
  {
    path: 'tickets/new',
    loadComponent: () =>
      import('./features/tickets/ticket-form/ticket-form.component')
        .then(m => m.TicketFormComponent)
  },
  {
    path: 'tickets/:id',
    loadComponent: () =>
      import('./features/tickets/ticket-detail/ticket-detail.component')
        .then(m => m.TicketDetailComponent)
  },
  {
    path: 'tickets/:id/edit',
    loadComponent: () =>
      import('./features/tickets/ticket-form/ticket-form.component')
        .then(m => m.TicketFormComponent)
  },
  { path: '**', redirectTo: 'tickets' }
];