// Author: Salaams
using HMS.Application.Interfaces.Repositories;
using HMS.Domain.Entities;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class HotelRepository : IHotelRepository
{
    private readonly HmsDbContext _db;
    public HotelRepository(HmsDbContext db) => _db = db;

    public async Task<IEnumerable<Hotel>> GetAllAsync() =>
        await _db.Hotels
            .Where(h => h.IsActive)
            .OrderBy(h => h.Name)
            .ToListAsync();

    public async Task<Hotel?> GetByIdAsync(int id) =>
        await _db.Hotels.FirstOrDefaultAsync(h => h.Id == id);

    public async Task<Hotel?> GetByIdWithRoomsAsync(int id) =>
        await _db.Hotels
            .Include(h => h.Rooms)
            .FirstOrDefaultAsync(h => h.Id == id);

    public async Task UpdateAsync(Hotel hotel)
    {
        _db.Hotels.Update(hotel);
        await _db.SaveChangesAsync();
    }
}
