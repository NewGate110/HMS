// Author: Salaams
using HMS.Application.Interfaces.Repositories;
using HMS.Domain.Entities;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly HmsDbContext _db;
    public UserRepository(HmsDbContext db) => _db = db;

    public async Task<User?> GetByIdAsync(int id) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByEmailAsync(string email) =>
        await _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<GuestUser?> GetGuestByIdAsync(int id) =>
        await _db.Guests.FirstOrDefaultAsync(g => g.Id == id);

    public async Task<StaffUser?> GetStaffByIdAsync(int id) =>
        await _db.Staff.FirstOrDefaultAsync(s => s.Id == id);

    public async Task<IEnumerable<GuestUser>> GetAllGuestsAsync() =>
        await _db.Guests
            .OrderBy(g => g.LastName)
            .ThenBy(g => g.FirstName)
            .ToListAsync();

    public async Task<IEnumerable<StaffUser>> GetAllStaffAsync() =>
        await _db.Staff
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .ToListAsync();

    public async Task<IEnumerable<GuestUser>> SearchGuestsAsync(string term)
    {
        var lower = term.ToLower();
        return await _db.Guests
            .Where(g => g.Email.ToLower().Contains(lower)
                     || g.FirstName.ToLower().Contains(lower)
                     || g.LastName.ToLower().Contains(lower))
            .OrderBy(g => g.LastName)
            .Take(50)
            .ToListAsync();
    }

    public async Task AddAsync(GuestUser guest)
    {
        _db.Guests.Add(guest);
        await _db.SaveChangesAsync();
    }

    public async Task AddStaffAsync(StaffUser staff)
    {
        _db.Staff.Add(staff);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }
}
