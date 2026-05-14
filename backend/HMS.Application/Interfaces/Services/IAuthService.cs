// Author: Salaams
using HMS.Application.DTOs.Auth;

namespace HMS.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginDto dto, string ipAddress);
    Task<LoginResponseDto> RegisterGuestAsync(RegisterGuestDto dto, string ipAddress);
    Task ChangePasswordAsync(int userId, ChangePasswordDto dto, string ipAddress);
    /// <summary>
    /// Generates a password-reset token for the given email.
    /// If the email is not found the response is still returned (prevents user enumeration).
    /// In dev/demo mode the plain token is included in the response body.
    /// </summary>
    Task<ForgotPasswordResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto, string ipAddress);
    /// <summary>Validates the reset token and replaces the user's password.</summary>
    Task ResetPasswordAsync(ResetPasswordDto dto, string ipAddress);
}
