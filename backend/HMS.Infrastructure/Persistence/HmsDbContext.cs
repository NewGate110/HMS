// Author: Salaams
using HMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HMS.Infrastructure.Persistence;

public class HmsDbContext : DbContext
{
    public HmsDbContext(DbContextOptions<HmsDbContext> options)
        : base(options)
    {
    }

    public DbSet<Hotel> Hotels => Set<Hotel>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<User> Users => Set<User>();
    public DbSet<GuestUser> Guests => Set<GuestUser>();
    public DbSet<StaffUser> Staff => Set<StaffUser>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingRoom> BookingRooms => Set<BookingRoom>();
    public DbSet<BookingService> BookingServices => Set<BookingService>();
    public DbSet<AncillaryService> AncillaryServices => Set<AncillaryService>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLineItem> InvoiceLineItems => Set<InvoiceLineItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HmsDbContext).Assembly);
    }
}
