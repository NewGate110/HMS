// Author: Salaams
using System.ComponentModel.DataAnnotations;

namespace HMS.Application.DTOs.Bookings;

public class AddBookingServiceDto
{
    [Range(1, int.MaxValue)]
    public int ServiceId { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;

    public DateTime ServiceDate { get; set; }
}
