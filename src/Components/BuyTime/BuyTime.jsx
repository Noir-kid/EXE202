import React, { useEffect, useState } from 'react';
import './BuyTime.css';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import { useNavigate } from 'react-router-dom';

const BuyTime = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchWithAuth(`${API_BASE}/users/me`)
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setUser(data); })
            .catch(() => {});
    }, []);

    return (
        <div className="buyTime">
            <div className="buyTime_bodyContainer">
                <div className="buyTime_title">
                    <h1>Nạp tiền vào ví</h1>
                </div>
                <article className="buyTime_article">
                    {user && (
                        <p className="buyTime_p">
                            Tài khoản: <strong>{user.firstName} {user.lastName}</strong>
                        </p>
                    )}
                    <div style={{
                        background: '#fff7ed',
                        border: '1px solid #fed7aa',
                        borderRadius: 12,
                        padding: '24px',
                        marginTop: 16,
                        textAlign: 'center',
                    }}>
                        <p style={{ fontSize: 18, fontWeight: 600, color: '#c2410c', marginBottom: 8 }}>
                            Tính năng đang cập nhật
                        </p>
                        <p style={{ color: '#78350f' }}>
                            Chức năng nạp tiền vào ví đang được phát triển và sẽ sớm ra mắt.
                            Hiện tại bạn có thể đặt sân và thanh toán trực tiếp tại quầy.
                        </p>
                    </div>
                    <div className="buyTime_centerDiv" style={{ marginTop: 24 }}>
                        <button className="buyTime_btn" onClick={() => navigate('/findCourt')}>
                            Đặt sân ngay
                        </button>
                        <button className="buyTime_btn" onClick={() => navigate(-1)}>
                            Quay lại
                        </button>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default BuyTime;
