// Author: Salaams
using HMS.Application.DTOs.Reports;
using HMS.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HMS.API.Controllers;

/// <summary>
/// Read-only reporting endpoints for Hotel Manager role.
/// Phase 5 adds detailed business-logic calculations.
/// Phase 6 restricts access to HotelManager and Admin roles.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[Authorize(Roles = "HotelManager,Admin")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService) => _reportService = reportService;

    /// <summary>
    /// Returns occupancy statistics for a hotel over a date range.
    /// Shows total rooms, occupied rooms, and occupancy percentage.
    /// </summary>
    [HttpGet("occupancy")]
    [ProducesResponseType(typeof(OccupancyReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OccupancyReportDto>> GetOccupancy(
        [FromQuery] int hotelId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        if (to <= from) return BadRequest("'to' must be after 'from'.");

        var report = await _reportService.GetOccupancyReportAsync(hotelId, from, to);
        return Ok(report);
    }

    /// <summary>
    /// Returns per-staff booking and check-in/checkout counts for a hotel.
    /// CSAT and handle-time metrics are not tracked in this system and will show as N/A.
    /// </summary>
    [HttpGet("staff-performance")]
    [ProducesResponseType(typeof(IEnumerable<StaffPerformanceDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<StaffPerformanceDto>>> GetStaffPerformance(
        [FromQuery] int hotelId)
    {
        var report = await _reportService.GetStaffPerformanceAsync(hotelId);
        return Ok(report);
    }

    /// <summary>
    /// Returns revenue statistics for a hotel over a date range.
    /// Sums confirmed and checked-out bookings with their total amounts.
    /// </summary>
    [HttpGet("revenue")]
    [ProducesResponseType(typeof(RevenueReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RevenueReportDto>> GetRevenue(
        [FromQuery] int hotelId,
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        if (to <= from) return BadRequest("'to' must be after 'from'.");

        var report = await _reportService.GetRevenueReportAsync(hotelId, from, to);
        return Ok(report);
    }
}
