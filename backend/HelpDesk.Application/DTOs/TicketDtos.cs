using HelpDesk.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace HelpDesk.Application.DTOs;

public record TicketSummaryDto(
    int Id, string Title, Priority Priority,
    TicketStatus Status, DateTime CreatedAt,
    string CreatedBy, int CommentsCount);

public record TicketDetailDto(
    int Id, string Title, string Description,
    Priority Priority, TicketStatus Status,
    DateTime CreatedAt, DateTime UpdatedAt,
    string CreatedBy, List<CommentDto> Comments);

public record CreateTicketDto(
    [Required][StringLength(120, MinimumLength = 5)] string Title,
    [Required][StringLength(2000, MinimumLength = 10)] string Description,
    Priority Priority);

public record UpdateTicketDto(
    [Required][StringLength(120, MinimumLength = 5)] string Title,
    [Required][StringLength(2000, MinimumLength = 10)] string Description,
    Priority Priority);

public record PatchStatusDto([Required] TicketStatus Status);

public record CommentDto(int Id, string Text, DateTime CreatedAt, string CreatedBy);

public record CreateCommentDto(
    [Required][StringLength(1000, MinimumLength = 2)] string Text);

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);