// Author: Salaams
using HMS.Application.DTOs.Rooms;
using HMS.Domain.Enums;

namespace HMS.Application.Interfaces.Services;

public interface IRoomService
{
    Task<RoomDto?> GetRoomByIdAsync(int id);
    Task<IEnumerable<RoomDto>> SearchAvailableRoomsAsync(
        int hotelId, DateTime checkIn, DateTime checkOut, int? minCapacity = null);
    Task<RoomSearchResponse> SearchRoomsAsync(
        string? location, DateTime? checkIn, DateTime? checkOut,
        int? guests, RoomType? roomType, decimal? minPrice, decimal? maxPrice);
    Task<IEnumerable<DateRangeDto>> GetUnavailableDatesAsync(int roomId);
    Task<RoomDto> UpdateRoomPricingAsync(int roomId, UpdateRoomPricingDto dto);
}
