import React, { useState, useEffect } from 'react';
import Header from '../Header/header';
import Footer from '../Footer/Footer';
import './ViewHistory.css';
import { Modal } from 'antd';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import CreateFeedbackModal from '../CreateFeedbackModal/CreateFeedbackModal';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';

const TODAY = 'today';
const UPCOMING = 'upcoming';
const PAST = 'past';

const STATUS_LABEL = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  CheckedIn: 'Đã check-in',
  CheckedOut: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  NoShow: 'Không đến',
};
const STATUS_COLOR = {
  Pending: '#f59e0b',
  Confirmed: '#3b82f6',
  CheckedIn: '#8b5cf6',
  CheckedOut: '#10b981',
  Cancelled: '#ef4444',
  NoShow: '#6b7280',
};

const formatNumber = (n) =>
  Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const todayStr = () => new Date().toISOString().slice(0, 10);

const classifyBooking = (b) => {
  const dateStr = typeof b.bookingDate === 'string' ? b.bookingDate : String(b.bookingDate);
  const today = todayStr();
  const done = ['CheckedOut', 'Cancelled', 'NoShow'].includes(b.status);
  if (dateStr === today && !done) return TODAY;
  if (dateStr > today && !done) return UPCOMING;
  return PAST;
};

export default function ViewHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TODAY);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackData, setFeedbackData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchWithAuth(`${API_BASE}/bookings?pageSize=100`);
        if (!res.ok) throw new Error('Không thể tải dữ liệu đặt sân');
        const data = await res.json();
        const items = (data.items || []).sort(
          (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)
        );
        setBookings(items);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cancelBooking = async () => {
    if (!cancelTarget) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/bookings/${cancelTarget}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: 'Cancelled' }),
      });
      if (!res.ok) throw new Error('Hủy thất bại');
      toast.success('Đã hủy đặt sân');
      setBookings(prev =>
        prev.map(b => b.bookingId === cancelTarget ? { ...b, status: 'Cancelled' } : b)
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelTarget(null);
    }
  };

  const filtered = (type) => bookings.filter(b => classifyBooking(b) === type);
  const todayCount = filtered(TODAY).length;
  const upcomingCount = filtered(UPCOMING).length;
  const pastCount = filtered(PAST).length;

  const tabConfig = [
    { key: TODAY, label: 'Hôm nay', count: todayCount },
    { key: UPCOMING, label: 'Sắp tới', count: upcomingCount },
    { key: PAST, label: 'Đã qua', count: pastCount },
  ];

  const renderRows = (type) =>
    filtered(type).map(b => (
      <tr key={b.bookingId}>
        <td className="vhid-cell">
          <span className="vh-id-badge">{b.bookingId.slice(0, 8)}…</span>
        </td>
        <td>{b.courtName}</td>
        <td>{b.branchName}</td>
        <td>{typeof b.bookingDate === 'string' ? b.bookingDate : String(b.bookingDate)}</td>
        <td>
          {typeof b.startTime === 'string' ? b.startTime.slice(0, 5) : ''} –{' '}
          {typeof b.endTime === 'string' ? b.endTime.slice(0, 5) : ''}
        </td>
        <td>{formatNumber(b.totalAmount)}đ</td>
        <td>
          <span style={{ color: STATUS_COLOR[b.status] || '#374151', fontWeight: 600 }}>
            {STATUS_LABEL[b.status] || b.status}
          </span>
        </td>
        <td>
          {type === PAST && b.status === 'CheckedOut' && (
            <button
              className="vh-feedback-btn"
              onClick={() => { setFeedbackData({ bookingId: b.bookingId }); setFeedbackModalVisible(true); }}
            >
              Đánh giá
            </button>
          )}
          {(type === TODAY || type === UPCOMING) && (b.status === 'Pending' || b.status === 'Confirmed') && (
            <button
              className="view-history-button view-history-cancel-btn"
              onClick={() => setCancelTarget(b.bookingId)}
            >
              Hủy
            </button>
          )}
        </td>
      </tr>
    ));

  return (
    <div className="view-history">
      <Modal
        title="Xác nhận hủy đặt sân"
        open={!!cancelTarget}
        onOk={cancelBooking}
        onCancel={() => setCancelTarget(null)}
        okText="Xác nhận hủy"
        cancelText="Quay lại"
        okButtonProps={{ danger: true }}
        centered
      >
        <p>Bạn có chắc muốn hủy lịch đặt sân này không?</p>
        <p className="warning">HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC!</p>
      </Modal>

      <div className="view-history-header"><Header /></div>

      <div className="view-history-wrapper">
        <div className="view-history-background">
          <div className="vh-page-hero">
            <div className="vh-hero-text">
              <h1 className="vh-hero-title">Lịch Đặt Sân</h1>
              <p className="vh-hero-sub">Quản lý toàn bộ lịch đặt sân của bạn</p>
            </div>
            <div className="vh-hero-chips">
              <span className="vh-chip vh-chip-today"><span className="vh-chip-num">{todayCount}</span> Hôm nay</span>
              <span className="vh-chip vh-chip-upcoming"><span className="vh-chip-num">{upcomingCount}</span> Sắp tới</span>
              <span className="vh-chip vh-chip-past"><span className="vh-chip-num">{pastCount}</span> Đã qua</span>
            </div>
          </div>

          <div className="view-history-profile-content">
            <div className="vh-tabs">
              {tabConfig.map(tab => (
                <button
                  key={tab.key}
                  className={`vh-tab-btn${activeTab === tab.key ? ' vh-tab-active' : ''} vh-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  <span className="vh-tab-badge">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="view-history-booking-history">
              {loading ? (
                <div className="vh-loading">
                  <div className="vh-spinner"></div>
                  <p>Đang tải dữ liệu...</p>
                </div>
              ) : error ? (
                <p className="view-history-error-message">Lỗi: {error}</p>
              ) : filtered(activeTab).length === 0 ? (
                <div className="vp-empty">
                  <div className="vp-empty-icon">📋</div>
                  <p>
                    Không có lịch đặt sân.{' '}
                    {activeTab !== PAST && <Link to="/findCourt" className="view-history-book-now">Đặt sân ngay!</Link>}
                  </p>
                </div>
              ) : (
                <div className="view-history-table-wrapper">
                  <table className="view-history-today-booking-table">
                    <thead>
                      <tr>
                        <th>Mã đặt sân</th>
                        <th>Sân</th>
                        <th>Chi nhánh</th>
                        <th>Ngày</th>
                        <th>Giờ</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>{renderRows(activeTab)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="view-history-footer"><Footer /></div>

      <CreateFeedbackModal
        visible={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        bookingId={feedbackData.bookingId}
        centered
      />
    </div>
  );
}
