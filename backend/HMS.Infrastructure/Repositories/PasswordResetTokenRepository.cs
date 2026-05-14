// Author: Salaams
using HMS.Application.Interfaces.Repositories;
using HMS.Domain.Entities;
using HMS.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Repositories;

public class PasswordResetTokenRepository : IPasswordResetTokenRepository
{
    private readonly HmsDbContext _db;

    public PasswordResetTokenRepository(HmsDbContext db) => _db = db;

    public async Task AddAsync(PasswordResetToken token)
    {
        await _db.PasswordResetTokens.AddAsync(token);
        await _db.SaveChangesAsync();
    }

    public async Task<IEnumerable<PasswordResetToken>> GetActiveByUserIdAsync(int userId) =>
        await _db.PasswordResetTokens
            .Where(t => t.UserId == userId && !t.IsUsed && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

    public async Task UpdateAsync(PasswordResetToken token)
    {
        _db.PasswordResetTokens.Update(token);
        await _db.SaveChangesAsync();
    }
}
