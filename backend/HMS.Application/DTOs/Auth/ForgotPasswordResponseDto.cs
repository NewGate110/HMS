// Author: Salaams
namespace HMS.Application.DTOs.Auth;

/// <summary>
/// Returned only in development / demo mode.
/// In production this would be omitted and the token would be e-mailed to the user.
/// </summary>
public class ForgotPasswordResponseDto
{
    public string Message    { get; set; } = string.Empty;
    /// <summary>Plain reset token — copy this into the reset-password form's ?token= parameter.</summary>
    public string ResetToken { get; set; } = string.Empty;
}
