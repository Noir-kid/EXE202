using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SportBooking.Domain.Entities;

namespace SportBooking.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.HasKey(x => x.Id);

        b.HasIndex(x => x.Email).IsUnique();
        b.HasIndex(x => x.GoogleId).IsUnique().HasFilter("[GoogleId] IS NOT NULL");

        b.Property(x => x.Email).HasMaxLength(200).IsRequired();
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.PasswordHash).IsRequired(false);   // nullable — Google-only users
        b.Property(x => x.GoogleId).HasMaxLength(100).IsRequired(false);
        b.Property(x => x.Avatar).HasMaxLength(500).IsRequired(false);

        b.HasOne(x => x.Owner).WithMany(o => o.Users).HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.Branch).WithMany(br => br.Staff).HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}