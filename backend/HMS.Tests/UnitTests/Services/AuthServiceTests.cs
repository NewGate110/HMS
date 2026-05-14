// Author: Salaams
using HMS.Application.DTOs.Auth;
using HMS.Application.Interfaces.Repositories;
using HMS.Application.Interfaces.Security;
using HMS.Application.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using Moq;

namespace HMS.Tests.UnitTests.Services;

public class AuthServiceTests
{
    // ── Mocks ─────────────────────────────────────────────────────────────────

    private readonly Mock<IUserRepository>     _userRepo  = new();
    private readonly Mock<IAuditLogRepository> _auditRepo = new();
    private readonly Mock<IPasswordHasher>     _hasher    = new();
    private readonly Mock<IJwtTokenService>    _jwt       = new();

    private AuthService BuildSut() => new(
        _userRepo.Object,
        _auditRepo.Object,
        _hasher.Object,
        _jwt.Object);

    private void SetupJwt() =>
        _jwt.Setup(j => j.GenerateToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(("token_abc", DateTime.UtcNow.AddHours(1)));

    private void SetupAudit() =>
        _auditRepo.Setup(a => a.AddAsync(It.IsAny<AuditLog>()))
                  .Returns(Task.CompletedTask);

    private GuestUser MakeGuest(string email = "guest@test.com") => new()
    {
        Id                 = 1,
        Email              = email,
        PasswordHash       = "hashed",
        Role               = UserRole.Guest,
        FirstName          = "Test",
        LastName           = "Guest",
        IsLocked           = false,
        FailedLoginAttempts = 0,
        LastPasswordChange = DateTime.UtcNow,
    };

    // ── LoginAsync ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Login_UnknownEmail_ThrowsUnauthorized()
    {
        var sut = BuildSut();
        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                 .ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync(new LoginDto { Email = "no@one.com", Password = "x" }, "127.0.0.1"));
    }

    [Fact]
    public async Task Login_AccountLocked_ThrowsUnauthorized()
    {
        var sut = BuildSut();
        SetupAudit();

        var user = MakeGuest();
        user.IsLocked    = true;
        user.LockedUntil = DateTime.UtcNow.AddMinutes(10); // still locked

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                 .ReturnsAsync(user);

        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync(new LoginDto { Email = user.Email, Password = "any" }, "127.0.0.1"));

        Assert.Contains("locked", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_LockoutExpired_AutoUnlocksAndProceedsToPasswordCheck()
    {
        var sut = BuildSut();
        SetupAudit();

        var user = MakeGuest();
        user.IsLocked            = true;
        user.LockedUntil         = DateTime.UtcNow.AddMinutes(-5); // expired
        user.FailedLoginAttempts = 5;

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);

        // Password will be wrong — but the lock should auto-clear first
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        // Should throw wrong password, NOT locked account
        var ex = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync(new LoginDto { Email = user.Email, Password = "wrong" }, "127.0.0.1"));

        Assert.DoesNotContain("locked", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.False(user.IsLocked);
    }

    [Fact]
    public async Task Login_WrongPassword_IncrementsFailedAttempts()
    {
        var sut = BuildSut();
        SetupAudit();

        var user = MakeGuest();
        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync(new LoginDto { Email = user.Email, Password = "wrong" }, "127.0.0.1"));

        Assert.Equal(1, user.FailedLoginAttempts);
    }

    [Fact]
    public async Task Login_FifthFailedAttempt_LocksAccount()
    {
        var sut = BuildSut();
        SetupAudit();

        var user = MakeGuest();
        user.FailedLoginAttempts = 4; // one more triggers lock

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.LoginAsync(new LoginDto { Email = user.Email, Password = "wrong" }, "127.0.0.1"));

        Assert.True(user.IsLocked);
        Assert.NotNull(user.LockedUntil);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        var sut = BuildSut();
        SetupAudit();
        SetupJwt();

        var user = MakeGuest();
        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        var result = await sut.LoginAsync(
            new LoginDto { Email = user.Email, Password = "correct" }, "127.0.0.1");

        Assert.Equal("token_abc", result.Token);
        Assert.Equal("Test Guest", result.FullName);
        Assert.Equal(0, user.FailedLoginAttempts);
    }

    [Fact]
    public async Task Login_AdminPasswordExpired_SetsRequiresPasswordChangeTrue()
    {
        var sut = BuildSut();
        SetupAudit();
        SetupJwt();

        var admin = new StaffUser
        {
            Id                 = 2,
            Email              = "admin@test.com",
            PasswordHash       = "hash",
            Role               = UserRole.Admin,
            FirstName          = "Admin",
            LastName           = "User",
            LastPasswordChange = DateTime.UtcNow.AddDays(-181), // expired
        };

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(admin);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        var result = await sut.LoginAsync(
            new LoginDto { Email = admin.Email, Password = "correct" }, "127.0.0.1");

        Assert.True(result.RequiresPasswordChange);
    }

    [Fact]
    public async Task Login_GuestPasswordExpired_DoesNotSetRequiresPasswordChange()
    {
        var sut = BuildSut();
        SetupAudit();
        SetupJwt();

        var user = MakeGuest();
        user.LastPasswordChange = DateTime.UtcNow.AddDays(-181); // expired, but guest — not enforced

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync(user);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);

        var result = await sut.LoginAsync(
            new LoginDto { Email = user.Email, Password = "correct" }, "127.0.0.1");

        Assert.False(result.RequiresPasswordChange);
    }

    // ── RegisterGuestAsync ────────────────────────────────────────────────────

    [Fact]
    public async Task Register_DuplicateEmail_Throws()
    {
        var sut = BuildSut();

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                 .ReturnsAsync(MakeGuest()); // existing user

        var dto = new RegisterGuestDto
        {
            Email     = "existing@test.com",
            Password  = "Secure#1",
            FirstName = "Jane",
            LastName  = "Doe",
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.RegisterGuestAsync(dto, "127.0.0.1"));
    }

    [Fact]
    public async Task Register_WeakPassword_ThrowsBeforeEmailCheck()
    {
        var sut = BuildSut();

        var dto = new RegisterGuestDto
        {
            Email     = "new@test.com",
            Password  = "weak", // fails PasswordPolicy
            FirstName = "Jane",
            LastName  = "Doe",
        };

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.RegisterGuestAsync(dto, "127.0.0.1"));
    }

    [Fact]
    public async Task Register_ValidData_CreatesGuestAndReturnsToken()
    {
        var sut = BuildSut();
        SetupAudit();
        SetupJwt();

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>()))
                 .ReturnsAsync((User?)null); // no existing user
        _userRepo.Setup(r => r.AddAsync(It.IsAny<GuestUser>()))
                 .Returns(Task.CompletedTask);
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed_pw");

        var dto = new RegisterGuestDto
        {
            Email     = "newuser@test.com",
            Password  = "Secure#1",
            FirstName = "Jane",
            LastName  = "Doe",
        };

        var result = await sut.RegisterGuestAsync(dto, "127.0.0.1");

        Assert.Equal("token_abc", result.Token);
        Assert.Equal("Jane Doe", result.FullName);
        _userRepo.Verify(r => r.AddAsync(It.IsAny<GuestUser>()), Times.Once);
    }

    [Fact]
    public async Task Register_ValidData_WritesAuditLog()
    {
        var sut = BuildSut();
        SetupJwt();

        _userRepo.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userRepo.Setup(r => r.AddAsync(It.IsAny<GuestUser>())).Returns(Task.CompletedTask);
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed");

        AuditLog? log = null;
        _auditRepo.Setup(a => a.AddAsync(It.IsAny<AuditLog>()))
                  .Callback<AuditLog>(l => log = l)
                  .Returns(Task.CompletedTask);

        var dto = new RegisterGuestDto
        {
            Email     = "newuser@test.com",
            Password  = "Secure#1",
            FirstName = "Jane",
            LastName  = "Doe",
        };

        await sut.RegisterGuestAsync(dto, "127.0.0.1");

        Assert.NotNull(log);
        Assert.Equal("Register", log!.Action);
    }

    // ── ChangePasswordAsync ───────────────────────────────────────────────────

    [Fact]
    public async Task ChangePassword_WrongCurrentPassword_ThrowsUnauthorized()
    {
        var sut = BuildSut();

        var user = MakeGuest();
        _userRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(user);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(false);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => sut.ChangePasswordAsync(1, new ChangePasswordDto
            {
                CurrentPassword = "wrong",
                NewPassword     = "NewSecure#1",
            }, "127.0.0.1"));
    }

    [Fact]
    public async Task ChangePassword_SameAsCurrentPassword_Throws()
    {
        var sut = BuildSut();

        var user = MakeGuest();
        _userRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(user);

        // First call (verify current) → true; second call (verify new == current) → true
        _hasher.SetupSequence(h => h.Verify(It.IsAny<string>(), It.IsAny<string>()))
               .Returns(true)   // current password correct
               .Returns(true);  // new password same as current

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => sut.ChangePasswordAsync(1, new ChangePasswordDto
            {
                CurrentPassword = "Secure#1",
                NewPassword     = "Secure#1", // same
            }, "127.0.0.1"));
    }

    [Fact]
    public async Task ChangePassword_ValidChange_UpdatesHashAndTimestamp()
    {
        var sut = BuildSut();
        SetupAudit();

        var user = MakeGuest();
        var originalChange = user.LastPasswordChange;

        _userRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(user);
        _userRepo.Setup(r => r.UpdateAsync(It.IsAny<User>())).Returns(Task.CompletedTask);
        _hasher.SetupSequence(h => h.Verify(It.IsAny<string>(), It.IsAny<string>()))
               .Returns(true)   // current correct
               .Returns(false); // new is different
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("new_hash");

        await sut.ChangePasswordAsync(1, new ChangePasswordDto
        {
            CurrentPassword = "Secure#1",
            NewPassword     = "NewSecure#2!",
        }, "127.0.0.1");

        Assert.Equal("new_hash", user.PasswordHash);
        Assert.True(user.LastPasswordChange >= originalChange);
    }
}
