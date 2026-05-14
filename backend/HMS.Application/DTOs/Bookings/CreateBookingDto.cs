// Author: Salaams
using System.ComponentModel.DataAnnotations;

namespace HMS.Application.DTOs.Bookings;

public class CreateBookingDto
{
    [Range(1, int.MaxValue)]
    public int HotelId { get; set; }

    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }

    public List<int> RoomIds { get; set; } = new();
    public List<BookingServiceRequestDto> Services { get; set; } = new();

    [MaxLength(1000)]
    public string Notes { get; set; } = string.Empty;

    [Range(1, 100)]
    public int GuestCount { get; set; } = 1;
}

public class BookingServiceRequestDto
{
    [Range(1, int.MaxValue)]
    public int ServiceId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; }

    public DateTime ServiceDate { get; set; }
}
