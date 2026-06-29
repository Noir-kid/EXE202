using Hangfire;
using Hangfire.SqlServer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SportBooking.Application.Common.Interfaces;
using SportBooking.Infrastructure.BackgroundJobs;
using SportBooking.Infrastructure.Data;
using SportBooking.Infrastructure.Payment;
using SportBooking.Infrastructure.Repositories;
using SportBooking.Infrastructure.Services;

namespace SportBooking.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration config)
    {
        // ── Database ──────────────────────────────────────────────────────────
        services.AddDbContext<AppDbContext>(opts =>
            opts.UseSqlServer(config.GetConnectionString("Default")));

        // ── Unit of Work / Repositories ───────────────────────────────────────
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // ── Auth Services ─────────────────────────────────────────────────────
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICurrentUser, CurrentUserService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();

        // ── Other Services ────────────────────────────────────────────────────
        services.AddScoped<IEmailService, EmailService>();
        services.AddHttpContextAccessor();

        // ── Payment Providers (Strategy Pattern) ──────────────────────────────
        services.AddScoped<IPaymentProvider, VNPayProvider>();
        services.AddScoped<IPaymentProvider, MoMoProvider>();
        services.AddScoped<IPaymentProvider, CashProvider>();

        services.AddHttpClient("MoMo", c => c.Timeout = TimeSpan.FromSeconds(30));

        // ── Background Jobs (Hangfire) ─────────────────────────────────────────
        services.AddHangfire(cfg => cfg
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseSqlServerStorage(config.GetConnectionString("Default"),
                new SqlServerStorageOptions
                {
                    CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
                    SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
                    QueuePollInterval = TimeSpan.Zero,
                    UseRecommendedIsolationLevel = true,
                    DisableGlobalLocks = true
                }));
        services.AddHangfireServer();
        services.AddScoped<BookingExpiryJob>();

        return services;
    }
}