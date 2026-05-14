// Author: Salaams
using HMS.Application.Interfaces.Repositories;
using HMS.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace HMS.API.Controllers;

public class ContactMessageDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Subject { get; set; } = string.Empty;

    [Required, MaxLength(5000)]
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Accepts contact form submissions from anonymous and authenticated visitors.
/// Persists each submission as an AuditLog entry for admin review.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ContactController : ControllerBase
{
    private readonly IAuditLogRepository _auditLogs;

    public ContactController(IAuditLogRepository auditLogs)
    {
        _auditLogs = auditLogs;
    }

    /// <summary>Submits a contact-form enquiry. Available to all visitors.</summary>
    [HttpPost]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Submit([FromBody] ContactMessageDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        await _auditLogs.AddAsync(new AuditLog
        {
            Action     = "ContactFormSubmission",
            EntityType = "Contact",
            EntityId   = dto.Email,
            Details    = $"Name: {dto.Name} | Subject: {dto.Subject} | Message: {dto.Message[..Math.Min(500, dto.Message.Length)]}",
            IpAddress  = ip,
            Timestamp  = DateTime.UtcNow,
        });

        return Ok(new { message = "Your enquiry has been received. Our team will be in touch shortly." });
    }
}
