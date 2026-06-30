import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './sidebar.css';
import { jwtDecode } from 'jwt-decode';

import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

const PAGE_TITLES = {
    dashboard:    'Dashboard',
    user:         'Quản lý người dùng',
    partner:      'Quản lý đối tác',
    branch:       'Quản lý chi nhánh',
    court:        'Quản lý sân',
    discount:     'Khuyến mãi',
    timeSlot:     'Khung giờ hoạt động',
    timeManage:   'Lịch sân',
    payment:      'Lịch sử thanh toán',
    feedback:     'Phản hồi khách hàng',
    staffFeedback:'Phản hồi khách hàng',
    booking:      'Quản lý đặt sân',
    staff:        'Nhân viên',
    bar:          'Biểu đồ cột',
    line:         'Biểu đồ đường',
    pie:          'Biểu đồ tròn',
};

const ROLE_VN = {
    SuperAdmin:    'Quản trị viên',
    PartnerAdmin:  'Chủ sân',
    BranchManager: 'Quản lý CN',
    Staff:         'Nhân viên',
};

const Topbar = () => {
    const location = useLocation();
    const [search, setSearch] = useState('');

    const token = sessionStorage.getItem('token');
    let role = '', fullName = '';
    try {
        const dec = jwtDecode(token);
        role     = dec.role || dec['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
        fullName = dec.fullName || dec.email || dec.sub || '';
    } catch { /* ignore */ }

    const segment = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    const pageTitle = PAGE_TITLES[segment] || segment;

    const initials = fullName
        ? fullName.trim().split(/\s+/).map(w => w[0]).slice(-2).join('').toUpperCase()
        : role.charAt(0).toUpperCase();

    return (
        <div className="sg-topbar">
            {/* Page title */}
            <div className="sg-topbar-left">
                <span className="sg-topbar-title">{pageTitle}</span>
            </div>

            {/* Search */}
            <div className="sg-topbar-search">
                <SearchIcon sx={{ fontSize: 17 }} />
                <input
                    placeholder="Tìm kiếm..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Right actions */}
            <div className="sg-topbar-right">
                <button className="sg-topbar-icon-btn" title="Thông báo">
                    <NotificationsOutlinedIcon sx={{ fontSize: 19 }} />
                    <span className="sg-notif-dot" />
                </button>
                <button className="sg-topbar-icon-btn" title="Cài đặt">
                    <SettingsOutlinedIcon sx={{ fontSize: 19 }} />
                </button>

                <div className="sg-topbar-user">
                    <div className="sg-topbar-avatar">{initials}</div>
                    <div className="sg-topbar-user-info">
                        <div className="sg-topbar-user-name">{fullName}</div>
                        <div className="sg-topbar-user-role">{ROLE_VN[role] || role}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
