import React, { useEffect, useState } from 'react';
import './header.css';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { toast } from 'react-toastify';
import userImg from '../../Assets/user.jpg';
import logo from '../../Assets/logo.svg';
import { IoMenuOutline, IoCloseOutline, IoHomeOutline, IoTimeOutline, IoCardOutline, IoLocationOutline, IoLogOutOutline, IoPersonOutline } from 'react-icons/io5';
import { API_BASE } from '../../config';

const Header = () => {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [userImage, setUserImage] = useState(userImg);
    const [username, setUsername] = useState('');
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (!token) { navigate('/signin'); return; }

        let decoded;
        try {
            decoded = jwtDecode(token);
        } catch {
            sessionStorage.clear();
            navigate('/');
            return;
        }

        const userId   = decoded.userId  || decoded.UserId  || '';
        const userName = decoded.fullName || decoded.Username || '';
        const role     = decoded.role     || decoded.Role     || '';
        if (role !== 'Customer') { sessionStorage.clear(); navigate('/'); return; }

        setUsername(userName || '');

        fetchWithAuth(`${API_BASE}/users/me`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.avatarUrl) setUserImage(data.avatarUrl);
                if (data?.loyaltyPoints != null) setBalance(data.loyaltyPoints);
            })
            .catch(() => {});
    }, [navigate]);

    const handleLogout = () => {
        sessionStorage.clear();
        toast.success('Đã đăng xuất!');
        navigate('/');
    };

    const navLinks = [
        { to: '/home', icon: <IoHomeOutline />, label: 'Trang chủ' },
        { to: '/bookingHistory', icon: <IoTimeOutline />, label: 'Lịch đặt sân' },
        { to: '/paymentHistory', icon: <IoCardOutline />, label: 'Lịch sử thanh toán' },
        { to: '/buyTime', icon: <IoCardOutline />, label: 'Nạp tiền' },
        { to: '/googleMap', icon: <IoLocationOutline />, label: 'Liên hệ' },
    ];

    return (
        <header className="sg-header">
            <div className="sg-header-inner">
                {/* Logo */}
                <Link to="/home" className="sg-header-logo">
                    <img src={logo} alt="SportSG" />
                    <span className="sg-header-brand">Sport<span>SG</span></span>
                </Link>

                {/* Desktop nav */}
                <nav className="sg-header-nav">
                    {navLinks.map(link => (
                        <Link key={link.to} to={link.to} className="sg-header-link">
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Right: balance + avatar */}
                <div className="sg-header-right">
                    <div className="sg-balance-chip">
                        <span className="sg-balance-label">Số dư</span>
                        <span className="sg-balance-value">{balance.toLocaleString('vi-VN')}đ</span>
                    </div>

                    <Link to="/viewInfo" className="sg-header-avatar-wrap">
                        <img
                            src={userImage}
                            alt={username}
                            className="sg-header-avatar"
                            onError={(e) => { e.target.src = userImg; }}
                        />
                        <span className="sg-header-username">{username}</span>
                    </Link>

                    <button className="sg-header-logout" onClick={handleLogout} title="Đăng xuất">
                        <IoLogOutOutline size={20} />
                    </button>

                    {/* Mobile menu toggle */}
                    <button
                        className="sg-header-menu-btn"
                        onClick={() => setMenuOpen(o => !o)}
                    >
                        {menuOpen ? <IoCloseOutline size={26} /> : <IoMenuOutline size={26} />}
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {menuOpen && (
                <div className="sg-header-mobile-menu">
                    {navLinks.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className="sg-mobile-link"
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.icon}
                            <span>{link.label}</span>
                        </Link>
                    ))}
                    <div className="sg-mobile-divider" />
                    <Link to="/viewInfo" className="sg-mobile-link" onClick={() => setMenuOpen(false)}>
                        <IoPersonOutline />
                        <span>Hồ sơ ({username})</span>
                    </Link>
                    <button className="sg-mobile-logout" onClick={handleLogout}>
                        <IoLogOutOutline />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;
