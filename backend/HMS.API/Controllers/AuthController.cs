// Author: Salaams
using System.Security.Claims;
using HMS.Application.DTOs.Auth;
using HMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    // ── Cookie helper ──────────────────────────────────────────────────────────

    private static CookieOptions AuthCookieOptions(DateTime expiresAt) => new()
    {
        HttpOnly = true,
        Secure   = true,
        SameSite = SameSiteMode.Strict,
        Expires  = new DateTimeOffset(expiresAt, TimeSpan.Zero),
    };

    // ── Endpoints ──────────────────────────────────────────────────────────────

    /// <summary>Authenticates a user, sets an HttpOnly auth cookie, and returns session metadata.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)
    {
        try
        {
            var ip       = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var response = await _authService.LoginAsync(dto, ip);
            Response.Cookies.Append("hms.auth", response.Token, AuthCookieOptions(response.ExpiresAt));
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(ex.Message); }
    }

    /// <summary>Registers a new guest account, sets an HttpOnly auth cookie, and returns session metadata.</summary>
    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<LoginResponseDto>> Register([FromBody] RegisterGuestDto dto)
    {
        try
        {
            var ip       = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var response = await _authService.RegisterGuestAsync(dto, ip);
            Response.Cookies.Append("hms.auth", response.Token, AuthCookieOptions(response.ExpiresAt));
            return CreatedAtAction(null, response);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
        {
            return Conflict(ex.Message);
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    /// <summary>Clears the auth cookie and ends the session.</summary>
    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("hms.auth");
        return NoContent();
    }

    /// <summary>
    /// Generates a password-reset token for the supplied email.
    /// In dev/demo mode the plain token is returned in the response body.
    /// In production it would be e-mailed and the response would be empty.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ForgotPasswordResponseDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ForgotPasswordResponseDto>> ForgotPassword(
        [FromBody] ForgotPasswordDto dto)
    {
        var ip       = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var response = await _authService.ForgotPasswordAsync(dto, ip);
        return Ok(response);
    }

    /// <summary>Validates the reset token and sets a new password.</summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            await _authService.ResetPasswordAsync(dto, ip);
            return NoContent();
        }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex)      { return BadRequest(ex.Message); }
    }

    /// <summary>Changes the authenticated user's password.</summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userIdClaim = User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return Unauthorized("Invalid token — user ID claim missing.");

        try
        {
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            await _authService.ChangePasswordAsync(userId, dto, ip);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex) { return Unauthorized(ex.Message); }
        catch (InvalidOperationException ex)   { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex)        { return NotFound(ex.Message); }
    }
}
