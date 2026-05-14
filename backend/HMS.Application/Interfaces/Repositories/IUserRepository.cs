// Author: Salaams
using HMS.Domain.Entities;

namespace HMS.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task<User?>       GetByIdAsync(int id);
    Task<User?>       GetByEmailAsync(string email);
    Task<GuestUser?>  GetGuestByIdAsync(int id);
    Task<StaffUser?>  GetStaffByIdAsync(int id);
    Task<IEnumerable<GuestUser>>  GetAllGuestsAsync();
    Task<IEnumerable<StaffUser>> GetAllStaffAsync();
    Task<IEnumerable<GuestUser>> SearchGuestsAsync(string term);
    Task AddAsync(GuestUser guest);
    Task AddStaffAsync(StaffUser staff);
    Task UpdateAsync(User user);
}
