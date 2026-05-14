// Author: Salaams
using HMS.Domain.Entities;

namespace HMS.Application.Interfaces.Repositories;

public interface IHotelRepository
{
    Task<IEnumerable<Hotel>> GetAllAsync();
    Task<Hotel?> GetByIdAsync(int id);
    Task<Hotel?> GetByIdWithRoomsAsync(int id);
    Task UpdateAsync(Hotel hotel);
}
