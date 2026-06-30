using System.Text;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using StackExchange.Redis;
using Swashbuckle.AspNetCore.Filters;
using SportSG.API.Middleware;
using SportSG.Application.Interfaces;
using SportSG.Application.Services;
using SportSG.Infrastructure.Data;
using SportSG.Infrastructure.Hubs;
using SportSG.Infrastructure.Jobs;
using SportSG.Application.Repositories;
using SportSG.Infrastructure.Repositories;
using SportSG.Infrastructure.Services;
using System.Threading.RateLimiting;

// ── Serilog bootstrap logger ─────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // ── Serilog ───────────────────────────────────────────────────
    builder.Host.UseSerilog((ctx, services, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .ReadFrom.Services(services)
           .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
           .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
           .Enrich.FromLogContext()
           .WriteTo.Console()
           .WriteTo.File(
               path: "logs/sportsg-.log",
               rollingInterval: RollingInterval.Day,
               retainedFileCountLimit: 30,
               outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}"));

    // ── Database ──────────────────────────────────────────────────
    builder.Services.AddDbContext<AppDbContext>(opt =>
        opt.UseSqlServer(
            builder.Configuration.GetConnectionString("Default"),
            sql => sql.EnableRetryOnFailure(3, TimeSpan.FromSeconds(5), null)));

    // ── Redis + Cache ─────────────────────────────────────────────
    var redisConnStr = builder.Configuration.GetConnectionString("Redis");
    if (!string.IsNullOrWhiteSpace(redisConnStr))
    {
        builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<Program>>();
            try
            {
                return ConnectionMultiplexer.Connect(redisConnStr);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Redis connection failed — falling back to memory cache.");
                throw;
            }
        });
        builder.Services.AddSingleton<ICacheService, RedisCacheService>();
    }
    else
    {
        builder.Services.AddMemoryCache();
        builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
    }

    // ── Repositories / Unit of Work ───────────────────────────────
    builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

    // ── Application Services ──────────────────────────────────────
    builder.Services.AddScoped<IAuthService,      AuthService>();
    builder.Services.AddScoped<IBookingService,   BookingService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddScoped<IFavoriteService,  FavoriteService>();

    // ── Infrastructure Services ───────────────────────────────────
    builder.Services.AddScoped<IEmailService,    EmailService>();
    builder.Services.AddScoped<IUploadService,   CloudinaryUploadService>();
    builder.Services.AddScoped<INotificationHub, SignalRNotificationHub>();
    builder.Services.AddScoped<VnPayGateway>();
    builder.Services.AddScoped<MoMoGateway>();

    // ── Hangfire Jobs ─────────────────────────────────────────────
    builder.Services.AddScoped<BookingExpiryJob>();
    builder.Services.AddScoped<BookingReminderJob>();

    // ── HTTP Client (Google OAuth + MoMo API) ────────────────────
    builder.Services.AddHttpClient();
    builder.Services.AddHttpClient("Google", c =>
    {
        c.DefaultRequestHeaders.Accept.Add(
            new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
    });

    // ── Google OAuth provider ─────────────────────────────────────
    builder.Services.AddScoped<IGoogleAuthProvider, GoogleAuthProvider>();

    // ── SignalR ───────────────────────────────────────────────────
    builder.Services.AddSignalR(opt =>
    {
        opt.EnableDetailedErrors = builder.Environment.IsDevelopment();
        opt.MaximumReceiveMessageSize = 32 * 1024;
    });

    // ── Hangfire ──────────────────────────────────────────────────
    builder.Services.AddHangfire(cfg =>
        cfg.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
           .UseSimpleAssemblyNameTypeSerializer()
           .UseRecommendedSerializerSettings()
           .UseSqlServerStorage(
               builder.Configuration.GetConnectionString("Default"),
               new SqlServerStorageOptions
               {
                   CommandBatchMaxTimeout       = TimeSpan.FromMinutes(5),
                   SlidingInvisibilityTimeout   = TimeSpan.FromMinutes(5),
                   QueuePollInterval            = TimeSpan.Zero,
                   UseRecommendedIsolationLevel = true,
                   DisableGlobalLocks           = true,
               }));

    builder.Services.AddHangfireServer(opt =>
    {
        opt.WorkerCount = Math.Max(2, Environment.ProcessorCount);
        opt.Queues = ["critical", "default", "low"];
    });

    // ── Rate Limiting ─────────────────────────────────────────────
    builder.Services.AddRateLimiter(opt =>
    {
        // General API: 100 requests/min
        opt.AddFixedWindowLimiter("PublicApi", cfg =>
        {
            cfg.PermitLimit              = 100;
            cfg.Window                   = TimeSpan.FromMinutes(1);
            cfg.QueueProcessingOrder     = QueueProcessingOrder.OldestFirst;
            cfg.QueueLimit               = 10;
        });

        // Auth endpoints: 10 requests/min to prevent brute force
        opt.AddFixedWindowLimiter("AuthApi", cfg =>
        {
            cfg.PermitLimit  = 10;
            cfg.Window       = TimeSpan.FromMinutes(1);
            cfg.QueueLimit   = 0;
        });

        opt.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

    // ── Authentication: JWT Bearer ────────────────────────────────
    builder.Services
        .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer           = true,
                ValidateAudience         = true,
                ValidateLifetime         = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer              = builder.Configuration["Jwt:Issuer"],
                ValidAudience            = builder.Configuration["Jwt:Audience"],
                IssuerSigningKey         = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
                ClockSkew = TimeSpan.Zero,
            };

            // SignalR: read JWT from query string when connecting to hubs
            opt.Events = new JwtBearerEvents
            {
                OnMessageReceived = ctx =>
                {
                    var token = ctx.Request.Query["access_token"];
                    if (!string.IsNullOrEmpty(token) &&
                        ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                        ctx.Token = token;
                    return Task.CompletedTask;
                }
            };
        });

    builder.Services.AddAuthorization();

    // ── CORS ──────────────────────────────────────────────────────
    builder.Services.AddCors(opt =>
        opt.AddPolicy("Frontend", p =>
            p.WithOrigins(
                "http://localhost:3000",
                "https://yourdomain.com")
             .AllowAnyMethod()
             .AllowAnyHeader()
             .AllowCredentials()));

    // ── Controllers ───────────────────────────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(opt =>
        {
            opt.JsonSerializerOptions.Converters.Add(
                new System.Text.Json.Serialization.JsonStringEnumConverter());
            opt.JsonSerializerOptions.DefaultIgnoreCondition =
                System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });

    // ── Swagger ───────────────────────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(opt =>
    {
        opt.SwaggerDoc("v1", new OpenApiInfo
        {
            Title       = "SportSG API",
            Version     = "v1",
            Description = "Multi-Tenant SaaS Sports Court Booking Platform"
        });
        opt.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
        {
            Description = "Bearer {token}",
            In   = ParameterLocation.Header,
            Name = "Authorization",
            Type = SecuritySchemeType.ApiKey,
        });
        opt.OperationFilter<SecurityRequirementsOperationFilter>();
    });

    // ─────────────────────────────────────────────────────────────
    var app = builder.Build();
    // ─────────────────────────────────────────────────────────────

    // ── Middleware Pipeline (ORDER MATTERS) ───────────────────────
    app.UseExceptionHandling();          // 1. Global exception — FIRST

    app.UseSerilogRequestLogging(opt =>  // 2. Request logging
    {
        opt.EnrichDiagnosticContext = (ctx, httpCtx) =>
        {
            ctx.Set("UserId",    httpCtx.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            ctx.Set("PartnerId", httpCtx.User.FindFirst("partnerId")?.Value);
            ctx.Set("IP",        httpCtx.Connection.RemoteIpAddress?.ToString());
        };
    });

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(opt =>
            opt.SwaggerEndpoint("/swagger/v1/swagger.json", "SportSG API v1"));

        app.UseHangfireDashboard("/jobs", new DashboardOptions
        {
            DashboardTitle = "SportSG Background Jobs",
            IsReadOnlyFunc = _ => false,
        });
    }

    app.UseHttpsRedirection();
    app.UseCors("Frontend");
    app.UseRateLimiter();                // Rate limiting before auth
    app.UseAuthentication();
    app.UseTenant();                     // Populate HttpContext.Items from JWT claims
    app.UseAuditLogging();               // Log mutating requests after auth
    app.UseAuthorization();

    app.MapControllers();
    app.MapHub<SportSGHub>("/hubs/notifications");

    // ── Auto-migrate + Seed on startup ───────────────────────────
    if (app.Environment.IsDevelopment())
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        await DataSeeder.SeedAsync(db);
    }

    // ── Schedule Hangfire recurring jobs ─────────────────────────
    HangfireJobScheduler.Schedule();

    Log.Information("SportSG API started on {Environment}", builder.Environment.EnvironmentName);
    await app.RunAsync();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    Log.Fatal(ex, "Application startup failed.");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
