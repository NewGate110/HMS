// Author: Salaams
namespace HMS.Application.DTOs.Users;

public class StaffUserDto
{
    public int    Id         { get; set; }
    public string Email      { get; set; } = string.Empty;
    public string Role       { get; set; } = string.Empty;
    public string FirstName  { get; set; } = string.Empty;
    public string LastName   { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public bool   IsLocked   { get; set; }
    public bool   IsActive   { get; set; }
    public DateTime CreatedAt { get; set; }
}
