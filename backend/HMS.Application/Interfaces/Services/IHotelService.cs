// Author: Salaams
using HMS.Application.DTOs.Hotels;
using HMS.Application.DTOs.Rooms;

namespace HMS.Application.Interfaces.Services;

public interface IHotelService
{
    Task<IEnumerable<HotelSummaryDto>> GetAllHotelsAsync();
    Task<HotelDto?> GetHotelByIdAsync(int id);
    Task<IEnumerable<RoomDto>> GetRoomsForHotelAsync(int hotelId);
    Task<HotelDto> UpdateHotelAsync(int id, UpdateHotelDto dto);
}
