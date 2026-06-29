import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme, Chip } from "@mui/material";
import { tokens } from "../../theme";
import { fetchWithAuth } from "../../Components/fetchWithAuth/fetchWithAuth";
import { jwtDecode } from "jwt-decode";
import { API_BASE } from "../../config";
import LineChart from "../../Components/LineChart";
import BarChart from "../../Components/BarChart";
import PieChart from '../../Components/PieChart';
import './dashboard.css';

import PeopleOutlinedIcon       from "@mui/icons-material/PeopleOutlined";
import StorefrontOutlinedIcon   from "@mui/icons-material/StorefrontOutlined";
import SportsTennisOutlinedIcon from "@mui/icons-material/SportsTennisOutlined";
import TrendingUpOutlinedIcon   from "@mui/icons-material/TrendingUpOutlined";
import ReceiptLongOutlinedIcon  from "@mui/icons-material/ReceiptLongOutlined";
import StarOutlinedIcon         from "@mui/icons-material/StarOutlined";
import EventNoteOutlinedIcon    from "@mui/icons-material/EventNoteOutlined";
import CheckCircleOutlineIcon   from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import BadgeOutlinedIcon        from "@mui/icons-material/BadgeOutlined";

const fmt = n => (n ?? 0).toLocaleString('vi-VN');
const fmtVnd = n => `${fmt(n)} ₫`;

const StatCard = ({ icon, label, value, sub, color }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    return (
        <div className={`sg-stat-card${isDark ? ' dark' : ''}`}>
            <div className="sg-stat-icon" style={{ background: `${color}22`, color }}>{icon}</div>
            <div className="sg-stat-body">
                <div className="sg-stat-value">{value}</div>
                <div className="sg-stat-label">{label}</div>
                {sub && <div className="sg-stat-sub">{sub}</div>}
            </div>
        </div>
    );
};

const ChartCard = ({ title, sub, height = 260, children, gridColumn = "span 6" }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const colors = tokens(theme.palette.mode);
    return (
        <Box gridColumn={gridColumn} sx={{
            background: isDark ? colors.primary[400] : '#fff',
            borderRadius: '14px', p: '20px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
            boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
        }}>
            <Typography fontWeight={700} fontSize={14} mb={0.5}>{title}</Typography>
            {sub && <Typography fontSize={12} color="text.secondary" mb={2}>{sub}</Typography>}
            <Box height={height}>{children}</Box>
        </Box>
    );
};

// ── SuperAdmin ─────────────────────────────────────────────────
const SuperAdminDash = () => {
    const [d, setD] = useState(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    useEffect(() => {
        fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error);
        const id = setInterval(() =>
            fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error),
        30000);
        return () => clearInterval(id);
    }, []);

    if (!d) return <Box p={3}><Typography>Đang tải...</Typography></Box>;

    const revenueChart = (d.revenueChart || []).map(x => ({ name: x.date, amount: x.revenue }));
    const sportPie     = (d.bookingsBySport || []).map(x => ({ id: x.sport, label: x.sport, value: x.revenue }));
    const partnerBar   = (d.topPartners || []).map(x => ({ id: x.partnerName, value: x.revenue }));

    return (
        <Box sx={{ p: '24px', minHeight: '100vh', background: isDark ? '#141b2d' : '#f8fafc' }}>
            <div className="sg-stat-row">
                <StatCard icon={<TrendingUpOutlinedIcon sx={{fontSize:26}}/>} label="Tổng doanh thu" value={fmtVnd(d.totalRevenue)} sub="Toàn hệ thống" color="#16a34a"/>
                <StatCard icon={<ReceiptLongOutlinedIcon sx={{fontSize:26}}/>} label="Tổng booking" value={fmt(d.totalBookings)} sub="Toàn hệ thống" color="#0ea5e9"/>
                <StatCard icon={<EventNoteOutlinedIcon sx={{fontSize:26}}/>} label="Booking hôm nay" value={fmt(d.bookingsToday)} sub="Ngày hôm nay" color="#f97316"/>
                <StatCard icon={<TrendingUpOutlinedIcon sx={{fontSize:26}}/>} label="Doanh thu hôm nay" value={fmtVnd(d.revenueToday)} sub="Ngày hôm nay" color="#eab308"/>
            </div>
            <div className="sg-stat-row-3">
                <StatCard icon={<PeopleOutlinedIcon sx={{fontSize:26}}/>} label="Người dùng" value={fmt(d.totalUsers)} sub="Tổng tài khoản" color="#6366f1"/>
                <StatCard icon={<StorefrontOutlinedIcon sx={{fontSize:26}}/>} label="Đối tác" value={`${fmt(d.activePartners)}/${fmt(d.totalPartners)}`} sub="Đang hoạt động" color="#a855f7"/>
                <StatCard icon={<ReceiptLongOutlinedIcon sx={{fontSize:26}}/>} label="Hoa hồng thu được" value={fmtVnd(d.commissionEarned)} sub="Toàn hệ thống" color="#ef4444"/>
            </div>
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px" mt={2}>
                <ChartCard gridColumn="span 8" title="Doanh thu 30 ngày" sub={fmtVnd(d.totalRevenue)}>
                    <LineChart data={revenueChart} isDashboard={true}/>
                </ChartCard>
                <ChartCard gridColumn="span 4" title="Doanh thu theo môn thể thao">
                    <PieChart data={sportPie}/>
                </ChartCard>
                <ChartCard gridColumn="span 12" title="Top 5 đối tác doanh thu cao nhất" height={220}>
                    <BarChart isDashboard={true} data={partnerBar}/>
                </ChartCard>
            </Box>
        </Box>
    );
};

// ── PartnerAdmin ───────────────────────────────────────────────
const PartnerAdminDash = () => {
    const [d, setD] = useState(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const colors = tokens(theme.palette.mode);
    const cardBg = isDark ? colors.primary[400] : '#fff';
    const border = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';

    useEffect(() => {
        fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error);
        const id = setInterval(() =>
            fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error),
        30000);
        return () => clearInterval(id);
    }, []);

    if (!d) return <Box p={3}><Typography>Đang tải...</Typography></Box>;

    const revenueChart = (d.revenueChart || []).map(x => ({ name: x.date, amount: x.revenue }));

    return (
        <Box sx={{ p: '24px', minHeight: '100vh', background: isDark ? '#141b2d' : '#f8fafc' }}>
            <div className="sg-stat-row">
                <StatCard icon={<TrendingUpOutlinedIcon sx={{fontSize:26}}/>} label="Tổng doanh thu" value={fmtVnd(d.totalRevenue)} sub="Toàn hệ thống" color="#16a34a"/>
                <StatCard icon={<TrendingUpOutlinedIcon sx={{fontSize:26}}/>} label="Doanh thu tháng này" value={fmtVnd(d.revenueThisMonth)} sub="Tháng hiện tại" color="#0ea5e9"/>
                <StatCard icon={<ReceiptLongOutlinedIcon sx={{fontSize:26}}/>} label="Booking hôm nay" value={fmt(d.bookingsToday)} sub="Ngày hôm nay" color="#f97316"/>
                <StatCard icon={<HourglassEmptyOutlinedIcon sx={{fontSize:26}}/>} label="Chờ xác nhận" value={fmt(d.pendingBookings)} sub="Cần xử lý" color="#ef4444"/>
            </div>
            <div className="sg-stat-row-3">
                <StatCard icon={<BadgeOutlinedIcon sx={{fontSize:26}}/>} label="Nhân viên" value={fmt(d.staffCount)} sub="Toàn hệ thống" color="#6366f1"/>
                <StatCard icon={<SportsTennisOutlinedIcon sx={{fontSize:26}}/>} label="Sân thể thao" value={fmt(d.totalCourts)} sub={`${d.branchCount} chi nhánh`} color="#f97316"/>
                <StatCard icon={<StarOutlinedIcon sx={{fontSize:26}}/>} label="Đánh giá TB" value={`${(d.avgRating||0).toFixed(1)} ⭐`} sub={`${fmt(d.reviewCount)} lượt`} color="#eab308"/>
            </div>
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px" mt={2}>
                <ChartCard gridColumn="span 8" title="Doanh thu 30 ngày" sub={fmtVnd(d.totalRevenue)}>
                    <LineChart data={revenueChart} isDashboard={true}/>
                </ChartCard>
                <ChartCard gridColumn="span 4" title="Chi nhánh" height={220}>
                    <Box display="flex" flexDirection="column" gap={1} mt={1}>
                        {(d.branchSummaries||[]).map(b => (
                            <Box key={b.branchId} display="flex" justifyContent="space-between" alignItems="center"
                                sx={{ p:'8px 12px', borderRadius:'8px', background: isDark?'rgba(255,255,255,0.04)':'#f9fafb', border:`1px solid ${border}` }}>
                                <Typography fontSize={13} fontWeight={600}>{b.branchName}</Typography>
                                <Typography fontSize={12} color="#16a34a">{fmtVnd(b.revenue)}</Typography>
                            </Box>
                        ))}
                    </Box>
                </ChartCard>
            </Box>
        </Box>
    );
};

// ── BranchManager ──────────────────────────────────────────────
const BranchManagerDash = () => {
    const [d, setD] = useState(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const colors = tokens(theme.palette.mode);
    const cardBg = isDark ? colors.primary[400] : '#fff';
    const border = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';

    useEffect(() => {
        fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error);
        const id = setInterval(() =>
            fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error),
        30000);
        return () => clearInterval(id);
    }, []);

    if (!d) return <Box p={3}><Typography>Đang tải...</Typography></Box>;

    const STATUS_LABEL = { Pending:'Chờ xác nhận', Confirmed:'Đã xác nhận', CheckedIn:'Đang sân', Cancelled:'Đã hủy' };
    const STATUS_COLOR = { Pending:'warning', Confirmed:'success', CheckedIn:'info', Cancelled:'error' };

    return (
        <Box sx={{ p: '24px', minHeight: '100vh', background: isDark ? '#141b2d' : '#f8fafc' }}>
            <div className="sg-stat-row">
                <StatCard icon={<TrendingUpOutlinedIcon sx={{fontSize:26}}/>} label="Doanh thu hôm nay" value={fmtVnd(d.revenueToday)} color="#16a34a"/>
                <StatCard icon={<HourglassEmptyOutlinedIcon sx={{fontSize:26}}/>} label="Chờ xác nhận" value={fmt(d.pending)} color="#ef4444"/>
                <StatCard icon={<CheckCircleOutlineIcon sx={{fontSize:26}}/>} label="Đã xác nhận" value={fmt(d.confirmed)} color="#0ea5e9"/>
                <StatCard icon={<EventNoteOutlinedIcon sx={{fontSize:26}}/>} label="Đang sân" value={fmt(d.checkedIn)} color="#f97316"/>
            </div>
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px" mt={2}>
                {/* Trạng thái sân */}
                <Box gridColumn="span 4" sx={{ background: cardBg, borderRadius:'14px', p:'20px', border:`1px solid ${border}` }}>
                    <Typography fontWeight={700} fontSize={14} mb={2}>Trạng thái sân</Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                        {(d.courtStatuses||[]).map(c => (
                            <Box key={c.courtId} display="flex" justifyContent="space-between" alignItems="center">
                                <Typography fontSize={13}>{c.courtName}</Typography>
                                <Chip label={c.isOccupied ? 'Đang dùng' : c.status} size="small"
                                    color={c.isOccupied ? 'warning' : c.status === 'Active' ? 'success' : 'default'}/>
                            </Box>
                        ))}
                    </Box>
                </Box>
                {/* Đơn sắp tới */}
                <Box gridColumn="span 8" sx={{ background: cardBg, borderRadius:'14px', p:'20px', border:`1px solid ${border}` }}>
                    <Typography fontWeight={700} fontSize={14} mb={2}>Đơn đặt hôm nay</Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                        {(d.upcoming||[]).length === 0
                            ? <Typography fontSize={13} color="text.secondary" textAlign="center" py={3}>Chưa có đơn</Typography>
                            : (d.upcoming||[]).map(b => (
                                <Box key={b.bookingId} display="flex" justifyContent="space-between" alignItems="center"
                                    sx={{ p:'10px 12px', borderRadius:'8px', background: isDark?'rgba(255,255,255,0.04)':'#f9fafb', border:`1px solid ${border}` }}>
                                    <Box>
                                        <Typography fontSize={13} fontWeight={600}>{b.customerName}</Typography>
                                        <Typography fontSize={11} color="text.secondary">{b.courtName} · {b.startTime} – {b.endTime}</Typography>
                                    </Box>
                                    <Chip label={STATUS_LABEL[b.status]||b.status} size="small" color={STATUS_COLOR[b.status]||'default'}/>
                                </Box>
                            ))
                        }
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

// ── Staff ──────────────────────────────────────────────────────
const StaffDash = () => {
    const [d, setD] = useState(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const colors = tokens(theme.palette.mode);
    const cardBg = isDark ? colors.primary[400] : '#fff';
    const border = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';

    useEffect(() => {
        fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error);
        const id = setInterval(() =>
            fetchWithAuth(`${API_BASE}/dashboard`).then(r => r.json()).then(setD).catch(console.error),
        30000);
        return () => clearInterval(id);
    }, []);

    if (!d) return <Box p={3}><Typography>Đang tải...</Typography></Box>;

    const STATUS_LABEL = { Pending:'Chờ xác nhận', Confirmed:'Đã xác nhận', CheckedIn:'Đang sân', Cancelled:'Đã hủy' };
    const STATUS_COLOR = { Pending:'warning', Confirmed:'success', CheckedIn:'info', Cancelled:'error' };

    return (
        <Box sx={{ p: '24px', minHeight: '100vh', background: isDark ? '#141b2d' : '#f8fafc' }}>
            <div className="sg-stat-row">
                <StatCard icon={<HourglassEmptyOutlinedIcon sx={{fontSize:26}}/>} label="Chờ xác nhận" value={d.pending} sub="Cần xử lý ngay" color="#ef4444"/>
                <StatCard icon={<CheckCircleOutlineIcon sx={{fontSize:26}}/>} label="Đã xác nhận" value={d.confirmed} sub="Chờ khách đến" color="#16a34a"/>
                <StatCard icon={<EventNoteOutlinedIcon sx={{fontSize:26}}/>} label="Đang sân" value={d.checkedIn} sub="Đang sử dụng" color="#0ea5e9"/>
                <StatCard icon={<SportsTennisOutlinedIcon sx={{fontSize:26}}/>} label="Sân hoạt động" value={(d.courtStatuses||[]).filter(c=>c.status==='Active').length} sub="Đang mở cửa" color="#f97316"/>
            </div>
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px" mt={2}>
                <Box gridColumn="span 4" sx={{ background: cardBg, borderRadius:'14px', p:'20px', border:`1px solid ${border}` }}>
                    <Typography fontWeight={700} fontSize={14} mb={2}>Trạng thái sân</Typography>
                    {(d.courtStatuses||[]).map(c => (
                        <Box key={c.courtId} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography fontSize={13}>{c.courtName}</Typography>
                            <Chip label={c.isOccupied ? 'Đang dùng' : 'Trống'} size="small" color={c.isOccupied ? 'warning' : 'success'}/>
                        </Box>
                    ))}
                </Box>
                <Box gridColumn="span 8" sx={{ background: cardBg, borderRadius:'14px', p:'20px', border:`1px solid ${border}` }}>
                    <Typography fontWeight={700} fontSize={14} mb={2}>Đơn đặt hôm nay</Typography>
                    {(d.upcoming||[]).length === 0
                        ? <Typography fontSize={13} color="text.secondary" textAlign="center" py={3}>Chưa có đơn</Typography>
                        : (d.upcoming||[]).map(b => (
                            <Box key={b.bookingId} display="flex" justifyContent="space-between" alignItems="center"
                                sx={{ p:'10px 12px', mb:1, borderRadius:'8px', background: isDark?'rgba(255,255,255,0.04)':'#f9fafb', border:`1px solid ${border}` }}>
                                <Box>
                                    <Typography fontSize={13} fontWeight={600}>{b.customerName}</Typography>
                                    <Typography fontSize={11} color="text.secondary">{b.courtName} · {b.startTime} – {b.endTime}</Typography>
                                </Box>
                                <Chip label={STATUS_LABEL[b.status]||b.status} size="small" color={STATUS_COLOR[b.status]||'default'}/>
                            </Box>
                        ))
                    }
                </Box>
            </Box>
        </Box>
    );
};

// ── Entry point ────────────────────────────────────────────────
const Dashboard = () => {
    const token   = sessionStorage.getItem('token');
    const decoded = token ? jwtDecode(token) : {};

    // ASP.NET Core JWT có thể dùng nhiều tên claim khác nhau cho role
    const role =
        decoded.role ||
        decoded.Role ||
        decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        (() => { try { return JSON.parse(sessionStorage.getItem('user') || '{}').role; } catch { return ''; } })() ||
        '';

    if (role === 'SuperAdmin')    return <SuperAdminDash />;
    if (role === 'PartnerAdmin')  return <PartnerAdminDash />;
    if (role === 'BranchManager') return <BranchManagerDash />;
    if (role === 'Staff')         return <StaffDash />;
    return <Box p={3}><Typography>Không có quyền truy cập dashboard. (role: "{role}")</Typography></Box>;
};

export default Dashboard;
