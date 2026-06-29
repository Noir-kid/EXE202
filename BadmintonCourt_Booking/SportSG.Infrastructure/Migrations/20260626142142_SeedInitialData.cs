using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SportSG.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "RoleId", "Code", "Name" },
                values: new object[,]
                {
                    { 1, "SuperAdmin", "Super Admin" },
                    { 2, "PartnerAdmin", "Chủ sân" },
                    { 3, "BranchManager", "Quản lý chi nhánh" },
                    { 4, "Staff", "Nhân viên" },
                    { 5, "Customer", "Khách hàng" }
                });

            migrationBuilder.InsertData(
                table: "SportTypes",
                columns: new[] { "SportTypeId", "Icon", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "🏸", true, "Cầu lông" },
                    { 2, "🎾", true, "Tennis" },
                    { 3, "🏀", true, "Bóng rổ" },
                    { 4, "⚽", true, "Bóng đá" },
                    { 5, "🏐", true, "Bóng chuyền" },
                    { 6, "🏓", true, "Bóng bàn" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "RoleId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "SportTypes",
                keyColumn: "SportTypeId",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "SportTypes",
                keyColumn: "SportTypeId",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "SportTypes",
                keyColumn: "SportTypeId",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "SportTypes",
                keyColumn: "SportTypeId",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "SportTypes",
                keyColumn: "SportTypeId",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "SportTypes",
                keyColumn: "SportTypeId",
                keyValue: 6);
        }
    }
}
