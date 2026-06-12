using HelpDesk.Domain.Entities;
using HelpDesk.Domain.Enums;

namespace HelpDesk.Application.Interfaces;

public interface ITicketRepository
{
    Task<(List<Ticket> Items, int Total)> GetPagedAsync(
        TicketStatus? status, Priority? priority, string? q, int page, int pageSize);
    Task<Ticket?> GetByIdAsync(int id);
    Task<Ticket> CreateAsync(Ticket ticket);
    Task UpdateAsync(Ticket ticket);
    Task<Comment> AddCommentAsync(Comment comment);
    Task<List<Comment>> GetCommentsAsync(int ticketId);
}