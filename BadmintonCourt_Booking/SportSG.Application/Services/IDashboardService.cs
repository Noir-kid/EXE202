using SportSG.Application.DTOs.Dashboard;

namespace SportSG.Application.Services;

public interface IDashboardService
{
    Task<SuperAdminDashboard>    GetSuperAdminAsync(CancellationToken ct = default);
    Task<PartnerAdminDashboard>  GetPartnerAdminAsync(Guid partnerId, CancellationToken ct = default);
    Task<BranchManagerDashboard> GetBranchManagerAsync(Guid branchId, CancellationToken ct = default);
    Task<StaffDashboard>         GetStaffAsync(Guid branchId, CancellationToken ct = default);

    // Revenue reports (scoped by caller role)
    Task<RevenueReport>        GetRevenueReportAsync(CancellationToken ct = default);
    Task<PartnerRevenueReport> GetPartnerRevenueReportAsync(Guid partnerId, CancellationToken ct = default);
}
