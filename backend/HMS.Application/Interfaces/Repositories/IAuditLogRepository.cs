// Author: Salaams
using HMS.Domain.Entities;

namespace HMS.Application.Interfaces.Repositories;

public interface IAuditLogRepository
{
    Task AddAsync(AuditLog log);
    Task<IEnumerable<AuditLog>> GetRecentAsync(int count = 100);
}
