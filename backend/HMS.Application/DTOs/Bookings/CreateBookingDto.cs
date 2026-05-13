// Author: Salaams
namespace HMS.Application.DTOs.Bookings;

public class CreateBookingDto
{
    public int HotelId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public List<int> RoomIds { get; set; } = new();
    public List<BookingServiceRequestDto> Services { get; set; } = new();
    public string Notes { get; set; } = string.Empty;
    public int GuestCount { get; set; } = 1;
}

public class BookingServiceRequestDto
{
    public int ServiceId { get; set; }
    public int Quantity { get; set; }
    public DateTime ServiceDate { get; set; }
}
