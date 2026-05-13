// Author: Salaams
using HMS.Application.DTOs.Rooms;

namespace HMS.Application.DTOs.Bookings;

public class BookingDto
{
    public int Id { get; set; }
    public int GuestId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal CancellationFee { get; set; }
    public string Notes { get; set; } = string.Empty;
    public int GuestCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<RoomDto> Rooms { get; set; } = new();
    public List<BookingServiceDto> Services { get; set; } = new();
}
