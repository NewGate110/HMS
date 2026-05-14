// Author: Salaams
using System.Security.Claims;
using HMS.Application.DTOs.Bookings;
using HMS.Application.DTOs.Users;
using HMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService) => _userService = userService;

    // ── Guests ────────────────────────────────────────────────────────────────

    /// <summary>Returns a guest's profile. Guests may only view their own profile.</summary>
    [HttpGet("guests/{id:int}")]
    [ProducesResponseType(typeof(GuestUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GuestUserDto>> GetGuest(int id)
    {
        var callerRole = User.FindFirst("role")?.Value ?? string.Empty;
        var callerId   = int.TryParse(User.FindFirst("sub")?.Value, out var cid) ? cid : 0;
        if (callerRole == "Guest" && callerId != id) return Forbid();
        var guest = await _userService.GetGuestByIdAsync(id);
        return guest is null ? NotFound($"Guest {id} not found.") : Ok(guest);
    }

    /// <summary>Returns loyalty stats for a guest: total stays, spend, and tier.</summary>
    [HttpGet("guests/{id:int}/stats")]
    [ProducesResponseType(typeof(GuestStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GuestStatsDto>> GetGuestStats(int id)
    {
        var callerRole = User.FindFirst("role")?.Value ?? string.Empty;
        var callerId   = int.TryParse(User.FindFirst("sub")?.Value, out var cid) ? cid : 0;
        if (callerRole == "Guest" && callerId != id) return Forbid();
        var stats = await _userService.GetGuestStatsAsync(id);
        return Ok(stats);
    }

    /// <summary>Updates a guest's profile (name, phone, address). Guests may only update their own profile.</summary>
    [HttpPut("guests/{id:int}")]
    [ProducesResponseType(typeof(GuestUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GuestUserDto>> UpdateGuest(
        int id, [FromBody] UpdateGuestProfileDto dto)
    {
        var callerRole = User.FindFirst("role")?.Value ?? string.Empty;
        var callerId   = int.TryParse(User.FindFirst("sub")?.Value, out var cid) ? cid : 0;
        if (callerRole == "Guest" && callerId != id) return Forbid();
        try
        {
            var guest = await _userService.UpdateGuestProfileAsync(id, dto);
            return Ok(guest);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    /// <summary>Returns all bookings for a guest. Guests may only view their own bookings.</summary>
    [HttpGet("guests/{id:int}/bookings")]
    [ProducesResponseType(typeof(IEnumerable<BookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<BookingDto>>> GetGuestBookings(int id)
    {
        var callerRole = User.FindFirst("role")?.Value ?? string.Empty;
        var callerId   = int.TryParse(User.FindFirst("sub")?.Value, out var cid) ? cid : 0;
        if (callerRole == "Guest" && callerId != id) return Forbid();
        var bookings = await _userService.GetGuestBookingsAsync(id);
        return Ok(bookings);
    }

    /// <summary>
    /// Searches guests by name or email (staff/manager/admin only).
    /// Returns up to 50 results that contain the search term in firstName, lastName or email.
    /// </summary>
    [HttpGet("guests/search")]
    [Authorize(Roles = "FrontDeskStaff,HotelManager,Admin")]
    [ProducesResponseType(typeof(IEnumerable<GuestListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GuestListDto>>> SearchGuests([FromQuery] string term = "")
    {
        var guests = await _userService.SearchGuestsAsync(term);
        return Ok(guests);
    }

    // ── Staff ─────────────────────────────────────────────────────────────────

    /// <summary>Returns all staff members.</summary>
    [HttpGet("staff")]
    [Authorize(Roles = "FrontDeskStaff,HotelManager,Admin")]
    [ProducesResponseType(typeof(IEnumerable<StaffUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<StaffUserDto>>> GetAllStaff()
    {
        var staff = await _userService.GetAllStaffAsync();
        return Ok(staff);
    }

    /// <summary>Returns a staff member by ID.</summary>
    [HttpGet("staff/{id:int}")]
    [Authorize(Roles = "FrontDeskStaff,HotelManager,Admin")]
    [ProducesResponseType(typeof(StaffUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StaffUserDto>> GetStaff(int id)
    {
        var staff = await _userService.GetStaffByIdAsync(id);
        return staff is null ? NotFound($"Staff member {id} not found.") : Ok(staff);
    }
}
