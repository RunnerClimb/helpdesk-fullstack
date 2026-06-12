using HelpDesk.Application.DTOs;
using HelpDesk.Application.Interfaces;
using HelpDesk.Domain.Entities;
using HelpDesk.Domain.Enums;
using HelpDesk.Domain.Exceptions;
using HelpDesk.Domain.Rules;
using Microsoft.Extensions.Logging;

namespace HelpDesk.Application.Services;

public class TicketService
{
    private readonly ITicketRepository _repo;
    private readonly ILogger<TicketService> _logger;

    public TicketService(ITicketRepository repo, ILogger<TicketService> logger)
    {
        _repo = repo;
        _logger = logger;
    }

    public async Task<PagedResult<TicketSummaryDto>> GetTicketsAsync(
        TicketStatus? status, Priority? priority, string? q, int page, int pageSize)
    {
        var (items, total) = await _repo.GetPagedAsync(status, priority, q, page, pageSize);
        var dtos = items.Select(t => new TicketSummaryDto(
            t.Id, t.Title, t.Priority, t.Status,
            t.CreatedAt, t.CreatedBy.DisplayName,
            t.Comments.Count)).ToList();

        return new PagedResult<TicketSummaryDto>(dtos, total, page, pageSize);
    }

    public async Task<TicketDetailDto> GetByIdAsync(int id)
    {
        var ticket = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Ticket", id);

        return MapToDetail(ticket);
    }

    public async Task<TicketDetailDto> CreateAsync(CreateTicketDto dto, int userId)
    {
        var ticket = new Ticket
        {
            Title = dto.Title,
            Description = dto.Description,
            Priority = dto.Priority,
            Status = TicketStatus.Open,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedById = userId
        };

        var created = await _repo.CreateAsync(ticket);
        _logger.LogInformation("Ticket {Id} creado por usuario {UserId}", created.Id, userId);

        return await GetByIdAsync(created.Id);
    }

    public async Task<TicketDetailDto> UpdateAsync(int id, UpdateTicketDto dto)
    {
        var ticket = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Ticket", id);

        ticket.Title = dto.Title;
        ticket.Description = dto.Description;
        ticket.Priority = dto.Priority;

        await _repo.UpdateAsync(ticket);
        return await GetByIdAsync(id);
    }

    public async Task<TicketDetailDto> ChangeStatusAsync(int id, TicketStatus newStatus)
    {
        var ticket = await _repo.GetByIdAsync(id)
            ?? throw new NotFoundException("Ticket", id);

        if (!TicketStatusRules.IsValidTransition(ticket.Status, newStatus))
            throw new InvalidStatusTransitionException(ticket.Status.ToString(), newStatus.ToString());

        ticket.Status = newStatus;
        await _repo.UpdateAsync(ticket);

        _logger.LogInformation("Ticket {Id} cambió estado a {Status}", id, newStatus);
        return await GetByIdAsync(id);
    }

    public async Task<CommentDto> AddCommentAsync(int ticketId, CreateCommentDto dto, int userId)
    {
        var ticket = await _repo.GetByIdAsync(ticketId)
            ?? throw new NotFoundException("Ticket", ticketId);

        var comment = new Comment
        {
            TicketId = ticketId,
            Text = dto.Text,
            CreatedAt = DateTime.UtcNow,
            CreatedById = userId
        };

        var created = await _repo.AddCommentAsync(comment);
        return new CommentDto(created.Id, created.Text, created.CreatedAt, "Usuario");
    }

    public async Task<List<CommentDto>> GetCommentsAsync(int ticketId)
    {
        var ticket = await _repo.GetByIdAsync(ticketId)
            ?? throw new NotFoundException("Ticket", ticketId);

        var comments = await _repo.GetCommentsAsync(ticketId);
        return comments.Select(c =>
            new CommentDto(c.Id, c.Text, c.CreatedAt, c.CreatedBy.DisplayName)).ToList();
    }

    private static TicketDetailDto MapToDetail(Ticket t) => new(
        t.Id, t.Title, t.Description, t.Priority, t.Status,
        t.CreatedAt, t.UpdatedAt, t.CreatedBy.DisplayName,
        t.Comments.Select(c =>
            new CommentDto(c.Id, c.Text, c.CreatedAt, c.CreatedBy.DisplayName)).ToList());
}