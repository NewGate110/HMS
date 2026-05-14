// Author: Salaams
using HMS.Application.DTOs.Bookings;
using HMS.Application.DTOs.Users;

namespace HMS.Application.Interfaces.Services;

public interface IUserService
{
    // ── Guest ─────────────────────────────────────────────────────────────────
    Task<GuestUserDto?> GetGuestByIdAsync(int id);
    Task<GuestStatsDto> GetGuestStatsAsync(int id);
    Task<GuestUserDto> UpdateGuestProfileAsync(int guestId, UpdateGuestProfileDto dto);
    Task<IEnumerable<BookingDto>> GetGuestBookingsAsync(int guestId);
    Task<IEnumerable<GuestListDto>> GetAllGuestsAsync();
    Task<IEnumerable<GuestListDto>> SearchGuestsAsync(string term);

    // ── Staff ─────────────────────────────────────────────────────────────────
    Task<IEnumerable<StaffUserDto>> GetAllStaffAsync();
    Task<StaffUserDto?> GetStaffByIdAsync(int id);
    Task<StaffUserDto> CreateStaffAsync(CreateStaffDto dto);
    Task<StaffUserDto> UpdateStaffAsync(int id, UpdateStaffDto dto);

    // ── Account management (Admin) ────────────────────────────────────────────
    Task DeactivateUserAsync(int id);
    Task ReactivateUserAsync(int id);
    Task UnlockAccountAsync(int id);
    Task ForcePasswordChangeAsync(int id);
}
