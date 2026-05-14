// Author: Salaams
using HMS.Application.DTOs.AuditLogs;
using HMS.Application.DTOs.Hotels;
using HMS.Application.DTOs.Rooms;
using HMS.Application.DTOs.Users;
using HMS.Application.Interfaces.Repositories;
using HMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

/// <summary>
/// Administrative endpoints restricted to the Admin role.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IHotelService _hotelService;
    private readonly IRoomService _roomService;
    private readonly IUserService _userService;
    private readonly IAuditLogRepository _auditLogs;

    public AdminController(
        IHotelService hotelService,
        IRoomService roomService,
        IUserService userService,
        IAuditLogRepository auditLogs)
    {
        _hotelService = hotelService;
        _roomService  = roomService;
        _userService  = userService;
        _auditLogs    = auditLogs;
    }

    /// <summary>Returns all active hotels (admin overview).</summary>
    [HttpGet("hotels")]
    [ProducesResponseType(typeof(IEnumerable<HotelSummaryDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<HotelSummaryDto>>> GetHotels()
    {
        var hotels = await _hotelService.GetAllHotelsAsync();
        return Ok(hotels);
    }

    /// <summary>Updates hotel details (name, address, contact info, active flag).</summary>
    [HttpPut("hotels/{id:int}")]
    [ProducesResponseType(typeof(HotelDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<HotelDto>> UpdateHotel(int id, [FromBody] UpdateHotelDto dto)
    {
        try   { return Ok(await _hotelService.UpdateHotelAsync(id, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    /// <summary>Updates off-peak and peak pricing for a room.</summary>
    [HttpPut("rooms/{id:int}/pricing")]
    [ProducesResponseType(typeof(RoomDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoomDto>> UpdateRoomPricing(int id, [FromBody] UpdateRoomPricingDto dto)
    {
        try   { return Ok(await _roomService.UpdateRoomPricingAsync(id, dto)); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    // ── Staff CRUD ─────────────────────────────────────────────────────────────

    /// <summary>Returns all staff members across all hotels.</summary>
    [HttpGet("staff")]
    [ProducesResponseType(typeof(IEnumerable<StaffUserDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<StaffUserDto>>> GetStaff()
    {
        var staff = await _userService.GetAllStaffAsync();
        return Ok(staff);
    }

    /// <summary>Returns a staff member by ID.</summary>
    [HttpGet("staff/{id:int}")]
    [ProducesResponseType(typeof(StaffUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StaffUserDto>> GetStaffById(int id)
    {
        var staff = await _userService.GetStaffByIdAsync(id);
        return staff is null ? NotFound($"Staff {id} not found.") : Ok(staff);
    }

    /// <summary>Creates a new staff account (FrontDeskStaff or HotelManager).</summary>
    [HttpPost("staff")]
    [ProducesResponseType(typeof(StaffUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StaffUserDto>> CreateStaff([FromBody] CreateStaffDto dto)
    {
        try
        {
            var staff = await _userService.CreateStaffAsync(dto);
            return CreatedAtAction(nameof(GetStaffById), new { id = staff.Id }, staff);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("already exists"))
            { return Conflict(ex.Message); }
        catch (InvalidOperationException ex)
            { return BadRequest(ex.Message); }
    }

    /// <summary>Updates a staff member's name, department, and role.</summary>
    [HttpPut("staff/{id:int}")]
    [ProducesResponseType(typeof(StaffUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StaffUserDto>> UpdateStaff(int id, [FromBody] UpdateStaffDto dto)
    {
        try
        {
            var staff = await _userService.UpdateStaffAsync(id, dto);
            return Ok(staff);
        }
        catch (KeyNotFoundException ex)      { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    // ── Guest list ─────────────────────────────────────────────────────────────

    /// <summary>Returns all registered guests.</summary>
    [HttpGet("guests")]
    [ProducesResponseType(typeof(IEnumerable<GuestListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<GuestListDto>>> GetGuests()
    {
        var guests = await _userService.GetAllGuestsAsync();
        return Ok(guests);
    }

    // ── Account management ─────────────────────────────────────────────────────

    /// <summary>Soft-deactivates a user account. Deactivated accounts cannot log in.</summary>
    [HttpPost("users/{id:int}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        try   { await _userService.DeactivateUserAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    /// <summary>Reactivates a previously deactivated user account.</summary>
    [HttpPost("users/{id:int}/reactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReactivateUser(int id)
    {
        try   { await _userService.ReactivateUserAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    /// <summary>Clears the failed-login counter and unlocks a locked account.</summary>
    [HttpPost("users/{id:int}/unlock")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnlockAccount(int id)
    {
        try   { await _userService.UnlockAccountAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    /// <summary>Forces the user to change their password on next login.</summary>
    [HttpPost("users/{id:int}/force-password-change")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ForcePasswordChange(int id)
    {
        try   { await _userService.ForcePasswordChangeAsync(id); return NoContent(); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
    }

    // ── Audit logs ─────────────────────────────────────────────────────────────

    /// <summary>Returns the most recent audit log entries.</summary>
    [HttpGet("audit-logs")]
    [ProducesResponseType(typeof(IEnumerable<AuditLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AuditLogDto>>> GetAuditLogs([FromQuery] int count = 100)
    {
        var logs = await _auditLogs.GetRecentAsync(count);
        var dtos = logs.Select(l => new AuditLogDto(
            l.Id,
            l.User?.Email,
            l.Action,
            l.EntityType,
            l.EntityId,
            l.Details,
            l.Timestamp));
        return Ok(dtos);
    }
}
