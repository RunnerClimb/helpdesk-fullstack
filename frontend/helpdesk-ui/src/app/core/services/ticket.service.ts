import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TicketSummary, TicketDetail, Comment,
  PagedResult, CreateTicketRequest,
  UpdateTicketRequest, TicketFilters, TicketStatus
} from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5274/api/tickets';

  getTickets(filters: TicketFilters): Observable<PagedResult<TicketSummary>> {
    let params = new HttpParams()
      .set('page', filters.page)
      .set('pageSize', filters.pageSize);

    if (filters.status != null) params = params.set('status', filters.status);
    if (filters.priority != null) params = params.set('priority', filters.priority);
    if (filters.q?.trim()) params = params.set('q', filters.q.trim());

    return this.http.get<PagedResult<TicketSummary>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<TicketDetail> {
    return this.http.get<TicketDetail>(`${this.baseUrl}/${id}`);
  }

  create(data: CreateTicketRequest): Observable<TicketDetail> {
    return this.http.post<TicketDetail>(this.baseUrl, data);
  }

  update(id: number, data: UpdateTicketRequest): Observable<TicketDetail> {
    return this.http.put<TicketDetail>(`${this.baseUrl}/${id}`, data);
  }

  changeStatus(id: number, status: TicketStatus): Observable<TicketDetail> {
    return this.http.patch<TicketDetail>(`${this.baseUrl}/${id}/status`, { status });
  }

  getComments(ticketId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.baseUrl}/${ticketId}/comments`);
  }

  addComment(ticketId: number, text: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.baseUrl}/${ticketId}/comments`, { text });
  }
}