// Author: Salaams
namespace HMS.Application.DTOs.Reports;

public class StaffPerformanceDto
{
    public int StaffId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int BookingsCreated { get; set; }
    public int CheckIns { get; set; }
    public int CheckOuts { get; set; }
}
