// Author: Salaams
using HMS.Application.DTOs.Rooms;
using HMS.Application.Interfaces.Services;
using HMS.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    public RoomsController(IRoomService roomService) => _roomService = roomService;

    /// <summary>Returns a single room by ID.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(RoomDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RoomDto>> GetById(int id)
    {
        var room = await _roomService.GetRoomByIdAsync(id);
        return room is null ? NotFound($"Room {id} not found.") : Ok(room);
    }

    /// <summary>Returns booked date ranges for a room (past-cutoff, non-cancelled).</summary>
    [HttpGet("{id:int}/unavailable-dates")]
    [ProducesResponseType(typeof(IEnumerable<DateRangeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DateRangeDto>>> GetUnavailableDates(int id)
    {
        var dates = await _roomService.GetUnavailableDatesAsync(id);
        return Ok(dates);
    }

    /// <summary>
    /// Searches for available rooms in a hotel for the given date range.
    /// Optional minCapacity filter.
    /// </summary>
    [HttpGet("available")]
    [ProducesResponseType(typeof(IEnumerable<RoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<RoomDto>>> SearchAvailable(
        [FromQuery] int hotelId,
        [FromQuery] DateTime checkIn,
        [FromQuery] DateTime checkOut,
        [FromQuery] int? minCapacity = null)
    {
        if (checkOut <= checkIn)
            return BadRequest("Check-out date must be after check-in date.");

        var rooms = await _roomService.SearchAvailableRoomsAsync(hotelId, checkIn, checkOut, minCapacity);
        return Ok(rooms);
    }

    /// <summary>
    /// Cross-hotel room search. All parameters are optional.
    /// location matches hotel name, city, or address (partial, case-insensitive).
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(RoomSearchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RoomSearchResponse>> Search(
        [FromQuery] string? location = null,
        [FromQuery] DateTime? checkIn = null,
        [FromQuery] DateTime? checkOut = null,
        [FromQuery] int? guests = null,
        [FromQuery] string? roomType = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null)
    {
        if (!checkIn.HasValue)
            return BadRequest("Check-in date is required.");

        if (!checkOut.HasValue)
            return BadRequest("Check-out date is required.");

        if (checkOut <= checkIn)
            return BadRequest("Check-out must be after check-in.");

        RoomType? parsedType = null;
        if (!string.IsNullOrWhiteSpace(roomType) &&
            Enum.TryParse<RoomType>(roomType, ignoreCase: true, out var t))
            parsedType = t;

        var result = await _roomService.SearchRoomsAsync(
            location, checkIn, checkOut, guests, parsedType, minPrice, maxPrice);

        return Ok(result);
    }
}
