// Author: Salaams
using HMS.Application.DTOs.Reports;

namespace HMS.Application.Interfaces.Services;

public interface IReportService
{
    Task<OccupancyReportDto> GetOccupancyReportAsync(int hotelId, DateTime from, DateTime to);
    Task<RevenueReportDto> GetRevenueReportAsync(int hotelId, DateTime from, DateTime to);
    Task<IEnumerable<StaffPerformanceDto>> GetStaffPerformanceAsync(int hotelId);
}
