// Author: Salaams
using System.ComponentModel.DataAnnotations;

namespace HMS.Application.DTOs.Hotels;

public class UpdateHotelDto
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Country { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(254), EmailAddress]
    public string Email { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
