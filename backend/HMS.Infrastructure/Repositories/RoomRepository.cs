// Author: Salaams
using HMS.Application.Interfaces.Repositories;
using HMS.Domain.Entities;
using HMS.Domain.Enums;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class RoomRepository : IRoomRepository
{
    private readonly HmsDbContext _db;
    public RoomRepository(HmsDbContext db) => _db = db;

    public async Task<Room?> GetByIdAsync(int id) =>
        await _db.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<IEnumerable<Room>> GetByIdsAsync(IEnumerable<int> ids) =>
        await _db.Rooms
            .Include(r => r.Hotel)
            .Where(r => ids.Contains(r.Id))
            .ToListAsync();

    public async Task<IEnumerable<Room>> GetByHotelIdAsync(int hotelId) =>
        await _db.Rooms
            .Include(r => r.Hotel)
            .Where(r => r.HotelId == hotelId)
            .OrderBy(r => r.FloorNumber).ThenBy(r => r.RoomNumber)
            .ToListAsync();

    /// <summary>
    /// Returns rooms that are Available and have no overlapping confirmed/pending bookings.
    /// Uses a closed-open interval comparison: booking overlaps when
    ///   booking.CheckIn &lt; requestedCheckOut AND booking.CheckOut &gt; requestedCheckIn
    /// </summary>
    public async Task<IEnumerable<Room>> GetAvailableRoomsAsync(
        int hotelId, DateTime checkIn, DateTime checkOut) =>
        await _db.Rooms
            .Include(r => r.Hotel)
            .Where(r => r.HotelId == hotelId && r.Status == RoomStatus.Available)
            .Where(r => !r.BookingRooms.Any(br =>
                br.Booking.Status != BookingStatus.Cancelled &&
                br.Booking.CheckInDate  < checkOut &&
                br.Booking.CheckOutDate > checkIn))
            .OrderBy(r => r.FloorNumber).ThenBy(r => r.RoomNumber)
            .ToListAsync();

    /// <summary>
    /// Cross-hotel search. Excludes OutOfService rooms and rooms with non-cancelled overlapping bookings.
    /// Unlike GetAvailableRoomsAsync, does not restrict to Status==Available — Cleaning rooms are
    /// still bookable for future dates.
    /// </summary>
    public async Task<IEnumerable<Room>> SearchRoomsAsync(
        string? location, DateTime? checkIn, DateTime? checkOut,
        int? guests, RoomType? roomType, decimal? minPrice, decimal? maxPrice)
    {
        var query = _db.Rooms
            .Include(r => r.Hotel)
            .Where(r => r.Status != RoomStatus.OutOfService && r.Hotel.IsActive);

        if (!string.IsNullOrWhiteSpace(location))
        {
            var loc = location.Trim().ToLower();
            query = query.Where(r =>
                r.Hotel.City.ToLower().Contains(loc) ||
                r.Hotel.Name.ToLower().Contains(loc) ||
                r.Hotel.Address.ToLower().Contains(loc));
        }

        if (checkIn.HasValue && checkOut.HasValue)
        {
            query = query.Where(r => !r.BookingRooms.Any(br =>
                br.Booking.Status != BookingStatus.Cancelled &&
                br.Booking.CheckInDate  < checkOut.Value &&
                br.Booking.CheckOutDate > checkIn.Value));
        }

        if (guests.HasValue)
            query = query.Where(r => r.Capacity >= guests.Value);

        if (roomType.HasValue)
            query = query.Where(r => r.Type == roomType.Value);

        if (minPrice.HasValue)
            query = query.Where(r => r.PriceOffPeak >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(r => r.PriceOffPeak <= maxPrice.Value);

        return await query
            .OrderBy(r => r.Hotel.Name)
            .ThenBy(r => r.PriceOffPeak)
            .ToListAsync();
    }

    public async Task<IEnumerable<(DateTime From, DateTime To)>> GetUnavailableDatesAsync(int roomId)
    {
        var cutoff = DateTime.UtcNow.Date;
        var rows = await _db.BookingRooms
            .Where(br => br.RoomId == roomId
                      && br.Booking.Status != BookingStatus.Cancelled
                      && br.Booking.CheckOutDate > cutoff)
            .Select(br => new { From = br.Booking.CheckInDate, To = br.Booking.CheckOutDate })
            .ToListAsync();
        return rows.Select(r => (r.From.Date, r.To.Date));
    }

    public async Task UpdateAsync(Room room)
    {
        _db.Rooms.Update(room);
        await _db.SaveChangesAsync();
    }
}
