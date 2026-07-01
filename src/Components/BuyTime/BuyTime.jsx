import React, { useEffect, useState } from 'react';
import './BuyTime.css';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import {
    FiUser, FiMail, FiPhone, FiCreditCard,
    FiCheckCircle, FiChevronRight, FiZap,
} from 'react-icons/fi';

const PRESETS = [
    { label: '100.000đ',   value: 100000 },
    { label: '200.000đ',   value: 200000 },
    { label: '500.000đ',   value: 500000 },
    { label: '1.000.000đ', value: 1000000 },
    { label: '2.000.000đ', value: 2000000 },
];

const METHODS = [
    { key: 'VNPay', label: 'VNPay', color: '#005BAA', bg: 'rgba(0,91,170,0.12)', emoji: '💳' },
    { key: 'MoMo',  label: 'MoMo',  color: '#ae2070', bg: 'rgba(174,32,112,0.12)', emoji: '🟣' },
];

const fmt = (n) =>
    n ? Math.floor(n).toLocaleString('vi-VN') : '0';

const BuyTime = () => {
    const [user,          setUser]         = useState(null);
    const [amount,        setAmount]       = useState(null);
    const [customAmount,  setCustomAmount] = useState('');
    const [method,        setMethod]       = useState('');
    const [loading,       setLoading]      = useState(false);

    useEffect(() => {
        fetchWithAuth(`${API_BASE}/users/me`)
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setUser(data); })
            .catch(() => {});
    }, []);

    const selectedAmount = amount ?? (customAmount ? parseInt(customAmount.replace(/\D/g, ''), 10) || 0 : 0);
    const isReady = selectedAmount >= 10000 && !!method;

    const handleCustomChange = (e) => {
        setAmount(null);
        const raw = e.target.value.replace(/\D/g, '');
        setCustomAmount(raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '');
    };

    const handleSubmit = async () => {
        if (!isReady) return;
        setLoading(true);
        try {
            // Wallet top-up endpoint not yet implemented
            await new Promise(r => setTimeout(r, 800));
            toast.info('Tính năng nạp ví đang được phát triển và sẽ sớm ra mắt!', { autoClose: 4000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bt-page">
            {/* Page header */}
            <div className="bt-page-header">
                <h1 className="bt-page-title">Nạp tiền vào ví</h1>
                <p className="bt-page-sub">Nạp tiền để đặt sân nhanh hơn — không cần thanh toán mỗi lần</p>
            </div>

            <div className="bt-layout">
                {/* ── LEFT: FORM ── */}
                <div className="bt-form">

                    {/* Account info */}
                    <div className="bt-card">
                        <div className="bt-card-head">
                            <span className="bt-step-num">1</span>
                            <span className="bt-step-label">Thông tin tài khoản</span>
                        </div>
                        <div className="bt-card-body">
                            {user ? (
                                <div className="bt-user-row">
                                    <div className="bt-avatar">
                                        {user.avatarUrl
                                            ? <img src={user.avatarUrl} alt="avatar" className="bt-avatar-img" />
                                            : <span className="bt-avatar-letter">
                                                {(user.firstName?.[0] || '?').toUpperCase()}
                                              </span>
                                        }
                                    </div>
                                    <div className="bt-user-info">
                                        <p className="bt-user-name">
                                            {user.firstName} {user.lastName}
                                        </p>
                                        <p className="bt-user-meta">
                                            <FiMail size={12} /> {user.email}
                                        </p>
                                        {user.phone && (
                                            <p className="bt-user-meta">
                                                <FiPhone size={12} /> {user.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bt-skeleton-row">
                                    <div className="bt-skeleton bt-skeleton--circle" />
                                    <div className="bt-skeleton-lines">
                                        <div className="bt-skeleton bt-skeleton--line" />
                                        <div className="bt-skeleton bt-skeleton--line bt-skeleton--short" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Amount selection */}
                    <div className="bt-card">
                        <div className="bt-card-head">
                            <span className="bt-step-num">2</span>
                            <span className="bt-step-label">Chọn số tiền nạp</span>
                        </div>
                        <div className="bt-card-body">
                            <div className="bt-preset-grid">
                                {PRESETS.map(p => (
                                    <button
                                        key={p.value}
                                        className={`bt-preset ${amount === p.value ? 'bt-preset--active' : ''}`}
                                        onClick={() => { setAmount(p.value); setCustomAmount(''); }}
                                    >
                                        {p.label}
                                        {amount === p.value && (
                                            <FiCheckCircle className="bt-preset-check" size={14} />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="bt-custom-wrap">
                                <label className="bt-label">Hoặc nhập số tiền khác (tối thiểu 10.000đ)</label>
                                <div className="bt-custom-input-wrap">
                                    <input
                                        className="bt-custom-input"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={customAmount}
                                        onChange={handleCustomChange}
                                    />
                                    <span className="bt-custom-suffix">đ</span>
                                </div>
                            </div>

                            {/* Quick-pick multipliers */}
                            {amount && (
                                <div className="bt-bonus-hint">
                                    <FiZap size={13} className="bt-bonus-icon" />
                                    Nạp <strong>{fmt(amount)}đ</strong> — bạn nhận được{' '}
                                    <strong className="bt-bonus-val">
                                        {fmt(amount)}đ
                                    </strong>{' '}
                                    vào ví
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment method */}
                    <div className={`bt-card ${!selectedAmount ? 'bt-card--dim' : ''}`}>
                        <div className="bt-card-head">
                            <span className="bt-step-num">3</span>
                            <span className="bt-step-label">Phương thức thanh toán</span>
                        </div>
                        <div className="bt-card-body">
                            <div className="bt-method-list">
                                {METHODS.map(m => (
                                    <button
                                        key={m.key}
                                        className={`bt-method ${method === m.key ? 'bt-method--active' : ''}`}
                                        style={method === m.key
                                            ? { borderColor: m.color, background: m.bg }
                                            : {}}
                                        onClick={() => setMethod(m.key)}
                                        disabled={!selectedAmount}
                                    >
                                        <span className="bt-method-emoji">{m.emoji}</span>
                                        <span
                                            className="bt-method-name"
                                            style={method === m.key ? { color: m.color } : {}}
                                        >
                                            {m.label}
                                        </span>
                                        {method === m.key && (
                                            <FiCheckCircle
                                                size={16}
                                                className="bt-method-check"
                                                style={{ color: m.color }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: SUMMARY ── */}
                <div className="bt-summary-wrap">
                    <div className="bt-summary">
                        <h3 className="bt-summary-title">Tóm tắt nạp tiền</h3>

                        {/* Current balance placeholder */}
                        <div className="bt-balance-box">
                            <p className="bt-balance-label">Số dư ví hiện tại</p>
                            <p className="bt-balance-val">— đ</p>
                            <p className="bt-balance-note">Tính năng ví đang phát triển</p>
                        </div>

                        <div className="bt-sum-divider" />

                        <div className="bt-sum-rows">
                            <div className="bt-sum-row">
                                <span className="bt-sum-key">
                                    <FiCreditCard size={13} /> Số tiền nạp
                                </span>
                                <span className="bt-sum-val">
                                    {selectedAmount ? `${fmt(selectedAmount)}đ` : '—'}
                                </span>
                            </div>
                            <div className="bt-sum-row">
                                <span className="bt-sum-key">
                                    <FiUser size={13} /> Phương thức
                                </span>
                                <span className="bt-sum-val">
                                    {method
                                        ? METHODS.find(m => m.key === method)?.label
                                        : '—'}
                                </span>
                            </div>
                            <div className="bt-sum-row">
                                <span className="bt-sum-key">Phí giao dịch</span>
                                <span className="bt-sum-val bt-sum-free">Miễn phí</span>
                            </div>
                        </div>

                        <div className="bt-sum-divider" />

                        <div className="bt-sum-total">
                            <span>Tổng nạp</span>
                            <span className="bt-sum-amount">
                                {selectedAmount ? `${fmt(selectedAmount)}đ` : '—'}
                            </span>
                        </div>

                        <button
                            className={`bt-submit-btn ${isReady ? '' : 'bt-submit-btn--disabled'}`}
                            onClick={handleSubmit}
                            disabled={loading || !isReady}
                        >
                            {loading ? (
                                <><div className="bt-spinner" /> Đang xử lý...</>
                            ) : (
                                <>Nạp tiền ngay <FiChevronRight size={16} /></>
                            )}
                        </button>

                        <p className="bt-sum-note">
                            Sau khi nạp, số tiền sẽ được cộng vào ví ngay lập tức.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="bt-benefits">
                        <p className="bt-benefits-title">Lợi ích khi dùng ví SportSG</p>
                        <ul className="bt-benefits-list">
                            <li><FiCheckCircle className="bt-benefit-icon" /> Đặt sân tức thì, không cần nhập thẻ</li>
                            <li><FiCheckCircle className="bt-benefit-icon" /> Hoàn tiền nhanh khi hủy đặt</li>
                            <li><FiCheckCircle className="bt-benefit-icon" /> Theo dõi lịch sử chi tiêu dễ dàng</li>
                            <li><FiCheckCircle className="bt-benefit-icon" /> Nhận ưu đãi dành riêng cho thành viên</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyTime;
