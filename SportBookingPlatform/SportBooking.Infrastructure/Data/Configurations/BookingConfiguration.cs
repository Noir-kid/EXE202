using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SportBooking.Domain.Entities;

// Alias to avoid conflict with SportBooking.Infrastructure.Payment namespace
using PaymentEntity = SportBooking.Domain.Entities.Payment;

namespace SportBooking.Infrastructure.Data.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.TotalAmount).HasColumnType("decimal(18,0)");
        b.Property(x => x.DiscountAmount).HasColumnType("decimal(18,0)");
        b.Property(x => x.FinalAmount).HasColumnType("decimal(18,0)");

        b.HasIndex(x => new { x.CourtId, x.BookingDate, x.StartTime, x.EndTime });

        b.HasOne(x => x.Customer)
            .WithMany(u => u.Bookings)
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Court)
            .WithMany(c => c.Bookings)
            .HasForeignKey(x => x.CourtId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Owner)
            .WithMany()
            .HasForeignKey(x => x.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Branch)
            .WithMany()
            .HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Payment)
            .WithOne(p => p.Booking)
            .HasForeignKey<PaymentEntity>(p => p.BookingId);
    }
}

public class CourtConfiguration : IEntityTypeConfiguration<Court>
{
    public void Configure(EntityTypeBuilder<Court> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.PricePerHour).HasColumnType("decimal(18,0)");
        b.Property(x => x.PeakHourMultiplier).HasColumnType("decimal(4,2)");
        b.HasIndex(x => new { x.BranchId, x.SportType });
        b.HasIndex(x => x.OwnerId);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<PaymentEntity>
{
    public void Configure(EntityTypeBuilder<PaymentEntity> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.Amount).HasColumnType("decimal(18,0)");
        b.HasIndex(x => x.GatewayOrderId).IsUnique();
        b.HasMany(x => x.Transactions)
            .WithOne(t => t.Payment)
            .HasForeignKey(t => t.PaymentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}


public class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> b)
    {
        b.HasKey(x => x.Id);
        b.Property(x => x.CommissionRate).HasColumnType("decimal(5,2)");
        b.HasIndex(x => x.Email).IsUnique();
    }
}

public class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
{
    public void Configure(EntityTypeBuilder<Promotion> b)
    {
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.OwnerId, x.Code }).IsUnique();
        b.Property(x => x.Value).HasColumnType("decimal(18,2)");
        b.Property(x => x.MaxDiscount).HasColumnType("decimal(18,0)");
        b.Property(x => x.MinBookingAmount).HasColumnType("decimal(18,0)");
    }
}