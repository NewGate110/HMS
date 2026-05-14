// Author: Salaams
using HMS.Domain.Entities;
using HMS.Domain.Enums;

namespace HMS.Application.Interfaces.Repositories;

public interface IRoomRepository
{
    Task<Room?> GetByIdAsync(int id);
    Task<IEnumerable<Room>> GetByIdsAsync(IEnumerable<int> ids);
    Task<IEnumerable<Room>> GetByHotelIdAsync(int hotelId);
    Task<IEnumerable<Room>> GetAvailableRoomsAsync(int hotelId, DateTime checkIn, DateTime checkOut);
    Task<IEnumerable<Room>> SearchRoomsAsync(
        string? location, DateTime? checkIn, DateTime? checkOut,
        int? guests, RoomType? roomType, decimal? minPrice, decimal? maxPrice);
    Task<IEnumerable<(DateTime From, DateTime To)>> GetUnavailableDatesAsync(int roomId);
    Task UpdateAsync(Room room);
}
