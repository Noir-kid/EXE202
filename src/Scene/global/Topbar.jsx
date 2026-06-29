import { useContext, useState } from 'react';
import { ColorModeContext, tokens } from '../../theme';
import { useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import './sidebar.css';

import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { jwtDecode } from 'jwt-decode';

const PAGE_TITLES = {
    dashboard: 'Dashboard',
    user: 'Quản lý người dùng',
    branch: 'Quản lý chi nhánh',
    court: 'Quản lý sân',
    discount: 'Khuyến mãi',
    timeSlot: 'Khung giờ hoạt động',
    timeManage: 'Lịch sân',
    payment: 'Lịch sử thanh toán',
    feedback: 'Phản hồi khách hàng',
    staffFeedback: 'Phản hồi khách hàng',
    bar: 'Biểu đồ cột',
    line: 'Biểu đồ đường',
    pie: 'Biểu đồ tròn',
};

const Topbar = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const colorMode = useContext(ColorModeContext);
    const location = useLocation();
    const [search, setSearch] = useState('');
    const isDark = theme.palette.mode === 'dark';

    const token = sessionStorage.getItem('token');
    let role = '', username = '';
    try {
        const dec = jwtDecode(token);
        role = dec.Role || '';
        username = dec.Username || dec.UserName || dec.sub || role;
    } catch { /* ignore */ }

    const segment = location.pathname.split('/').filter(Boolean).pop() || 'dashboard';
    const pageTitle = PAGE_TITLES[segment] || segment;

    return (
        <div className={`sg-topbar${isDark ? ' dark' : ''}`}>
            {/* Left: page title */}
            <div className="sg-topbar-left">
                <span className="sg-topbar-title">{pageTitle}</span>
            </div>

            {/* Center: search */}
            <div className="sg-topbar-search">
                <SearchIcon />
                <input
                    placeholder="Tìm kiếm..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Right: icons + user */}
            <div className="sg-topbar-right">
                {colorMode.toggleColorMode && (
                    <button className="sg-topbar-icon-btn" onClick={colorMode.toggleColorMode} title="Đổi giao diện">
                        {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 20 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 20 }} />}
                    </button>
                )}
                <button className="sg-topbar-icon-btn" title="Thông báo">
                    <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
                    <span className="sg-notif-dot" />
                </button>
                <button className="sg-topbar-icon-btn" title="Cài đặt">
                    <SettingsOutlinedIcon sx={{ fontSize: 20 }} />
                </button>

                <div className="sg-topbar-user">
                    <div className="sg-topbar-avatar">{role.charAt(0)}</div>
                    <div className="sg-topbar-user-info">
                        <div className="sg-topbar-user-name">{username}</div>
                        <div className="sg-topbar-user-role">{role}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Topbar;
