using HelpDesk.Application.Interfaces;
using HelpDesk.Domain.Entities;
using HelpDesk.Domain.Enums;
using HelpDesk.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Infrastructure.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly AppDbContext _ctx;
    public TicketRepository(AppDbContext ctx) => _ctx = ctx;

    public async Task<(List<Ticket> Items, int Total)> GetPagedAsync(
        TicketStatus? status, Priority? priority, string? q,
        int page, int pageSize)
    {
        var query = _ctx.Tickets
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments)
            .AsQueryable();

        if (status.HasValue) query = query.Where(t => t.Status == status);
        if (priority.HasValue) query = query.Where(t => t.Priority == priority);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(t => t.Title.Contains(q) || t.Description.Contains(q));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Ticket?> GetByIdAsync(int id)
        => await _ctx.Tickets
            .Include(t => t.CreatedBy)
            .Include(t => t.Comments).ThenInclude(c => c.CreatedBy)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Ticket> CreateAsync(Ticket ticket)
    {
        _ctx.Tickets.Add(ticket);
        await _ctx.SaveChangesAsync();
        return ticket;
    }

    public async Task UpdateAsync(Ticket ticket)
    {
        ticket.UpdatedAt = DateTime.UtcNow;
        _ctx.Tickets.Update(ticket);
        await _ctx.SaveChangesAsync();
    }

    public async Task<Comment> AddCommentAsync(Comment comment)
    {
        _ctx.Comments.Add(comment);
        await _ctx.SaveChangesAsync();
        return comment;
    }

    public async Task<List<Comment>> GetCommentsAsync(int ticketId)
        => await _ctx.Comments
            .Include(c => c.CreatedBy)
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();
}