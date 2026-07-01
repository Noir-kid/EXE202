import React, { useEffect, useState } from "react";
import { Box, Chip } from "@mui/material";
import { fetchWithAuth } from "../../Components/fetchWithAuth/fetchWithAuth";
import { jwtDecode } from "jwt-decode";
import { API_BASE } from "../../config";
import LineChart from "../../Components/LineChart";
import BarChart from "../../Components/BarChart";
import PieChart from '../../Components/PieChart';
import './dashboard.css';

import PeopleOutlinedIcon              from "@mui/icons-material/PeopleOutlined";
import StorefrontOutlinedIcon          from "@mui/icons-material/StorefrontOutlined";
import SportsTennisOutlinedIcon        from "@mui/icons-material/SportsTennisOutlined";
import TrendingUpOutlinedIcon          from "@mui/icons-material/TrendingUpOutlined";
import ReceiptLongOutlinedIcon         from "@mui/icons-material/ReceiptLongOutlined";
import StarOutlinedIcon                from "@mui/icons-material/StarOutlined";
import EventNoteOutlinedIcon           from "@mui/icons-material/EventNoteOutlined";
import CheckCircleOutlineIcon          from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyOutlinedIcon      from "@mui/icons-material/HourglassEmptyOutlined";
import BadgeOutlinedIcon               from "@mui/icons-material/BadgeOutlined";
import CalendarTodayOutlinedIcon       from "@mui/icons-material/CalendarTodayOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";

/* ── helpers ─────────────────────────────────────── */
const fmt    = n => (n ?? 0).toLocaleString('vi-VN');
const fmtVnd = n => `${fmt(n)} ₫`;

const NOW      = new Date();
const DATE_STR = NOW.toLocaleDateString('vi-VN', { weekday:'long', day:'2-digit', month:'2-digit', year:'numeric' });
const HOUR     = NOW.getHours();
const GREETING = HOUR < 12 ? 'Chào buổi sáng' : HOUR < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

/* ─────────────────────────────────────────────────────
   COLOR PALETTE — Emerald Dark
───────────────────────────────────────────────────── */
const C = {
  emerald : '#10b981',
  teal    : '#14b8a6',
  amber   : '#f59e0b',
  sky     : '#38bdf8',
  violet  : '#a78bfa',
  rose    : '#fb7185',
  indigo  : '#818cf8',
  orange  : '#f97316',
};

/* ── StatCard ─────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, color }) => (
    <div className="sg-stat-card">
        <div className="sg-stat-stripe" style={{ background: color }}/>
        <div className="sg-stat-inner">
            <div className="sg-stat-icon" style={{ background: `${color}18`, color }}>
                {icon}
            </div>
            <div className="sg-stat-body">
                <div className="sg-stat-value">{value ?? '—'}</div>
                <div className="sg-stat-label">{label}</div>
                {sub && <div className="sg-stat-sub">{sub}</div>}
            </div>
        </div>
    </div>
);

/* ── ChartCard ────────────────────────────────────── */
const ChartCard = ({ title, badge, sub, height = 260, children, gridColumn = "span 6" }) => (
    <Box gridColumn={gridColumn} sx={{ display:'flex', flexDirection:'column' }}>
        <div className="sg-chart-card">
            <div className="sg-chart-header">
                <div className="sg-chart-title">{title}</div>
                {badge && <span className="sg-chart-badge">{badge}</span>}
            </div>
            {sub && <div className="sg-chart-sub">{sub}</div>}
            <Box height={height}>{children}</Box>
        </div>
    </Box>
);

/* ── ListCard (Trạng thái / Đơn hôm nay) ─────────── */
const ListCard = ({ title, badge, sub, children, gridColumn = "span 4" }) => (
    <Box gridColumn={gridColumn} sx={{ display:'flex', flexDirection:'column' }}>
        <div className="sg-chart-card" style={{ display:'flex', flexDirection:'column' }}>
            <div className="sg-chart-header">
                <div className="sg-chart-title">{title}</div>
                {badge !== undefined && <span className="sg-chart-badge">{badge}</span>}
            </div>
            {sub && <div className="sg-chart-sub">{sub}</div>}
            <div className="sg-list-wrap">{children}</div>
        </div>
    </Box>
);

/* ── RowItem ──────────────────────────────────────── */
const RowItem = ({ name, sub, value, right }) => (
    <div className="sg-row-item">
        <div className="sg-row-item-left">
            <div className="sg-row-item-name">{name}</div>
            {sub && <div className="sg-row-item-sub">{sub}</div>}
        </div>
        {value && <div className="sg-row-item-val">{value}</div>}
        {right}
    </div>
);

/* ── PageHeader ───────────────────────────────────── */
const PageHeader = ({ name }) => (
    <div className="sg-dash-header">
        <div>
            <div className="sg-dash-greeting">{GREETING}{name ? `, ${name}` : ''} 👋</div>
            <h1 className="sg-dash-title">Tổng quan <span>hệ thống</span></h1>
        </div>
        <div className="sg-dash-date">
            <CalendarTodayOutlinedIcon sx={{ fontSize: 15 }}/>
            {DATE_STR}
        </div>
    </div>
);

/* ── Empty ────────────────────────────────────────── */
const Empty = ({ text = 'Chưa có dữ liệu' }) => (
    <div className="sg-dash-empty">
        <div className="sg-dash-empty-icon">📋</div>
        {text}
    </div>
);

/* ── Loading skeleton ─────────────────────────────── */
const Loading = () => (
    <div className="sg-dash-loading">
        <div className="sg-skel-row sg-skel-row-4">
            {[0,1,2,3].map(i => (
                <div key={i} className="sg-skel-card">
                    <div className="sg-skel-line sg-skel-line-sm"/>
                    <div className="sg-skel-line sg-skel-line-lg"/>
                </div>
            ))}
        </div>
        <div className="sg-skel-row sg-skel-row-3">
            {[0,1,2].map(i => (
                <div key={i} className="sg-skel-card">
                    <div className="sg-skel-line sg-skel-line-sm"/>
                    <div className="sg-skel-line sg-skel-line-lg"/>
                </div>
            ))}
        </div>
        <div className="sg-skel-row sg-skel-row-2">
            <div className="sg-skel-chart"/>
            <div className="sg-skel-chart"/>
        </div>
    </div>
);

/* ── useDashboard ─────────────────────────────────── */
const useDashboard = () => {
    const [d, setD] = useState(null);
    useEffect(() => {
        const load = () =>
            fetchWithAuth(`${API_BASE}/dashboard`)
                .then(r => r.json()).then(setD).catch(console.error);
        load();
        const id = setInterval(load, 30000);
        return () => clearInterval(id);
    }, []);
    return d;
};

/* ════════════════════════════════════════════════════
   SuperAdmin Dashboard
════════════════════════════════════════════════════ */
const SuperAdminDash = ({ name }) => {
    const d = useDashboard();
    if (!d) return <Loading/>;

    const revenueChart = (d.revenueChart     || []).map(x => ({ name: x.date,        amount: x.revenue   }));
    const sportPie     = (d.bookingsBySport  || []).map(x => ({ id: x.sport,         label: x.sport, value: x.revenue }));
    const partnerBar   = (d.topPartners      || []).map(x => ({ id: x.partnerName,   value: x.revenue    }));

    return (
        <div className="sg-dash-page">
            <PageHeader name={name}/>

            <div className="sg-kpi-label">Chỉ số tổng quan</div>
            <div className="sg-stat-row">
                <StatCard icon={<TrendingUpOutlinedIcon sx={{fontSize:22}}/>}
                    label="Tổng doanh thu" value={fmtVnd(d.totalRevenue)}
                    sub="Toàn hệ thống" color={C.emerald}/>
                <StatCard icon={<ReceiptLongOutlinedIcon sx={{fontSize:22}}/>}
                    label="Tổng booking" value={fmt(d.totalBookings)}
                    sub="Lượt đặt sân" color={C.sky}/>
                <StatCard icon={<EventNoteOutlinedIcon sx={{fontSize:22}}/>}
                    label="Booking hôm nay" value={fmt(d.bookingsToday)}
                    sub="Ngày hôm nay" color={C.amber}/>
                <StatCard icon={<AccountBalanceWalletOutlinedIcon sx={{fontSize:22}}/>}
                    label="Doanh thu hôm nay" value={fmtVnd(d.revenueToday)}
                    sub="Ngày hôm nay" color={C.violet}/>
            </div>

            <div className="sg-stat-row-3">
                <StatCard icon={<PeopleOutlinedIcon sx={{fontSize:22}}/>}
                    label="Người dùng" value={fmt(d.totalUsers)}
                    sub="Tổng tài khoản" color={C.indigo}/>
                <StatCard icon={<StorefrontOutlinedIcon sx={{fontSize:22}}/>}
                    label="Đối tác hoạt động" value={`${fmt(d.activePartners)} / ${fmt(d.totalPartners)}`}
                    sub="Đang hoạt động" color={C.teal}/>
                <StatCard icon={<ReceiptLongOutlinedIcon sx={{fontSize:22}}/>}
                    label="Hoa hồng thu được" value={fmtVnd(d.commissionEarned)}
                    sub="Toàn hệ thống" color={C.rose}/>
            </div>

            <div className="sg-charts-label">Biểu đồ phân tích</div>
            <Box display="grid" gridTemplateColumns="repeat(12,1fr)" gap="16px">
                <ChartCard gridColumn="span 8"
                    title="Doanh thu 30 ngày gần nhất"
                    badge="30 ngày"
                    sub={`Tổng cộng: ${fmtVnd(d.totalRevenue)}`}
                    height={260}>
                    <LineChart data={revenueChart} isDashboard={true}/>
                </ChartCard>
                <ChartCard gridColumn="span 4"
                    title="Phân bổ theo môn thể thao"
                    height={260}>
                    <PieChart data={sportPie}/>
                </ChartCard>
                <ChartCard gridColumn="span 12"
                    title="Top 5 đối tác doanh thu cao nhất"
                    badge="Top 5"
                    height={220}>
                    <BarChart isDashboard={true} data={partnerBar}/>
                </ChartCard>
            </Box>
        </div>
    );
};

/* ════════════════════════════════════════════════════
   PartnerAdmin Dashboard
════════════════════════════════════════════════════ */
const PartnerAdminDash = ({ name }) => {
    const d = useDashboard();
    if (!d) return <Loading/>;

    const revenueChart = (d.revenueChart || []).map(x => ({ name: x.date, amount: x.revenue }));

    return (
        <div className="sg-dash-page">
            <PageHeader name={name}/>

            <div className="sg-kpi-label">Chỉ số kinh doanh</div>
            <div className="sg-stat-row">
                <StatCard icon={<TrendingUpOutlinedIcon sx={{fontSize:22}}/>}
                    label="Tổng doanh thu" value={fmtVnd(d.totalRevenue)}
                    sub="Toàn hệ thống" color={C.emerald}/>
                <StatCard icon={<AccountBalanceWalletOutlinedIcon sx={{fontSize:22}}/>}
                    label="Doanh thu tháng" value={fmtVnd(d.revenueThisMonth)}
                    sub="Tháng hiện tại" color={C.sky}/>
                <StatCard icon={<ReceiptLongOutlinedIcon sx={{fontSize:22}}/>}
                    label="Booking hôm nay" value={fmt(d.bookingsToday)}
                    sub="Ngày hôm nay" color={C.amber}/>
                <StatCard icon={<HourglassEmptyOutlinedIcon sx={{fontSize:22}}/>}
                    label="Chờ xác nhận" value={fmt(d.pendingBookings)}
                    sub="Cần xử lý" color={C.rose}/>
            </div>

            <div className="sg-stat-row-3">
                <StatCard icon={<BadgeOutlinedIcon sx={{fontSize:22}}/>}
                    label="Nhân viên" value={fmt(d.staffCount)}
                    sub="Toàn hệ thống" color={C.indigo}/>
                <StatCard icon={<SportsTennisOutlinedIcon sx={{fontSize:22}}/>}
                    label="Sân thể thao" value={fmt(d.totalCourts)}
                    sub={`${d.branchCount || 0} chi nhánh`} color={C.teal}/>
                <StatCard icon={<StarOutlinedIcon sx={{fontSize:22}}/>}
                    label="Đánh giá trung bình" value={`${(d.avgRating||0).toFixed(1)} ⭐`}
                    sub={`${fmt(d.reviewCount)} lượt`} color={C.amber}/>
            </div>

            <div className="sg-charts-label">Biểu đồ & chi nhánh</div>
            <Box display="grid" gridTemplateColumns="repeat(12,1fr)" gap="16px">
                <ChartCard gridColumn="span 8"
                    title="Doanh thu 30 ngày gần nhất"
                    badge="30 ngày"
                    sub={`Tổng: ${fmtVnd(d.totalRevenue)}`}
                    height={260}>
                    <LineChart data={revenueChart} isDashboard={true}/>
                </ChartCard>
                <ListCard gridColumn="span 4"
                    title="Chi nhánh"
                    badge={`${(d.branchSummaries||[]).length} CN`}
                    sub="Doanh thu từng chi nhánh">
                    {(d.branchSummaries||[]).length === 0
                        ? <Empty text="Chưa có chi nhánh"/>
                        : (d.branchSummaries||[]).map(b => (
                            <RowItem key={b.branchId} name={b.branchName} value={fmtVnd(b.revenue)}/>
                        ))
                    }
                </ListCard>
            </Box>
        </div>
    );
};

/* ════════════════════════════════════════════════════
   BranchManager Dashboard
════════════════════════════════════════════════════ */
const BranchManagerDash = ({ name }) => {
    const d = useDashboard();
    if (!d) return <Loading/>;

    const SL = { Pending:'Chờ xác nhận', Confirmed:'Đã xác nhận', CheckedIn:'Đang sân', Cancelled:'Đã hủy' };
    const SC = { Pending:'warning', Confirmed:'success', CheckedIn:'info', Cancelled:'error' };

    return (
        <div className="sg-dash-page">
            <PageHeader name={name}/>

            <div className="sg-kpi-label">Chỉ số hoạt động hôm nay</div>
            <div className="sg-stat-row">
                <StatCard icon={<AccountBalanceWalletOutlinedIcon sx={{fontSize:22}}/>}
                    label="Doanh thu hôm nay" value={fmtVnd(d.revenueToday)}
                    sub="Ngày hôm nay" color={C.emerald}/>
                <StatCard icon={<HourglassEmptyOutlinedIcon sx={{fontSize:22}}/>}
                    label="Chờ xác nhận" value={fmt(d.pending)}
                    sub="Cần xử lý" color={C.rose}/>
                <StatCard icon={<CheckCircleOutlineIcon sx={{fontSize:22}}/>}
                    label="Đã xác nhận" value={fmt(d.confirmed)}
                    sub="Chờ khách đến" color={C.sky}/>
                <StatCard icon={<EventNoteOutlinedIcon sx={{fontSize:22}}/>}
                    label="Đang sân" value={fmt(d.checkedIn)}
                    sub="Đang sử dụng" color={C.amber}/>
            </div>

            <div className="sg-charts-label">Trạng thái hoạt động</div>
            <Box display="grid" gridTemplateColumns="repeat(12,1fr)" gap="16px">
                <ListCard gridColumn="span 4"
                    title="Trạng thái sân"
                    badge={`${(d.courtStatuses||[]).length} sân`}
                    sub="Tình trạng hiện tại">
                    {(d.courtStatuses||[]).length === 0
                        ? <Empty text="Không có sân"/>
                        : (d.courtStatuses||[]).map(c => (
                            <RowItem key={c.courtId} name={c.courtName}
                                right={
                                    <Chip
                                        label={c.isOccupied ? 'Đang dùng' : c.status === 'Active' ? 'Trống' : c.status}
                                        size="small"
                                        color={c.isOccupied ? 'warning' : c.status === 'Active' ? 'success' : 'default'}
                                    />
                                }
                            />
                        ))
                    }
                </ListCard>
                <ListCard gridColumn="span 8"
                    title="Đơn đặt hôm nay"
                    badge={`${(d.upcoming||[]).length} đơn`}
                    sub="Danh sách theo thời gian">
                    {(d.upcoming||[]).length === 0
                        ? <Empty text="Chưa có đơn hôm nay"/>
                        : (d.upcoming||[]).map(b => (
                            <RowItem key={b.bookingId}
                                name={b.customerName}
                                sub={`${b.courtName} · ${b.startTime} – ${b.endTime}`}
                                right={<Chip label={SL[b.status]||b.status} size="small" color={SC[b.status]||'default'}/>}
                            />
                        ))
                    }
                </ListCard>
            </Box>
        </div>
    );
};

/* ════════════════════════════════════════════════════
   Staff Dashboard
════════════════════════════════════════════════════ */
const StaffDash = ({ name }) => {
    const d = useDashboard();
    if (!d) return <Loading/>;

    const SL = { Pending:'Chờ xác nhận', Confirmed:'Đã xác nhận', CheckedIn:'Đang sân', Cancelled:'Đã hủy' };
    const SC = { Pending:'warning', Confirmed:'success', CheckedIn:'info', Cancelled:'error' };
    const activeCourts = (d.courtStatuses||[]).filter(c => c.status === 'Active').length;

    return (
        <div className="sg-dash-page">
            <PageHeader name={name}/>

            <div className="sg-kpi-label">Chỉ số ca làm việc</div>
            <div className="sg-stat-row">
                <StatCard icon={<HourglassEmptyOutlinedIcon sx={{fontSize:22}}/>}
                    label="Chờ xác nhận" value={d.pending}
                    sub="Cần xử lý ngay" color={C.rose}/>
                <StatCard icon={<CheckCircleOutlineIcon sx={{fontSize:22}}/>}
                    label="Đã xác nhận" value={d.confirmed}
                    sub="Chờ khách đến" color={C.emerald}/>
                <StatCard icon={<EventNoteOutlinedIcon sx={{fontSize:22}}/>}
                    label="Đang sân" value={d.checkedIn}
                    sub="Đang sử dụng" color={C.sky}/>
                <StatCard icon={<SportsTennisOutlinedIcon sx={{fontSize:22}}/>}
                    label="Sân hoạt động" value={activeCourts}
                    sub="Đang mở cửa" color={C.amber}/>
            </div>

            <div className="sg-charts-label">Trạng thái hoạt động</div>
            <Box display="grid" gridTemplateColumns="repeat(12,1fr)" gap="16px">
                <ListCard gridColumn="span 4"
                    title="Trạng thái sân"
                    badge={`${(d.courtStatuses||[]).length} sân`}
                    sub="Tình trạng hiện tại">
                    {(d.courtStatuses||[]).length === 0
                        ? <Empty text="Không có sân"/>
                        : (d.courtStatuses||[]).map(c => (
                            <RowItem key={c.courtId} name={c.courtName}
                                right={
                                    <Chip
                                        label={c.isOccupied ? 'Đang dùng' : 'Trống'}
                                        size="small"
                                        color={c.isOccupied ? 'warning' : 'success'}
                                    />
                                }
                            />
                        ))
                    }
                </ListCard>
                <ListCard gridColumn="span 8"
                    title="Đơn đặt hôm nay"
                    badge={`${(d.upcoming||[]).length} đơn`}
                    sub="Danh sách theo thời gian">
                    {(d.upcoming||[]).length === 0
                        ? <Empty text="Chưa có đơn hôm nay"/>
                        : (d.upcoming||[]).map(b => (
                            <RowItem key={b.bookingId}
                                name={b.customerName}
                                sub={`${b.courtName} · ${b.startTime} – ${b.endTime}`}
                                right={<Chip label={SL[b.status]||b.status} size="small" color={SC[b.status]||'default'}/>}
                            />
                        ))
                    }
                </ListCard>
            </Box>
        </div>
    );
};

/* ════════════════════════════════════════════════════
   Entry point
════════════════════════════════════════════════════ */
const Dashboard = () => {
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};
    const role =
        decoded.role ||
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        (() => { try { return JSON.parse(sessionStorage.getItem('user')||'{}').role; } catch { return ''; } })() ||
        '';
    const name = decoded.fullName || decoded.email || '';

    if (role === 'SuperAdmin')    return <SuperAdminDash    name={name}/>;
    if (role === 'PartnerAdmin')  return <PartnerAdminDash  name={name}/>;
    if (role === 'BranchManager') return <BranchManagerDash name={name}/>;
    if (role === 'Staff')         return <StaffDash         name={name}/>;

    return (
        <div style={{ textAlign:'center', color:'#4b5563', padding:'80px 28px', background:'#030712', minHeight:'100vh' }}>
            Không có quyền truy cập dashboard.
        </div>
    );
};

export default Dashboard;
