import React, { useState, useEffect } from 'react';
import Header from '../Header/header';
import Footer from '../Footer/Footer';
import './viewpayment.css';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';

export default function ViewPayment() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(`${API_BASE}/payments?pageSize=100`);
        if (!res.ok) throw new Error('Failed to fetch payments');
        const data = await res.json();
        const items = (data.items || []).sort((a, b) =>
          new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime()
        );
        setPayments(items);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        toast.error('Lỗi tải dữ liệu: ' + err.message);
      }
    };
    fetchPayments();
  }, []);

  const formatNumber = (n) =>
    n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const bookingPayments = payments.filter(p => p.bookingId);
  const balancePayments = payments.filter(p => !p.bookingId);
  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const filteredPayments =
    filter === 'booking' ? bookingPayments :
    filter === 'balance' ? balancePayments :
    payments;

  const METHOD_LABELS = { MoMo: 'MoMo', VNPay: 'VNPay', Cash: 'Tiền mặt', Wallet: 'Ví' };
  const METHOD_CLASS = { MoMo: 'vp-badge-momo', VNPay: 'vp-badge-vnpay', Cash: 'vp-badge-cash', Wallet: 'vp-badge-wallet' };
  const getMethodLabel = (method) => METHOD_LABELS[method] || method;
  const getMethodClass = (method) => METHOD_CLASS[method] || '';

  return (
    <div className='view-payment'>
      <div className='view-payment-header'><Header /></div>

      <div className='view-payment-wrapper'>
        <div className='vp-inner'>

          {/* Page hero */}
          <div className="vp-page-hero">
            <div>
              <h1 className="vp-hero-title">Lịch Sử Thanh Toán</h1>
              <p className="vp-hero-sub">Theo dõi toàn bộ giao dịch của bạn</p>
            </div>
          </div>

          {/* Stat cards */}
          <div className="vp-stats-row">
            <div className="vp-stat-card vp-stat-blue">
              <div className="vp-stat-icon">💳</div>
              <div className="vp-stat-body">
                <div className="vp-stat-value">{payments.length}</div>
                <div className="vp-stat-label">Tổng giao dịch</div>
              </div>
            </div>
            <div className="vp-stat-card vp-stat-orange">
              <div className="vp-stat-icon">💰</div>
              <div className="vp-stat-body">
                <div className="vp-stat-value">{formatNumber(totalSpent)}đ</div>
                <div className="vp-stat-label">Tổng chi tiêu</div>
              </div>
            </div>
            <div className="vp-stat-card vp-stat-sky">
              <div className="vp-stat-icon">🏸</div>
              <div className="vp-stat-body">
                <div className="vp-stat-value">{bookingPayments.length}</div>
                <div className="vp-stat-label">Đặt sân</div>
              </div>
            </div>
            <div className="vp-stat-card vp-stat-green">
              <div className="vp-stat-icon">⬆</div>
              <div className="vp-stat-body">
                <div className="vp-stat-value">{balancePayments.length}</div>
                <div className="vp-stat-label">Nạp tiền</div>
              </div>
            </div>
          </div>

          {/* Main card */}
          <div className="vp-card">
            {/* Card header */}
            <div className="vp-card-header">
              <h2>Chi tiết giao dịch</h2>
              {/* Filter chips */}
              <div className="vp-filters">
                {[
                  { key: 'all', label: 'Tất cả', count: payments.length },
                  { key: 'booking', label: 'Đặt sân', count: bookingPayments.length },
                  { key: 'balance', label: 'Nạp tiền', count: balancePayments.length },
                ].map(f => (
                  <button
                    key={f.key}
                    className={`vp-filter-btn${filter === f.key ? ' vp-filter-active' : ''}`}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                    <span className="vp-filter-count">{f.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="vp-card-body">
              {loading ? (
                <div className="vp-loading">
                  <div className="vp-spinner"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <p className="view-payment-error-message">Lỗi: {error}</p>
              ) : filteredPayments.length === 0 ? (
                <div className="vp-empty">
                  <div className="vp-empty-icon">📋</div>
                  <p>Không có giao dịch nào</p>
                </div>
              ) : (
                <div className="vp-table-wrap">
                  <table className="vp-table">
                    <thead>
                      <tr>
                        <th>Mã giao dịch</th>
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Loại</th>
                        <th>Phương thức</th>
                        <th>Số tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.map(payment => (
                        <tr key={payment.paymentId}>
                          <td className="vp-id-cell">
                            <span className="vp-id-badge">{payment.paymentId}</span>
                          </td>
                          <td>{new Date(payment.paidAt || payment.createdAt).toLocaleDateString('vi-VN')}</td>
                          <td>{new Date(payment.paidAt || payment.createdAt).toLocaleTimeString('vi-VN')}</td>
                          <td>
                            <span className={`vp-type-badge ${payment.bookingId ? 'vp-type-booking' : 'vp-type-balance'}`}>
                              {payment.bookingId ? '🏸 Đặt sân' : '⬆ Nạp tiền'}
                            </span>
                          </td>
                          <td>
                            <span className={`vp-method-badge ${getMethodClass(payment.method)}`}>
                              {getMethodLabel(payment.method)}
                            </span>
                          </td>
                          <td className="vp-amount-cell">
                            {formatNumber(payment.amount)}<span className="vp-currency">đ</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='view-payment-footer'><Footer /></div>
    </div>
  );
}
