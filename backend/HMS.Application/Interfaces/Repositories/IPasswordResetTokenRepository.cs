// Author: Salaams
using HMS.Domain.Entities;

namespace HMS.Application.Interfaces.Repositories;

public interface IPasswordResetTokenRepository
{
    Task AddAsync(PasswordResetToken token);
    /// <summary>Returns all unexpired, unused tokens for the given user.</summary>
    Task<IEnumerable<PasswordResetToken>> GetActiveByUserIdAsync(int userId);
    Task UpdateAsync(PasswordResetToken token);
}
