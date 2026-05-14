// Author: Salaams
using System.Security.Cryptography;
using HMS.Application.BusinessRules;
using HMS.Application.DTOs.Auth;
using HMS.Application.Interfaces.Repositories;
using HMS.Application.Interfaces.Security;
using HMS.Application.Interfaces.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;

namespace HMS.Application.Services;

/// <summary>
/// Handles authentication and account management:
///   Login          — credential validation, account-lockout policy, password-expiry check, JWT issuance
///   Register        — guest self-registration with BCrypt hash and password-policy enforcement
///   ChangePassword  — validates current password, enforces policy, resets expiry clock
///   ForgotPassword  — generates a time-limited reset token (dev mode: returned in response)
///   ResetPassword   — validates token and sets new password
/// </summary>
public class AuthService : IAuthService
{
    private const int  MaxFailedAttempts    = 5;
    private const int  LockoutMinutes       = 15;
    private const int  PasswordExpiryDays   = 180; // 6 months — enforced for Admin + HotelManager
    private const int  ResetTokenExpiryHours = 1;

    private readonly IUserRepository              _users;
    private readonly IAuditLogRepository          _auditLogs;
    private readonly IPasswordHasher              _hasher;
    private readonly IJwtTokenService             _jwt;
    private readonly IPasswordResetTokenRepository _resetTokens;

    public AuthService(
        IUserRepository              users,
        IAuditLogRepository          auditLogs,
        IPasswordHasher              hasher,
        IJwtTokenService             jwt,
        IPasswordResetTokenRepository resetTokens)
    {
        _users       = users;
        _auditLogs   = auditLogs;
        _hasher      = hasher;
        _jwt         = jwt;
        _resetTokens = resetTokens;
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public async Task<LoginResponseDto> LoginAsync(LoginDto dto, string ipAddress)
    {
        var user = await _users.GetByEmailAsync(dto.Email)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("This account has been deactivated. Please contact an administrator.");

        // Auto-unlock after lockout window expires
        if (user.IsLocked && user.LockedUntil.HasValue && user.LockedUntil <= DateTime.UtcNow)
        {
            user.IsLocked            = false;
            user.FailedLoginAttempts = 0;
            await _users.UpdateAsync(user);
        }

        if (user.IsLocked)
        {
            await WriteAuditAsync(user.Id, "LockedAccountLoginAttempt", "User", user.Id.ToString(),
                $"Login blocked — account locked until {user.LockedUntil:u}.", ipAddress);
            throw new UnauthorizedAccessException(
                $"Account is locked. Try again after {user.LockedUntil:HH:mm 'UTC'}.");
        }

        if (!_hasher.Verify(dto.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;

            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.IsLocked   = true;
                user.LockedUntil = DateTime.UtcNow.AddMinutes(LockoutMinutes);
                await _users.UpdateAsync(user);
                await WriteAuditAsync(user.Id, "AccountLocked", "User", user.Id.ToString(),
                    $"Account locked after {MaxFailedAttempts} failed attempts.", ipAddress);
                throw new UnauthorizedAccessException(
                    $"Too many failed attempts. Account locked for {LockoutMinutes} minutes.");
            }

            await _users.UpdateAsync(user);
            await WriteAuditAsync(user.Id, "FailedLogin", "User", user.Id.ToString(),
                $"Failed login attempt {user.FailedLoginAttempts}/{MaxFailedAttempts}.", ipAddress);
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // Successful login — reset failure counter
        user.FailedLoginAttempts = 0;
        user.IsLocked            = false;
        await _users.UpdateAsync(user);

        var fullName = user switch
        {
            GuestUser g => $"{g.FirstName} {g.LastName}",
            StaffUser s => $"{s.FirstName} {s.LastName}",
            _           => user.Email,
        };

        var requiresPasswordChange =
            user.Role is UserRole.Admin or UserRole.HotelManager &&
            (DateTime.UtcNow - user.LastPasswordChange).TotalDays >= PasswordExpiryDays;

        var (token, expiresAt) = _jwt.GenerateToken(user.Id, user.Email, user.Role.ToString());

        await WriteAuditAsync(user.Id, "Login", "User", user.Id.ToString(), "Successful login.", ipAddress);

        return new LoginResponseDto
        {
            Token                  = token,
            ExpiresAt              = expiresAt,
            UserId                 = user.Id,
            Role                   = user.Role.ToString(),
            FullName               = fullName,
            Email                  = user.Email,
            RequiresPasswordChange = requiresPasswordChange,
        };
    }

    // ── Register (Guest self-registration) ────────────────────────────────────

    public async Task<LoginResponseDto> RegisterGuestAsync(RegisterGuestDto dto, string ipAddress)
    {
        PasswordPolicy.Validate(dto.Password);

        var existing = await _users.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("An account with this email already exists.");

        var guest = new GuestUser
        {
            Email              = dto.Email.ToLowerInvariant(),
            PasswordHash       = _hasher.Hash(dto.Password),
            Role               = UserRole.Guest,
            FirstName          = dto.FirstName,
            LastName           = dto.LastName,
            Phone              = dto.Phone,
            Address            = dto.Address,
            LastPasswordChange = DateTime.UtcNow,
            CreatedAt          = DateTime.UtcNow,
        };

        await _users.AddAsync(guest);
        await WriteAuditAsync(guest.Id, "Register", "User", guest.Id.ToString(),
            $"New guest account registered: {guest.Email}.", ipAddress);

        var (token, expiresAt) = _jwt.GenerateToken(guest.Id, guest.Email, guest.Role.ToString());

        return new LoginResponseDto
        {
            Token    = token,
            ExpiresAt = expiresAt,
            UserId   = guest.Id,
            Role     = guest.Role.ToString(),
            FullName = $"{guest.FirstName} {guest.LastName}",
            Email    = guest.Email,
        };
    }

    // ── Change Password ───────────────────────────────────────────────────────

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto dto, string ipAddress)
    {
        var user = await _users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        if (!_hasher.Verify(dto.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Current password is incorrect.");

        PasswordPolicy.Validate(dto.NewPassword);

        if (_hasher.Verify(dto.NewPassword, user.PasswordHash))
            throw new InvalidOperationException("New password must be different from the current password.");

        user.PasswordHash       = _hasher.Hash(dto.NewPassword);
        user.LastPasswordChange = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        await WriteAuditAsync(userId, "ChangePassword", "User", userId.ToString(),
            "Password changed successfully.", ipAddress);
    }

    // ── Forgot Password ───────────────────────────────────────────────────────

    public async Task<ForgotPasswordResponseDto> ForgotPasswordAsync(
        ForgotPasswordDto dto, string ipAddress)
    {
        var user = await _users.GetByEmailAsync(dto.Email);

        // Silently succeed even if email not found — prevents user enumeration
        if (user is null)
        {
            return new ForgotPasswordResponseDto
            {
                Message    = "If an account exists for that email, a reset token has been issued.",
                ResetToken = string.Empty,
            };
        }

        // Invalidate any existing active tokens for this user
        var existing = await _resetTokens.GetActiveByUserIdAsync(user.Id);
        foreach (var old in existing)
        {
            old.IsUsed = true;
            await _resetTokens.UpdateAsync(old);
        }

        // Generate a URL-safe random secret (256-bit entropy)
        var secret = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                            .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        // Encode userId into the token so the backend can look up the right user's tokens
        // without a full-table scan.  Format: "{userId}.{secret}"
        var plainToken = $"{user.Id}.{secret}";

        var record = new PasswordResetToken
        {
            UserId    = user.Id,
            TokenHash = _hasher.Hash(secret),   // only hash the secret part
            ExpiresAt = DateTime.UtcNow.AddHours(ResetTokenExpiryHours),
            IsUsed    = false,
            CreatedAt = DateTime.UtcNow,
        };

        await _resetTokens.AddAsync(record);
        await WriteAuditAsync(user.Id, "ForgotPassword", "User", user.Id.ToString(),
            "Password reset token generated.", ipAddress);

        return new ForgotPasswordResponseDto
        {
            Message    = "Reset token generated. Copy the token into the reset-password form.",
            ResetToken = plainToken,  // dev/demo mode — in production this would be e-mailed
        };
    }

    // ── Reset Password ────────────────────────────────────────────────────────

    public async Task ResetPasswordAsync(ResetPasswordDto dto, string ipAddress)
    {
        if (string.IsNullOrWhiteSpace(dto.Token))
            throw new InvalidOperationException("Reset token is required.");

        // Token format: "{userId}.{secret}"
        var parts = dto.Token.Split('.', 2);
        if (parts.Length != 2 || !int.TryParse(parts[0], out var userId))
            throw new InvalidOperationException("Reset token is invalid or has expired.");

        var secret = parts[1];

        var activeTokens = await _resetTokens.GetActiveByUserIdAsync(userId);
        var record = activeTokens.FirstOrDefault(t => _hasher.Verify(secret, t.TokenHash));

        if (record is null)
            throw new InvalidOperationException("Reset token is invalid or has expired.");

        var user = await _users.GetByIdAsync(userId)
            ?? throw new KeyNotFoundException($"User {userId} not found.");

        PasswordPolicy.Validate(dto.NewPassword);

        if (_hasher.Verify(dto.NewPassword, user.PasswordHash))
            throw new InvalidOperationException("New password must be different from the current password.");

        user.PasswordHash       = _hasher.Hash(dto.NewPassword);
        user.LastPasswordChange = DateTime.UtcNow;
        await _users.UpdateAsync(user);

        record.IsUsed = true;
        await _resetTokens.UpdateAsync(record);

        await WriteAuditAsync(userId, "ResetPassword", "User", userId.ToString(),
            "Password reset via token.", ipAddress);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Task WriteAuditAsync(int? userId, string action, string entityType,
        string entityId, string details, string ipAddress) =>
        _auditLogs.AddAsync(new AuditLog
        {
            UserId     = userId,
            Action     = action,
            EntityType = entityType,
            EntityId   = entityId,
            Details    = details,
            IpAddress  = ipAddress,
            Timestamp  = DateTime.UtcNow,
        });
}
