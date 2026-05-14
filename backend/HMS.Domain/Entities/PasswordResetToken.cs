// Author: Salaams
namespace HMS.Domain.Entities;

/// <summary>
/// A time-limited, single-use token that allows a user to reset their password
/// without knowing their current password.  The plain token is sent to the user
/// (dev mode: returned in the API response); only its BCrypt hash is stored here.
/// </summary>
public class PasswordResetToken
{
    public int      Id         { get; set; }
    public int      UserId     { get; set; }
    /// <summary>BCrypt hash of the plain token. Never store the plain value.</summary>
    public string   TokenHash  { get; set; } = string.Empty;
    public DateTime ExpiresAt  { get; set; }
    public bool     IsUsed     { get; set; }
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}
