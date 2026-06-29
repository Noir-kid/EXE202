using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SportSG.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DropCourtTypeId1Shadow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent — column may not exist when DB was built from demo-data.sql
            migrationBuilder.Sql(@"
                IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Courts_CourtTypes_CourtTypeId1')
                    ALTER TABLE [Courts] DROP CONSTRAINT [FK_Courts_CourtTypes_CourtTypeId1];
                IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Courts_CourtTypeId1' AND object_id = OBJECT_ID('Courts'))
                    DROP INDEX [IX_Courts_CourtTypeId1] ON [Courts];
                IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Courts') AND name = 'CourtTypeId1')
                    ALTER TABLE [Courts] DROP COLUMN [CourtTypeId1];
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CourtTypeId1",
                table: "Courts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Courts_CourtTypeId1",
                table: "Courts",
                column: "CourtTypeId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Courts_CourtTypes_CourtTypeId1",
                table: "Courts",
                column: "CourtTypeId1",
                principalTable: "CourtTypes",
                principalColumn: "CourtTypeId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
