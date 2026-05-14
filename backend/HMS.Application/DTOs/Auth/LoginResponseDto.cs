// Author: Salaams
namespace HMS.Application.DTOs.Auth;

public class LoginResponseDto
{
    /// <summary>
    /// JWT is also delivered as an HttpOnly cookie (hms.auth).
    /// This field is retained for Swagger / API-testing convenience only.
    /// </summary>
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    /// <summary>Returned in the body so the Angular client does not need to decode the JWT.</summary>
    public string Email { get; set; } = string.Empty;
    public bool RequiresPasswordChange { get; set; }
}
