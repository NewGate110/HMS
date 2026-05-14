// Author: Salaams
using AutoMapper;
using HMS.Application.DTOs.Rooms;
using HMS.Application.Interfaces.Repositories;
using HMS.Application.Interfaces.Services;
using HMS.Domain.Enums;

namespace HMS.Application.Services;

public class RoomService : IRoomService
{
    private readonly IRoomRepository _rooms;
    private readonly IMapper _mapper;

    public RoomService(IRoomRepository rooms, IMapper mapper)
    {
        _rooms  = rooms;
        _mapper = mapper;
    }

    public async Task<RoomDto?> GetRoomByIdAsync(int id)
    {
        var room = await _rooms.GetByIdAsync(id);
        return room is null ? null : _mapper.Map<RoomDto>(room);
    }

    public async Task<IEnumerable<RoomDto>> SearchAvailableRoomsAsync(
        int hotelId, DateTime checkIn, DateTime checkOut, int? minCapacity = null)
    {
        var rooms = await _rooms.GetAvailableRoomsAsync(hotelId, checkIn, checkOut);
        if (minCapacity.HasValue)
            rooms = rooms.Where(r => r.Capacity >= minCapacity.Value);
        return _mapper.Map<IEnumerable<RoomDto>>(rooms);
    }

    public async Task<RoomSearchResponse> SearchRoomsAsync(
        string? location, DateTime? checkIn, DateTime? checkOut,
        int? guests, RoomType? roomType, decimal? minPrice, decimal? maxPrice)
    {
        var rooms = await _rooms.SearchRoomsAsync(
            location, checkIn, checkOut, guests, roomType, minPrice, maxPrice);

        var results = rooms.Select(r => new RoomSearchResultDto
        {
            HotelId      = r.HotelId,
            HotelName    = r.Hotel?.Name    ?? string.Empty,
            City         = r.Hotel?.City    ?? string.Empty,
            Country      = r.Hotel?.Country ?? string.Empty,
            RoomId       = r.Id,
            RoomNumber   = r.RoomNumber,
            Type         = r.Type.ToString(),
            Capacity     = r.Capacity,
            FloorNumber  = r.FloorNumber,
            PricePerNight = r.PriceOffPeak,
            Description  = r.Description,
        }).ToList();

        return new RoomSearchResponse
        {
            Results    = results,
            TotalCount = results.Count,
        };
    }

    public async Task<IEnumerable<DateRangeDto>> GetUnavailableDatesAsync(int roomId)
    {
        var ranges = await _rooms.GetUnavailableDatesAsync(roomId);
        return ranges.Select(r => new DateRangeDto
        {
            From = r.From.ToString("yyyy-MM-dd"),
            To   = r.To.ToString("yyyy-MM-dd"),
        });
    }

    public async Task<RoomDto> UpdateRoomPricingAsync(int roomId, UpdateRoomPricingDto dto)
    {
        var room = await _rooms.GetByIdAsync(roomId)
            ?? throw new KeyNotFoundException($"Room {roomId} not found.");

        room.PriceOffPeak = dto.PriceOffPeak;
        room.PricePeak    = dto.PricePeak;

        await _rooms.UpdateAsync(room);
        return _mapper.Map<RoomDto>(room);
    }
}
