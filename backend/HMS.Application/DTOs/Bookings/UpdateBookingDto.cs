// Author: Salaams
using System.ComponentModel.DataAnnotations;

namespace HMS.Application.DTOs.Bookings;

public class UpdateBookingDto
{
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }

    [MinLength(1, ErrorMessage = "At least one room must be selected.")]
    public List<int> RoomIds { get; set; } = new();

    [Range(1, 100)]
    public int GuestCount { get; set; } = 1;

    [MaxLength(1000)]
    public string Notes { get; set; } = string.Empty;
}
