// Author: Salaams
using AutoMapper;
using HMS.Application.BusinessRules;
using HMS.Application.DTOs.Bookings;
using HMS.Application.DTOs.Users;
using HMS.Application.Interfaces.Repositories;
using HMS.Application.Interfaces.Security;
using HMS.Application.Interfaces.Services;
using HMS.Domain.Entities;
using HMS.Domain.Enums;

namespace HMS.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository    _users;
    private readonly IBookingRepository _bookings;
    private readonly IPasswordHasher    _hasher;
    private readonly IMapper            _mapper;

    public UserService(
        IUserRepository    users,
        IBookingRepository bookings,
        IPasswordHasher    hasher,
        IMapper            mapper)
    {
        _users    = users;
        _bookings = bookings;
        _hasher   = hasher;
        _mapper   = mapper;
    }

    // ── Guest ─────────────────────────────────────────────────────────────────

    public async Task<GuestUserDto?> GetGuestByIdAsync(int id)
    {
        var guest = await _users.GetGuestByIdAsync(id);
        return guest is null ? null : _mapper.Map<GuestUserDto>(guest);
    }

    public async Task<GuestStatsDto> GetGuestStatsAsync(int id)
    {
        var bookings = await _bookings.GetByGuestIdAsync(id);
        var checkedOut = bookings.Where(b => b.Status == BookingStatus.CheckedOut).ToList();
        var totalStays = checkedOut.Count;
        var totalSpend = checkedOut.Sum(b => b.TotalAmount);
        var tier = totalStays >= 10 ? "Gold" : totalStays >= 3 ? "Silver" : "Bronze";
        return new GuestStatsDto { TotalStays = totalStays, TotalSpend = totalSpend, Tier = tier };
    }

    public async Task<GuestUserDto> UpdateGuestProfileAsync(int guestId, UpdateGuestProfileDto dto)
    {
        var guest = await _users.GetGuestByIdAsync(guestId)
            ?? throw new KeyNotFoundException($"Guest {guestId} not found.");

        guest.FirstName = dto.FirstName;
        guest.LastName  = dto.LastName;
        guest.Phone     = dto.Phone;
        guest.Address   = dto.Address;

        await _users.UpdateAsync(guest);
        return _mapper.Map<GuestUserDto>(guest);
    }

    public async Task<IEnumerable<BookingDto>> GetGuestBookingsAsync(int guestId)
    {
        var bookings = await _bookings.GetByGuestIdAsync(guestId);
        return _mapper.Map<IEnumerable<BookingDto>>(bookings);
    }

    public async Task<IEnumerable<GuestListDto>> GetAllGuestsAsync()
    {
        var guests   = await _users.GetAllGuestsAsync();
        var allBooks = await _bookings.GetAllAsync();
        var countMap = allBooks.GroupBy(b => b.GuestId)
                               .ToDictionary(g => g.Key, g => g.Count());
        return guests.Select(g => new GuestListDto
        {
            Id            = g.Id,
            FullName      = $"{g.FirstName} {g.LastName}",
            Email         = g.Email,
            Phone         = g.Phone ?? string.Empty,
            TotalBookings = countMap.TryGetValue(g.Id, out var c) ? c : 0,
            IsLocked      = g.IsLocked,
            IsActive      = g.IsActive,
            CreatedAt     = g.CreatedAt,
        });
    }

    public async Task<IEnumerable<GuestListDto>> SearchGuestsAsync(string term)
    {
        var guests = await _users.SearchGuestsAsync(term);
        return guests.Select(g => new GuestListDto
        {
            Id        = g.Id,
            FullName  = $"{g.FirstName} {g.LastName}",
            Email     = g.Email,
            Phone     = g.Phone ?? string.Empty,
            IsLocked  = g.IsLocked,
            IsActive  = g.IsActive,
            CreatedAt = g.CreatedAt,
        });
    }

    // ── Staff ─────────────────────────────────────────────────────────────────

    public async Task<IEnumerable<StaffUserDto>> GetAllStaffAsync()
    {
        var staff = await _users.GetAllStaffAsync();
        return _mapper.Map<IEnumerable<StaffUserDto>>(staff);
    }

    public async Task<StaffUserDto?> GetStaffByIdAsync(int id)
    {
        var staff = await _users.GetStaffByIdAsync(id);
        return staff is null ? null : _mapper.Map<StaffUserDto>(staff);
    }

    public async Task<StaffUserDto> CreateStaffAsync(CreateStaffDto dto)
    {
        // Validate role
        if (!Enum.TryParse<UserRole>(dto.Role, out var role) ||
            role is not (UserRole.FrontDeskStaff or UserRole.HotelManager))
            throw new InvalidOperationException("Role must be 'FrontDeskStaff' or 'HotelManager'.");

        // Check email uniqueness
        var existing = await _users.GetByEmailAsync(dto.Email.ToLowerInvariant());
        if (existing is not null)
            throw new InvalidOperationException("An account with this email already exists.");

        PasswordPolicy.Validate(dto.Password);

        var staff = new StaffUser
        {
            Email              = dto.Email.ToLowerInvariant(),
            PasswordHash       = _hasher.Hash(dto.Password),
            Role               = role,
            FirstName          = dto.FirstName,
            LastName           = dto.LastName,
            EmployeeId         = dto.EmployeeId,
            Department         = dto.Department,
            LastPasswordChange = DateTime.UtcNow,
            CreatedAt          = DateTime.UtcNow,
            IsActive           = true,
        };

        await _users.AddStaffAsync(staff);
        return _mapper.Map<StaffUserDto>(staff);
    }

    public async Task<StaffUserDto> UpdateStaffAsync(int id, UpdateStaffDto dto)
    {
        var staff = await _users.GetStaffByIdAsync(id)
            ?? throw new KeyNotFoundException($"Staff member {id} not found.");

        if (!Enum.TryParse<UserRole>(dto.Role, out var role) ||
            role is not (UserRole.FrontDeskStaff or UserRole.HotelManager))
            throw new InvalidOperationException("Role must be 'FrontDeskStaff' or 'HotelManager'.");

        staff.FirstName  = dto.FirstName;
        staff.LastName   = dto.LastName;
        staff.Department = dto.Department;
        staff.Role       = role;

        await _users.UpdateAsync(staff);
        return _mapper.Map<StaffUserDto>(staff);
    }

    // ── Account management ────────────────────────────────────────────────────

    public async Task DeactivateUserAsync(int id)
    {
        var user = await _users.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"User {id} not found.");
        user.IsActive = false;
        await _users.UpdateAsync(user);
    }

    public async Task ReactivateUserAsync(int id)
    {
        var user = await _users.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"User {id} not found.");
        user.IsActive = true;
        await _users.UpdateAsync(user);
    }

    public async Task UnlockAccountAsync(int id)
    {
        var user = await _users.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"User {id} not found.");
        user.IsLocked            = false;
        user.LockedUntil         = null;
        user.FailedLoginAttempts = 0;
        await _users.UpdateAsync(user);
    }

    public async Task ForcePasswordChangeAsync(int id)
    {
        var user = await _users.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"User {id} not found.");
        // Setting LastPasswordChange to MinValue ensures the 180-day expiry check always fires
        user.LastPasswordChange = DateTime.MinValue;
        await _users.UpdateAsync(user);
    }
}
