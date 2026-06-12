 export enum Priority {
  Low = 0,
  Medium = 1,
  High = 2,
  Critical = 3
}

export enum TicketStatus {
  Open = 0,
  InProgress = 1,
  Resolved = 2,
  Closed = 3
}

export interface User {
  id: number;
  email: string;
  displayName: string;
}

export interface TicketSummary {
  id: number;
  title: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  createdBy: string;
  commentsCount: number;
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  createdBy: string;
}

export interface TicketDetail {
  id: number;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  comments: Comment[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: Priority;
}

export interface UpdateTicketRequest {
  title: string;
  description: string;
  priority: Priority;
}

export interface TicketFilters {
  status?: TicketStatus | null;
  priority?: Priority | null;
  q?: string;
  page: number;
  pageSize: number;
}