// Author: Salaams
using System.ComponentModel.DataAnnotations;

namespace HMS.Application.DTOs.Rooms;

public class UpdateRoomPricingDto
{
    [Range(0.01, 100_000)]
    public decimal PriceOffPeak { get; set; }

    [Range(0.01, 100_000)]
    public decimal PricePeak { get; set; }
}
