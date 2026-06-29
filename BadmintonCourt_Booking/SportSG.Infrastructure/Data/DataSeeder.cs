namespace SportSG.Infrastructure.Data;

// Seed data đã chuyển sang sql/demo-data.sql
// Chạy file SQL đó trực tiếp trên SQL Server để nạp dữ liệu demo.
public static class DataSeeder
{
    public static Task SeedAsync(AppDbContext _) => Task.CompletedTask;
}
