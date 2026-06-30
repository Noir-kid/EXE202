import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import './sidebar.css';

import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PaymentIcon from '@mui/icons-material/Payment';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import DiscountIcon from '@mui/icons-material/Discount';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';

import logo from '../../Assets/logo.svg';

const NavItem = ({ to, icon, label, collapsed }) => {
    const location = useLocation();
    const isActive = location.pathname.includes(to);
    return (
        <Link
            to={to}
            className={`sg-nav-item${isActive ? ' sg-nav-active' : ''}`}
            title={collapsed ? label : ''}
        >
            <span className="sg-nav-icon">{icon}</span>
            <span className="sg-nav-label">{label}</span>
        </Link>
    );
};

const ROLE_LABELS = {
    SuperAdmin:    'Quản trị viên',
    PartnerAdmin:  'Chủ sân',
    BranchManager: 'Quản lý CN',
    Staff:         'Nhân viên sân',
};

const ROLE_CSS = {
    SuperAdmin:    'sg-role-admin',
    PartnerAdmin:  'sg-role-owner',
    BranchManager: 'sg-role-owner',
    Staff:         'sg-role-staff',
};

const Sidebar = ({ collapsed, setCollapsed }) => {
    const [role, setRole] = useState('');
    const [username, setUsername] = useState('');
    const [branchId, setBranchId] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) { navigate('/'); return; }
        try {
            const dec = jwtDecode(token);
            const r = dec.role || dec['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
            setRole(r);
            setUsername(dec.fullName || dec.email || dec.sub || r);
            setBranchId(dec.branchId || dec.BranchId || '');
            if (!['SuperAdmin', 'PartnerAdmin', 'BranchManager', 'Staff'].includes(r)) {
                sessionStorage.clear();
                navigate('/');
            }
        } catch {
            sessionStorage.clear();
            navigate('/');
        }
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.clear();
        toast.success('Đã đăng xuất!');
        navigate('/');
    };

    const isAdmin = role === 'SuperAdmin';
    const isOwner = role === 'PartnerAdmin' || role === 'BranchManager';
    const isStaff = role === 'Staff';

    const prefix = isAdmin ? '/admin' : isOwner ? '/owner' : '/staff';

    return (
        <aside className={`sg-sidebar${collapsed ? ' collapsed' : ''}`}>
            {/* Logo */}
            <div className="sg-sidebar-logo" style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}>
                <img src={logo} alt="SportSG" />
                {!collapsed && (
                    <div className="sg-brand-text">
                        <div className="sg-brand-name">Sport<span>SG</span></div>
                        <div className="sg-brand-sub">
                            {isAdmin ? 'Admin Portal' : isOwner ? (role === 'BranchManager' ? 'Manager Portal' : 'Owner Portal') : 'Staff Portal'}
                        </div>
                    </div>
                )}
                <button
                    className="sg-toggle-btn"
                    onClick={() => setCollapsed(c => !c)}
                    title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                    {collapsed ? <ChevronRightIcon sx={{ fontSize: 14 }} /> : <ChevronLeftIcon sx={{ fontSize: 14 }} />}
                </button>
            </div>

            {/* User info */}
            <div className="sg-user-section">
                <div className="sg-user-avatar">
                    {role.charAt(0)}
                </div>
                {!collapsed && (
                    <div className="sg-user-info">
                        <div className={`sg-user-role-badge ${ROLE_CSS[role] || 'sg-role-staff'}`}>
                            {ROLE_LABELS[role] || role}
                        </div>
                        <div className="sg-user-name">{username}</div>
                        {(isOwner || isStaff) && branchId && (
                            <div className="sg-user-branch">🏟️ {branchId}</div>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sg-nav">

                {/* ===== ADMIN MENU ===== */}
                {isAdmin && (
                    <>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Tổng quan</div>}
                            <NavItem to="/admin/dashboard" icon={<HomeOutlinedIcon sx={{ fontSize: 19 }} />} label="Dashboard" collapsed={collapsed} />
                        </div>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Quản lý</div>}
                            <NavItem to="/admin/user" icon={<PeopleOutlinedIcon sx={{ fontSize: 19 }} />} label="Người dùng" collapsed={collapsed} />
                            <NavItem to="/admin/partner" icon={<HandshakeOutlinedIcon sx={{ fontSize: 19 }} />} label="Đối tác" collapsed={collapsed} />
                            <NavItem to="/admin/branch" icon={<ContactsOutlinedIcon sx={{ fontSize: 19 }} />} label="Chi nhánh" collapsed={collapsed} />
                            <NavItem to="/admin/court" icon={<ReceiptOutlinedIcon sx={{ fontSize: 19 }} />} label="Sân thể thao" collapsed={collapsed} />
                        </div>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Vận hành</div>}
                            <NavItem to="/admin/discount" icon={<DiscountIcon sx={{ fontSize: 19 }} />} label="Khuyến mãi" collapsed={collapsed} />
                            <NavItem to="/admin/timeSlot" icon={<AccessAlarmIcon sx={{ fontSize: 19 }} />} label="Khung giờ" collapsed={collapsed} />
                            <NavItem to="/admin/timeManage" icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 19 }} />} label="Lịch sân" collapsed={collapsed} />
                            <NavItem to="/admin/payment" icon={<PaymentIcon sx={{ fontSize: 19 }} />} label="Thanh toán" collapsed={collapsed} />
                            <NavItem to="/admin/feedback" icon={<FeedbackOutlinedIcon sx={{ fontSize: 19 }} />} label="Phản hồi" collapsed={collapsed} />
                        </div>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Báo cáo</div>}
                            <NavItem to="/admin/bar" icon={<BarChartOutlinedIcon sx={{ fontSize: 19 }} />} label="Biểu đồ cột" collapsed={collapsed} />
                            <NavItem to="/admin/line" icon={<TimelineOutlinedIcon sx={{ fontSize: 19 }} />} label="Biểu đồ đường" collapsed={collapsed} />
                        </div>
                    </>
                )}

                {/* ===== OWNER (CHỦ SÂN) MENU ===== */}
                {isOwner && (
                    <>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Tổng quan</div>}
                            <NavItem to="/owner/dashboard" icon={<HomeOutlinedIcon sx={{ fontSize: 19 }} />} label="Dashboard" collapsed={collapsed} />
                        </div>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Quản lý</div>}
                            <NavItem to="/owner/staff" icon={<BadgeOutlinedIcon sx={{ fontSize: 19 }} />} label="Nhân viên" collapsed={collapsed} />
                            <NavItem to="/owner/court" icon={<ReceiptOutlinedIcon sx={{ fontSize: 19 }} />} label="Sân thể thao" collapsed={collapsed} />
                        </div>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Vận hành</div>}
                            <NavItem to="/owner/timeSlot" icon={<AccessAlarmIcon sx={{ fontSize: 19 }} />} label="Khung giờ" collapsed={collapsed} />
                            <NavItem to="/owner/timeManage" icon={<CalendarTodayOutlinedIcon sx={{ fontSize: 19 }} />} label="Lịch sân" collapsed={collapsed} />
                            <NavItem to="/owner/payment" icon={<PaymentIcon sx={{ fontSize: 19 }} />} label="Thanh toán" collapsed={collapsed} />
                            <NavItem to="/owner/staffFeedback" icon={<FeedbackOutlinedIcon sx={{ fontSize: 19 }} />} label="Phản hồi" collapsed={collapsed} />
                        </div>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Báo cáo</div>}
                            <NavItem to="/owner/bar" icon={<BarChartOutlinedIcon sx={{ fontSize: 19 }} />} label="Biểu đồ cột" collapsed={collapsed} />
                            <NavItem to="/owner/line" icon={<TimelineOutlinedIcon sx={{ fontSize: 19 }} />} label="Biểu đồ đường" collapsed={collapsed} />
                        </div>
                    </>
                )}

                {/* ===== STAFF (NHÂN VIÊN) MENU ===== */}
                {isStaff && (
                    <>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Tổng quan</div>}
                            <NavItem to="/staff/dashboard" icon={<HomeOutlinedIcon sx={{ fontSize: 19 }} />} label="Dashboard" collapsed={collapsed} />
                        </div>
                        <div className="sg-nav-section">
                            {!collapsed && <div className="sg-nav-section-title">Vận hành</div>}
                            <NavItem to="/staff/booking" icon={<EventNoteOutlinedIcon sx={{ fontSize: 19 }} />} label="Quản lý đặt sân" collapsed={collapsed} />
                            <NavItem to="/staff/court" icon={<ReceiptOutlinedIcon sx={{ fontSize: 19 }} />} label="Sân thể thao" collapsed={collapsed} />
                            <NavItem to="/staff/staffFeedback" icon={<FeedbackOutlinedIcon sx={{ fontSize: 19 }} />} label="Phản hồi" collapsed={collapsed} />
                        </div>
                    </>
                )}
            </nav>

            {/* Footer */}
            <div className="sg-sidebar-footer">
                <button className="sg-logout-btn" onClick={handleLogout} title={collapsed ? 'Đăng xuất' : ''}>
                    <LogoutIcon className="sg-logout-icon" sx={{ fontSize: 18 }} />
                    <span className="sg-logout-label">Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
