// Author: Salaams
namespace HMS.Application.DTOs.AuditLogs;

public record AuditLogDto(
    int Id,
    string? ActorEmail,
    string Action,
    string EntityType,
    string EntityId,
    string Details,
    DateTime Timestamp);
