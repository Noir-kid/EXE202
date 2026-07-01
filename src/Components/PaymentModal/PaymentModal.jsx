import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';

const fmt = (n) => Math.floor(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function PaymentModal({ bookingId, amount, onClose }) {
    const [loading, setLoading] = useState(false);

    const initiate = async (method) => {
        if (method === 'Cash') {
            toast.info('Vui lòng thanh toán tại quầy khi đến sân.');
            onClose();
            return;
        }
        setLoading(true);
        try {
            const returnUrl = `${window.location.origin}/paySuccess`;
            const res = await fetchWithAuth(`${API_BASE}/payments/initiate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, method, returnUrl }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || 'Không thể khởi tạo thanh toán');
                return;
            }
            window.location.href = data.paymentUrl;
        } catch {
            toast.error('Lỗi kết nối, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
            <div style={S.modal}>
                <h3 style={S.title}>Chọn phương thức thanh toán</h3>
                {amount > 0 && (
                    <p style={S.amountText}>
                        Tổng tiền: <strong style={{ color: '#10b981' }}>{fmt(amount)}đ</strong>
                    </p>
                )}
                <div style={S.btnGroup}>
                    <button style={{ ...S.btn, ...S.btnVnpay }} disabled={loading} onClick={() => initiate('VNPay')}>
                        <span style={S.btnIcon}>💳</span> Thanh toán qua VNPay
                    </button>
                    <button style={{ ...S.btn, ...S.btnMomo }} disabled={loading} onClick={() => initiate('MoMo')}>
                        <span style={S.btnIcon}>🟣</span> Thanh toán qua MoMo
                    </button>
                    <button style={{ ...S.btn, ...S.btnCash }} disabled={loading} onClick={() => initiate('Cash')}>
                        <span style={S.btnIcon}>💵</span> Thanh toán tại quầy
                    </button>
                </div>
                {loading && <p style={S.loadingText}>Đang chuyển đến cổng thanh toán...</p>}
                <button style={S.cancelBtn} onClick={onClose} disabled={loading}>
                    Hủy
                </button>
            </div>
        </div>
    );
}

const S = {
    overlay: {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    },
    modal: {
        background: '#fff', borderRadius: 20, padding: '40px 36px',
        minWidth: 360, maxWidth: 420, width: '90%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)', textAlign: 'center',
    },
    title: { fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 },
    amountText: { color: '#6b7280', fontSize: 15, marginBottom: 28 },
    btnGroup: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 },
    btn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '15px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
        fontSize: 15, fontWeight: 600, transition: 'opacity 0.15s',
    },
    btnIcon: { fontSize: 18 },
    btnVnpay: { background: '#005BAA', color: '#fff' },
    btnMomo: { background: '#ae2070', color: '#fff' },
    btnCash: { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
    loadingText: { color: '#6b7280', fontSize: 13, marginBottom: 8 },
    cancelBtn: {
        background: 'none', border: 'none', color: '#9ca3af',
        cursor: 'pointer', fontSize: 14, padding: '4px 8px',
    },
};