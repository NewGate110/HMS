// Author: Salaams
namespace HMS.Application.DTOs.Users;

public class GuestStatsDto
{
    public int TotalStays { get; set; }
    public decimal TotalSpend { get; set; }
    /// <summary>"Bronze" (0-2 stays), "Silver" (3-9), "Gold" (10+).</summary>
    public string Tier { get; set; } = "Bronze";
}
