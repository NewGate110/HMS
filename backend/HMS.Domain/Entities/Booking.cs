// Author: Salaams
using HMS.Domain.Enums;

namespace HMS.Domain.Entities;

public class Booking
{
    public int Id { get; set; }
    public int GuestId { get; set; }
    public int HotelId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public decimal TotalAmount { get; set; }
    public decimal CancellationFee { get; set; }
    public string Notes { get; set; } = string.Empty;
    public int GuestCount { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? CreatedByStaffId { get; set; }

    public GuestUser Guest { get; set; } = null!;
    public Hotel Hotel { get; set; } = null!;
    public ICollection<BookingRoom> BookingRooms { get; set; } = new List<BookingRoom>();
    public ICollection<BookingService> BookingServices { get; set; } = new List<BookingService>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public Invoice? Invoice { get; set; }
}
