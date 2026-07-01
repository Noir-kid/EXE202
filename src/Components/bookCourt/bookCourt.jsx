import React, { useEffect, useState, useMemo } from 'react';
import './bookCourt.css';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../PaymentModal/PaymentModal';
import { FiMapPin, FiCalendar, FiClock, FiTag, FiFileText, FiCheckCircle } from 'react-icons/fi';
import image2 from '../../Assets/image2.jpg';

const BookCourt = () => {
    const navigate = useNavigate();

    const [branches,       setBranches]       = useState([]);
    const [courts,         setCourts]         = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCourt,  setSelectedCourt]  = useState(null);
    const [bookingDate,    setBookingDate]     = useState('');
    const [startTime,      setStartTime]      = useState('');
    const [endTime,        setEndTime]        = useState('');
    const [promoCode,      setPromoCode]      = useState('');
    const [note,           setNote]           = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots,   setLoadingSlots]   = useState(false);
    const [submitting,     setSubmitting]     = useState(false);
    const [paymentTarget,  setPaymentTarget]  = useState(null);

    useEffect(() => {
        const courtIdFromUrl = new URLSearchParams(window.location.search).get('courtId');
        Promise.all([
            fetch(`${API_BASE}/branches`).then(r => r.json()),
            fetch(`${API_BASE}/courts`).then(r => r.json()),
        ]).then(([branchData, courtData]) => {
            setBranches(branchData || []);
            setCourts(courtData || []);
            if (courtIdFromUrl) {
                const c = (courtData || []).find(c => c.courtId === courtIdFromUrl);
                if (c) { setSelectedCourt(c); setSelectedBranch(c.branchId); }
            }
        }).catch(() => toast.error('Không thể tải dữ liệu'));
    }, []);

    useEffect(() => {
        if (!selectedCourt || !bookingDate) { setAvailableSlots([]); return; }
        setLoadingSlots(true);
        setStartTime('');
        setEndTime('');
        fetch(`${API_BASE}/bookings/availability?courtId=${selectedCourt.courtId}&date=${bookingDate}`)
            .then(r => r.ok ? r.json() : [])
            .then(slots => setAvailableSlots(slots || []))
            .catch(() => setAvailableSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [selectedCourt, bookingDate]);

    // Public /courts may return status as string "Active", number 1, or omit it.
    // Show all courts for the branch except explicitly Inactive/Maintenance.
    const filteredCourts = useMemo(
        () => courts.filter(c =>
            c.branchId === selectedBranch &&
            c.status !== 'Inactive' &&
            c.status !== 'Maintenance' &&
            c.status !== 2 &&
            c.status !== 3
        ),
        [courts, selectedBranch]
    );

    const slotToHour = t => parseInt(t.slice(0, 2));

    const formatTime = t => t ? t.slice(0, 5) : '';

    const formatPrice = n =>
        Math.floor(n || 0).toLocaleString('vi-VN');

    const durationHours = startTime && endTime
        ? slotToHour(endTime) - slotToHour(startTime) : 0;
    const amount = selectedCourt ? (selectedCourt.basePrice || 0) * durationHours : 0;

    // Time slot grid — click to select start, click again to select range end
    const handleSlotClick = (slot) => {
        const slotH = slotToHour(slot);
        if (!startTime || slotH <= slotToHour(startTime)) {
            setStartTime(slot);
            setEndTime('');
            return;
        }
        // Validate all slots in range are available. Slot strings from the BE
        // keep the branch's real OpenTime minute (e.g. "01:05:00"), not
        // necessarily ":00:00" — match by hour, not by a hardcoded string.
        const sh = slotToHour(startTime);
        for (let h = sh; h <= slotH; h++) {
            if (!availableSlots.some(s => slotToHour(s) === h)) {
                toast.warning('Có giờ đã được đặt trong khoảng này, vui lòng chọn lại.');
                setStartTime(slot);
                setEndTime('');
                return;
            }
        }
        const endH = slotH + 1;
        const minute = slot.slice(3, 5);
        setEndTime(`${endH.toString().padStart(2, '0')}:${minute}:00`);
    };

    const slotVisual = (slot) => {
        if (!startTime) return 'avail';
        const h = slotToHour(slot);
        const sh = slotToHour(startTime);
        if (h === sh) return 'start';
        if (endTime && h > sh && h < slotToHour(endTime)) return 'range';
        if (endTime && h === slotToHour(endTime) - 1) return 'end';
        return 'avail';
    };

    const handleCourtChange = (courtId) => {
        const c = courts.find(c => c.courtId === courtId);
        setSelectedCourt(c || null);
        setStartTime('');
        setEndTime('');
        setAvailableSlots([]);
    };

    const handleSubmit = async () => {
        if (!selectedCourt)       { toast.error('Vui lòng chọn sân'); return; }
        if (!bookingDate)         { toast.error('Vui lòng chọn ngày'); return; }
        if (!startTime || !endTime) { toast.error('Vui lòng chọn khung giờ'); return; }
        if (new Date(`${bookingDate}T${startTime}`) <= new Date()) {
            toast.error('Không thể đặt giờ trong quá khứ'); return;
        }
        setSubmitting(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courtId: selectedCourt.courtId,
                    bookingDate, startTime, endTime,
                    note: note || null,
                    promoCode: promoCode || null,
                }),
            });
            if (res.ok) {
                const booking = await res.json();
                toast.success('Đặt sân thành công!');
                setPaymentTarget({ bookingId: booking.bookingId, amount: booking.totalAmount ?? amount });
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Đặt sân thất bại');
            }
        } catch { toast.error('Lỗi kết nối'); }
        finally { setSubmitting(false); }
    };

    const selectedBranchObj = branches.find(b => b.branchId === selectedBranch);
    const courtImage = selectedCourt?.imageUrl || image2;

    const today = new Date().toISOString().slice(0, 10);

    const readyToBook = selectedCourt && bookingDate && startTime && endTime;

    return (
        <div className="bc-page">
            {paymentTarget && (
                <PaymentModal
                    bookingId={paymentTarget.bookingId}
                    amount={paymentTarget.amount}
                    onClose={() => { setPaymentTarget(null); navigate('/bookingHistory'); }}
                />
            )}

            {/* Page header */}
            <div className="bc-page-header">
                <h1 className="bc-page-title">Đặt sân thể thao</h1>
                <p className="bc-page-sub">Chọn sân, ngày và khung giờ phù hợp với lịch của bạn</p>
            </div>

            <div className="bc-layout">
                {/* ── LEFT: FORM ── */}
                <div className="bc-form">

                    {/* STEP 1: Branch & Court */}
                    <div className="bc-card">
                        <div className="bc-card-head">
                            <span className="bc-step-num">1</span>
                            <span className="bc-step-label">Chọn chi nhánh & sân</span>
                        </div>
                        <div className="bc-card-body">
                            <div className="bc-field">
                                <label className="bc-label">
                                    <FiMapPin className="bc-label-icon" /> Chi nhánh
                                </label>
                                <div className="bc-select-wrap">
                                    <select
                                        className="bc-select"
                                        value={selectedBranch}
                                        onChange={e => {
                                            setSelectedBranch(e.target.value);
                                            setSelectedCourt(null);
                                            setAvailableSlots([]);
                                        }}
                                    >
                                        <option value="">-- Chọn chi nhánh --</option>
                                        {branches.map(b => (
                                            <option key={b.branchId} value={b.branchId}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {selectedBranch && (
                                <div className="bc-field">
                                    <label className="bc-label">Sân đấu</label>
                                    <div className="bc-select-wrap">
                                        <select
                                            className="bc-select"
                                            value={selectedCourt?.courtId || ''}
                                            onChange={e => handleCourtChange(e.target.value)}
                                        >
                                            <option value="">-- Chọn sân --</option>
                                            {filteredCourts.map(c => (
                                                <option key={c.courtId} value={c.courtId}>
                                                    {c.name} {c.sportName ? `(${c.sportName})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Court preview */}
                            {selectedCourt && (
                                <div className="bc-court-preview">
                                    <img
                                        src={courtImage}
                                        alt={selectedCourt.name}
                                        className="bc-court-img"
                                        onError={e => { e.target.src = image2; }}
                                    />
                                    <div className="bc-court-info">
                                        <p className="bc-court-name">{selectedCourt.name}</p>
                                        {selectedCourt.sportName && (
                                            <span className="bc-sport-badge">{selectedCourt.sportName}</span>
                                        )}
                                        {selectedBranchObj && (
                                            <p className="bc-court-branch">
                                                <FiMapPin size={12}/> {selectedBranchObj.name}
                                                {selectedBranchObj.city ? ` · ${selectedBranchObj.city}` : ''}
                                            </p>
                                        )}
                                        <p className="bc-court-price">
                                            <FiTag size={12}/> {formatPrice(selectedCourt.basePrice)}đ / giờ
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* STEP 2: Date */}
                    <div className={`bc-card ${!selectedCourt ? 'bc-card--dim' : ''}`}>
                        <div className="bc-card-head">
                            <span className="bc-step-num">2</span>
                            <span className="bc-step-label">Chọn ngày</span>
                        </div>
                        <div className="bc-card-body">
                            <div className="bc-field">
                                <label className="bc-label">
                                    <FiCalendar className="bc-label-icon" /> Ngày đặt sân
                                </label>
                                <input
                                    type="date"
                                    className="bc-date-input"
                                    min={today}
                                    value={bookingDate}
                                    onChange={e => setBookingDate(e.target.value)}
                                    disabled={!selectedCourt}
                                />
                            </div>
                        </div>
                    </div>

                    {/* STEP 3: Time slots */}
                    <div className={`bc-card ${!bookingDate || !selectedCourt ? 'bc-card--dim' : ''}`}>
                        <div className="bc-card-head">
                            <span className="bc-step-num">3</span>
                            <span className="bc-step-label">Chọn khung giờ</span>
                            {startTime && (
                                <button className="bc-reset-time" onClick={() => { setStartTime(''); setEndTime(''); }}>
                                    Chọn lại
                                </button>
                            )}
                        </div>
                        <div className="bc-card-body">
                            {!bookingDate || !selectedCourt ? (
                                <p className="bc-hint">Vui lòng chọn sân và ngày trước.</p>
                            ) : loadingSlots ? (
                                <div className="bc-slot-loading">
                                    <div className="bc-mini-spinner" />
                                    <span>Đang tải khung giờ trống...</span>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="bc-no-slots">
                                    <span>😔</span>
                                    <p>Không còn khung giờ trống cho ngày này.</p>
                                </div>
                            ) : (
                                <>
                                    <p className="bc-slot-hint">
                                        {!startTime
                                            ? 'Nhấn vào giờ bắt đầu'
                                            : !endTime
                                            ? 'Nhấn vào giờ kết thúc'
                                            : `${formatTime(startTime)} → ${formatTime(endTime)} (${durationHours} giờ)`
                                        }
                                    </p>
                                    <div className="bc-slot-grid">
                                        {availableSlots.map(slot => {
                                            const state = slotVisual(slot);
                                            return (
                                                <button
                                                    key={slot}
                                                    className={`bc-slot bc-slot--${state}`}
                                                    onClick={() => handleSlotClick(slot)}
                                                >
                                                    {formatTime(slot)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* STEP 4: Extra */}
                    <div className="bc-card">
                        <div className="bc-card-head">
                            <span className="bc-step-num">4</span>
                            <span className="bc-step-label">Thông tin thêm</span>
                            <span className="bc-optional">Tùy chọn</span>
                        </div>
                        <div className="bc-card-body">
                            <div className="bc-field">
                                <label className="bc-label">
                                    <FiTag className="bc-label-icon" /> Mã khuyến mãi
                                </label>
                                <input
                                    type="text"
                                    className="bc-input"
                                    placeholder="Nhập mã giảm giá nếu có..."
                                    value={promoCode}
                                    onChange={e => setPromoCode(e.target.value)}
                                />
                            </div>
                            <div className="bc-field">
                                <label className="bc-label">
                                    <FiFileText className="bc-label-icon" /> Ghi chú
                                </label>
                                <textarea
                                    className="bc-textarea"
                                    rows={3}
                                    placeholder="Yêu cầu đặc biệt, ghi chú thêm..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: SUMMARY ── */}
                <div className="bc-summary-wrap">
                    <div className="bc-summary">
                        <h3 className="bc-summary-title">Tóm tắt đặt sân</h3>

                        {/* Court info */}
                        {selectedCourt ? (
                            <div className="bc-sum-court">
                                <img
                                    src={courtImage}
                                    alt={selectedCourt.name}
                                    className="bc-sum-img"
                                    onError={e => { e.target.src = image2; }}
                                />
                                <div className="bc-sum-court-info">
                                    <p className="bc-sum-court-name">{selectedCourt.name}</p>
                                    {selectedBranchObj && (
                                        <p className="bc-sum-branch">
                                            <FiMapPin size={11} /> {selectedBranchObj.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bc-sum-placeholder">
                                <p>Chưa chọn sân</p>
                            </div>
                        )}

                        <div className="bc-sum-divider" />

                        {/* Booking details */}
                        <div className="bc-sum-rows">
                            <div className="bc-sum-row">
                                <span className="bc-sum-key"><FiCalendar size={13}/> Ngày</span>
                                <span className="bc-sum-val">
                                    {bookingDate
                                        ? new Date(bookingDate).toLocaleDateString('vi-VN', { weekday:'short', day:'2-digit', month:'2-digit', year:'numeric' })
                                        : '—'}
                                </span>
                            </div>
                            <div className="bc-sum-row">
                                <span className="bc-sum-key"><FiClock size={13}/> Giờ</span>
                                <span className="bc-sum-val">
                                    {startTime && endTime ? `${formatTime(startTime)} – ${formatTime(endTime)}` : '—'}
                                </span>
                            </div>
                            <div className="bc-sum-row">
                                <span className="bc-sum-key">Thời lượng</span>
                                <span className="bc-sum-val">
                                    {durationHours > 0 ? `${durationHours} giờ` : '—'}
                                </span>
                            </div>
                            <div className="bc-sum-row">
                                <span className="bc-sum-key">Giá/giờ</span>
                                <span className="bc-sum-val">
                                    {selectedCourt ? `${formatPrice(selectedCourt.basePrice)}đ` : '—'}
                                </span>
                            </div>
                            {promoCode && (
                                <div className="bc-sum-row">
                                    <span className="bc-sum-key">Mã giảm giá</span>
                                    <span className="bc-sum-val bc-sum-promo">{promoCode}</span>
                                </div>
                            )}
                        </div>

                        <div className="bc-sum-divider" />

                        <div className="bc-sum-total">
                            <span>Tổng tiền</span>
                            <span className="bc-sum-amount">
                                {amount > 0 ? `${formatPrice(amount)}đ` : '—'}
                            </span>
                        </div>

                        <button
                            className={`bc-submit-btn ${readyToBook ? '' : 'bc-submit-btn--disabled'}`}
                            onClick={handleSubmit}
                            disabled={submitting || !readyToBook}
                        >
                            {submitting ? (
                                <><div className="bc-mini-spinner bc-mini-spinner--white" /> Đang xử lý...</>
                            ) : (
                                <><FiCheckCircle size={16} /> Xác nhận đặt sân</>
                            )}
                        </button>

                        <p className="bc-sum-note">
                            Sau khi đặt, bạn sẽ được chuyển đến trang thanh toán.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookCourt;
