import React, { useState, useEffect } from 'react';
import './ViewInfo.css';
import { Link } from 'react-router-dom';
import Header from '../Header/header';
import Footer from '../Footer/Footer';
import userImg from '../../Assets/user.jpg';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import { IoPersonOutline, IoMailOutline, IoCallOutline, IoCreateOutline, IoWalletOutline, IoCalendarOutline } from 'react-icons/io5';

export default function ViewInfo() {
    const [userInfo, setUserInfo] = useState({ userId: '', firstName: '', lastName: '', email: '', phone: '', img: '' });
    const [balance, setBalance] = useState(0);
    const token = sessionStorage.getItem('token');

    useEffect(() => {
        if (!token) return;
        fetchWithAuth(`${API_BASE}/users/me`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    setUserInfo({ ...data, img: data.avatarUrl || '' });
                    setBalance(data.loyaltyPoints || 0);
                }
            })
            .catch(() => {});
    }, [token]);

    const infoRows = [
        { icon: <IoPersonOutline />, label: 'Họ', value: userInfo.firstName || '—' },
        { icon: <IoPersonOutline />, label: 'Tên', value: userInfo.lastName || '—' },
        { icon: <IoMailOutline />, label: 'Email', value: userInfo.email || '—' },
        { icon: <IoCallOutline />, label: 'Số điện thoại', value: userInfo.phone || '—' },
        { icon: <IoWalletOutline />, label: 'Số dư tài khoản', value: `${balance.toLocaleString('vi-VN')}đ`, highlight: true },
    ];

    return (
        <div className="vi-page">
            <Header />

            <div className="vi-body">
                <div className="vi-container">
                    {/* Profile card */}
                    <div className="vi-card">
                        {/* Avatar section */}
                        <div className="vi-avatar-section">
                            <div className="vi-avatar-ring">
                                <img
                                    src={userInfo.img || userImg}
                                    alt="avatar"
                                    className="vi-avatar"
                                    onError={e => { e.target.src = userImg; }}
                                />
                            </div>
                            <div className="vi-name-block">
                                <h2 className="vi-fullname">{userInfo.firstName} {userInfo.lastName}</h2>
                                <span className="vi-role-badge">Khách hàng</span>
                            </div>
                        </div>

                        {/* Info grid */}
                        <div className="vi-info-grid">
                            {infoRows.map((row, i) => (
                                <div key={i} className={`vi-info-item${row.highlight ? ' vi-highlight' : ''}`}>
                                    <span className="vi-info-icon">{row.icon}</span>
                                    <div className="vi-info-content">
                                        <span className="vi-info-label">{row.label}</span>
                                        <span className="vi-info-value">{row.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="vi-actions">
                            <Link to="/editInfo" className="vi-edit-btn">
                                <IoCreateOutline />
                                Chỉnh sửa hồ sơ
                            </Link>
                            <Link to="/bookingHistory" className="vi-history-btn">
                                <IoCalendarOutline />
                                Lịch đặt sân
                            </Link>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="vi-quick-stats">
                        <Link to="/bookingHistory" className="vi-stat-card">
                            <IoCalendarOutline className="vi-stat-icon" />
                            <span className="vi-stat-label">Lịch đặt sân</span>
                        </Link>
                        <Link to="/paymentHistory" className="vi-stat-card">
                            <IoWalletOutline className="vi-stat-icon" />
                            <span className="vi-stat-label">Lịch sử thanh toán</span>
                        </Link>
                        <Link to="/buyTime" className="vi-stat-card vi-stat-orange">
                            <IoWalletOutline className="vi-stat-icon" />
                            <span className="vi-stat-label">Nạp tiền</span>
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
