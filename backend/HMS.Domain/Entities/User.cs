// Author: Salaams
using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

public abstract class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int FailedLoginAttempts { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LockedUntil { get; set; }
    public DateTime LastPasswordChange { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    /// <summary>Soft-deactivation flag. Deactivated accounts cannot log in.</summary>
    public bool IsActive { get; set; } = true;

    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
}
