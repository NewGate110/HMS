// Author: Salaams
using HMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HMS.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.ToTable("Bookings");
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Status).IsRequired().HasConversion<string>();
        builder.Property(b => b.TotalAmount).HasColumnType("decimal(10,2)");
        builder.Property(b => b.CancellationFee).HasColumnType("decimal(10,2)");
        builder.Property(b => b.Notes).HasMaxLength(1000);
        builder.Property(b => b.GuestCount).IsRequired().HasDefaultValue(1);

        builder.HasOne(b => b.Guest)
               .WithMany(g => g.Bookings)
               .HasForeignKey(b => b.GuestId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Hotel)
               .WithMany(h => h.Bookings)
               .HasForeignKey(b => b.HotelId)
               .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(b => b.GuestId);
        builder.HasIndex(b => b.CheckInDate);
    }
}
