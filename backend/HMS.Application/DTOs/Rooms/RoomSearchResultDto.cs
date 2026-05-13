// Author: Salaams
namespace HMS.Application.DTOs.Rooms;

public class RoomSearchResultDto
{
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public int RoomId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int FloorNumber { get; set; }
    public decimal PricePerNight { get; set; }
    public string Description { get; set; } = string.Empty;
}

public class RoomSearchResponse
{
    public IEnumerable<RoomSearchResultDto> Results { get; set; } = [];
    public int TotalCount { get; set; }
}
