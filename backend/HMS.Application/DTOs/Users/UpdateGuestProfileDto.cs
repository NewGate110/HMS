// Author: Salaams
using System.ComponentModel.DataAnnotations;

namespace HMS.Application.DTOs.Users;

public class UpdateGuestProfileDto
{
    [MinLength(2), MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [MinLength(2), MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Phone, MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
}
