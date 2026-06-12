using HelpDesk.Application.DTOs;
using HelpDesk.Application.Services;
using HelpDesk.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace HelpDesk.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TicketsController : ControllerBase
{
    private readonly TicketService _service;

    public TicketsController(TicketService service) => _service = service;

    private int CurrentUserId =>
        int.TryParse(Request.Headers["X-User"].FirstOrDefault(), out var id) ? id : 1;

    /// <summary>Obtiene listado paginado de tickets con filtros opcionales.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<TicketSummaryDto>), 200)]
    public async Task<IActionResult> GetAll(
        [FromQuery] TicketStatus? status,
        [FromQuery] Priority? priority,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _service.GetTicketsAsync(status, priority, q, page, pageSize);
        return Ok(result);
    }

    /// <summary>Obtiene un ticket por ID con sus comentarios.</summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(TicketDetailDto), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetById(int id)
        => Ok(await _service.GetByIdAsync(id));

    /// <summary>Crea un nuevo ticket.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(TicketDetailDto), 201)]
    [ProducesResponseType(400)]
    public async Task<IActionResult> Create([FromBody] CreateTicketDto dto)
    {
        var result = await _service.CreateAsync(dto, CurrentUserId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Actualiza los campos principales de un ticket.</summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(TicketDetailDto), 200)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTicketDto dto)
        => Ok(await _service.UpdateAsync(id, dto));

    /// <summary>Cambia el estado de un ticket.</summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(TicketDetailDto), 200)]
    [ProducesResponseType(404)]
    [ProducesResponseType(409)]
    public async Task<IActionResult> PatchStatus(int id, [FromBody] PatchStatusDto dto)
        => Ok(await _service.ChangeStatusAsync(id, dto.Status));

    /// <summary>Agrega un comentario a un ticket.</summary>
    [HttpPost("{id}/comments")]
    [ProducesResponseType(typeof(CommentDto), 201)]
    [ProducesResponseType(400)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
    {
        var comment = await _service.AddCommentAsync(id, dto, CurrentUserId);
        return Created($"/api/tickets/{id}/comments", comment);
    }

    /// <summary>Obtiene los comentarios de un ticket.</summary>
    [HttpGet("{id}/comments")]
    [ProducesResponseType(typeof(List<CommentDto>), 200)]
    [ProducesResponseType(404)]
    public async Task<IActionResult> GetComments(int id)
        => Ok(await _service.GetCommentsAsync(id));
}