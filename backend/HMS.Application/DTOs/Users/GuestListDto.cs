// Author: Salaams
namespace HMS.Application.DTOs.Users;

public class GuestListDto
{
    public int    Id            { get; set; }
    public string FullName      { get; set; } = string.Empty;
    public string Email         { get; set; } = string.Empty;
    public string Phone         { get; set; } = string.Empty;
    public int    TotalBookings { get; set; }
    public bool   IsLocked      { get; set; }
    public bool   IsActive      { get; set; }
    public DateTime CreatedAt   { get; set; }
}
