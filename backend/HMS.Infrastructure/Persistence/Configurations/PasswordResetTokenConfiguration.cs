// Author: Salaams
using HMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HMS.Infrastructure.Persistence.Configurations;

public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        builder.ToTable("PasswordResetTokens");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TokenHash).IsRequired().HasMaxLength(100);
        builder.Property(t => t.ExpiresAt).IsRequired();
        builder.Property(t => t.IsUsed).HasDefaultValue(false);
        builder.Property(t => t.CreatedAt).IsRequired();

        builder.HasOne(t => t.User)
               .WithMany()
               .HasForeignKey(t => t.UserId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.UserId);
        builder.HasIndex(t => t.ExpiresAt);
    }
}
