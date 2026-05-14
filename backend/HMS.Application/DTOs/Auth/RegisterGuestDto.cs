// Author: Salaams
using System.ComponentModel.DataAnnotations;

namespace HMS.Application.DTOs.Auth;

public class RegisterGuestDto
{
    [Required, EmailAddress, MaxLength(256)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(256)]
    public string Password { get; set; } = string.Empty;

    [Required, MinLength(2), MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MinLength(2), MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Phone, MaxLength(30)]
    public string Phone { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;
}
