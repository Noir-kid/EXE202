import React from 'react';
import './navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { IoNotificationsOutline } from 'react-icons/io5';
import { FiUser } from 'react-icons/fi';
import { jwtDecode } from 'jwt-decode';
import logo from '../../Assets/logo.svg';

const Navbar = () => {
    const navigate = useNavigate();
    const token = sessionStorage.getItem('token');
    let isLoggedIn = false;
    let role = '';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            isLoggedIn = true;
            role = decoded.Role;
        } catch (e) {
            sessionStorage.removeItem('token');
        }
    }

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/');
    };

    const handleDashboard = () => {
        if (role === 'Admin') navigate('/admin');
        else if (role === 'Staff') navigate('/staff');
        else navigate('/viewInfo');
    };

    return (
        <nav className="sg-navbar">
            <div className="sg-navbar-inner">
                <Link to="/" className="sg-logo">
                    <img src={logo} alt="SportSG" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
                    <span className="sg-logo-text">SportSG</span>
                </Link>

                <div className="sg-nav-links">
                    <Link to="/" className="sg-nav-link">Trang chủ</Link>
                    <Link to="/findCourt" className="sg-nav-link">Đặt sân</Link>
                    <a href="#contacts" className="sg-nav-link">Liên hệ</a>
                </div>

                <div className="sg-nav-actions">
                    <button className="sg-icon-btn" title="Thông báo">
                        <IoNotificationsOutline size={22} />
                    </button>

                    {isLoggedIn ? (
                        <>
                            <button className="sg-icon-btn" onClick={handleDashboard} title="Tài khoản">
                                <FiUser size={22} />
                            </button>
                            <button className="sg-btn-outline" onClick={handleLogout}>Đăng xuất</button>
                        </>
                    ) : (
                        <>
                            <Link to="/signin">
                                <button className="sg-btn-text">Đăng nhập</button>
                            </Link>
                            <Link to="/signup">
                                <button className="sg-btn-primary">Đăng ký</button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
