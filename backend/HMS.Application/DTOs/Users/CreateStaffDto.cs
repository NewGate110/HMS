// Author: Salaams
namespace HMS.Application.DTOs.Users;

public class CreateStaffDto
{
    public string FirstName  { get; set; } = string.Empty;
    public string LastName   { get; set; } = string.Empty;
    public string Email      { get; set; } = string.Empty;
    public string Password   { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    /// <summary>Must be "FrontDeskStaff" or "HotelManager".</summary>
    public string Role       { get; set; } = string.Empty;
}
