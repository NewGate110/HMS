// Author: Salaams
using HMS.Application.Interfaces.Repositories;
using HMS.Domain.Entities;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly HmsDbContext _db;
    public BookingRepository(HmsDbContext db) => _db = db;

    public async Task<Booking?> GetByIdAsync(int id) =>
        await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id);

    public async Task<Booking?> GetByIdWithDetailsAsync(int id) =>
        await _db.Bookings
            .Include(b => b.Guest)
            .Include(b => b.Hotel)
            .Include(b => b.BookingRooms)
                .ThenInclude(br => br.Room)
                    .ThenInclude(r => r.Hotel)
            .Include(b => b.BookingServices)
                .ThenInclude(bs => bs.Service)
            .Include(b => b.Payments)
            .Include(b => b.Invoice)
                .ThenInclude(i => i!.LineItems)
            .FirstOrDefaultAsync(b => b.Id == id);

    public async Task<IEnumerable<Booking>> GetByGuestIdAsync(int guestId) =>
        await _db.Bookings
            .Include(b => b.Guest)
            .Include(b => b.Hotel)
            .Include(b => b.BookingRooms)
                .ThenInclude(br => br.Room)
            .Include(b => b.BookingServices)
                .ThenInclude(bs => bs.Service)
            .Where(b => b.GuestId == guestId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Booking>> GetByHotelIdAsync(int hotelId) =>
        await _db.Bookings
            .Include(b => b.Guest)
            .Include(b => b.BookingRooms)
                .ThenInclude(br => br.Room)
            .Include(b => b.BookingServices)
                .ThenInclude(bs => bs.Service)
            .Include(b => b.Payments)
            .Where(b => b.HotelId == hotelId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

    public async Task<IEnumerable<Booking>> GetAllAsync() =>
        await _db.Bookings.ToListAsync();

    public async Task AddAsync(Booking booking)
    {
        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();
    }

    public async Task UpdateAsync(Booking booking)
    {
        _db.Bookings.Update(booking);
        await _db.SaveChangesAsync();
    }
}
