// Author: Salaams
namespace HMS.Application.DTOs.Users;

public class UpdateStaffDto
{
    public string FirstName  { get; set; } = string.Empty;
    public string LastName   { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    /// <summary>Must be "FrontDeskStaff" or "HotelManager".</summary>
    public string Role       { get; set; } = string.Empty;
}
