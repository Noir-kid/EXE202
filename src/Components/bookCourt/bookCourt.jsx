import React, { useEffect, useState } from 'react';
import './bookCourt.css';
import { toast } from 'react-toastify';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import { useNavigate } from 'react-router-dom';

const BookCourt = () => {
    const navigate = useNavigate();

    const [branches, setBranches] = useState([]);
    const [courts, setCourts] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [note, setNote] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const courtIdFromUrl = params.get('courtId');

        Promise.all([
            fetch(`${API_BASE}/branches`).then(r => r.json()),
            fetch(`${API_BASE}/courts`).then(r => r.json()),
        ]).then(([branchData, courtData]) => {
            setBranches(branchData || []);
            setCourts(courtData || []);
            if (courtIdFromUrl) {
                const c = courtData.find(c => c.courtId === courtIdFromUrl);
                if (c) {
                    setSelectedCourt(c);
                    setSelectedBranch(c.branchId);
                }
            }
        }).catch(() => toast.error('Không thể tải dữ liệu'));
    }, []);

    useEffect(() => {
        if (!selectedCourt || !bookingDate) { setAvailableSlots([]); return; }
        setLoadingSlots(true);
        fetch(`${API_BASE}/bookings/availability?courtId=${selectedCourt.courtId}&date=${bookingDate}`)
            .then(r => r.ok ? r.json() : [])
            .then(slots => { setAvailableSlots(slots || []); setStartTime(''); setEndTime(''); })
            .catch(() => setAvailableSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [selectedCourt, bookingDate]);

    const formatPrice = (n) =>
        Math.floor(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const slotToHour = (t) => parseInt(t.slice(0, 2));

    const endSlots = availableSlots.filter(t => {
        if (!startTime) return false;
        const sh = slotToHour(startTime);
        const th = slotToHour(t);
        if (th <= sh) return false;
        for (let h = sh; h < th; h++) {
            const s = `${h.toString().padStart(2, '0')}:00:00`;
            if (!availableSlots.includes(s)) return false;
        }
        return true;
    });

    const durationHours = startTime && endTime
        ? slotToHour(endTime) - slotToHour(startTime)
        : 0;
    const amount = selectedCourt ? (selectedCourt.basePrice || 0) * durationHours : 0;

    const handleCourtChange = (courtId) => {
        const c = courts.find(c => c.courtId === courtId);
        setSelectedCourt(c || null);
        setStartTime('');
        setEndTime('');
        setAvailableSlots([]);
    };

    const handleSubmit = async () => {
        if (!selectedCourt) { toast.error('Vui lòng chọn sân'); return; }
        if (!bookingDate) { toast.error('Vui lòng chọn ngày'); return; }
        if (!startTime || !endTime) { toast.error('Vui lòng chọn giờ bắt đầu và kết thúc'); return; }
        if (slotToHour(startTime) >= slotToHour(endTime)) { toast.error('Giờ kết thúc phải sau giờ bắt đầu'); return; }
        if (new Date(`${bookingDate}T${startTime}`) <= new Date()) { toast.error('Không thể đặt giờ trong quá khứ'); return; }

        setSubmitting(true);
        try {
            const res = await fetchWithAuth(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courtId: selectedCourt.courtId,
                    bookingDate,
                    startTime,
                    endTime,
                    note: note || null,
                    promoCode: promoCode || null,
                }),
            });
            if (res.ok) {
                toast.success('Đặt sân thành công!');
                setTimeout(() => navigate('/bookingHistory'), 800);
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.message || 'Đặt sân thất bại');
            }
        } catch {
            toast.error('Lỗi kết nối');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCourts = courts.filter(
        c => c.branchId === selectedBranch && c.status === 'Active'
    );

    return (
        <div className="bookCourt-container">
            <h1 className="bookCourt-title">ĐẶT SÂN</h1>

            <div className="bookCourt-body">
                {/* LEFT: COURT SELECTION */}
                <div className="bookCourt-section bookCourt-left-section">
                    <h2 className="notes">1. CHỌN SÂN</h2>

                    <div className="bookCourt-option1">
                        <label htmlFor="branch">CHI NHÁNH:</label>
                        <select
                            id="branch"
                            value={selectedBranch}
                            onChange={e => {
                                setSelectedBranch(e.target.value);
                                setSelectedCourt(null);
                                setAvailableSlots([]);
                            }}
                        >
                            <option value="" hidden>Chọn chi nhánh</option>
                            {branches.map(b => (
                                <option key={b.branchId} value={b.branchId}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bookCourt-option2">
                        <label htmlFor="court">SÂN:</label>
                        <select
                            id="court"
                            value={selectedCourt?.courtId || ''}
                            onChange={e => handleCourtChange(e.target.value)}
                            disabled={!selectedBranch}
                        >
                            <option value="" hidden>Chọn sân</option>
                            {filteredCourts.map(c => (
                                <option key={c.courtId} value={c.courtId}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCourt && (
                        <div className="bookCourt-courtInfo">
                            <p><strong>Giá:</strong> {formatPrice(selectedCourt.basePrice)}đ/giờ</p>
                            {selectedCourt.description && <p>{selectedCourt.description}</p>}
                        </div>
                    )}

                    <h2 className="notes" style={{ marginTop: 24 }}>2. MÃ KHUYẾN MÃI (tùy chọn)</h2>
                    <div className="bookCourt-option1">
                        <label htmlFor="promoCode">Mã:</label>
                        <input
                            id="promoCode"
                            type="text"
                            placeholder="Nhập mã nếu có"
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc' }}
                        />
                    </div>

                    <h2 className="notes" style={{ marginTop: 24 }}>3. GHI CHÚ (tùy chọn)</h2>
                    <div className="bookCourt-option1">
                        <label htmlFor="note">Ghi chú:</label>
                        <input
                            id="note"
                            type="text"
                            placeholder="Ghi chú thêm..."
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', width: '100%' }}
                        />
                    </div>
                </div>

                {/* RIGHT: TIME SELECTION */}
                <div className="bookCourt-section bookCourt-right-section">
                    <h2 className="notes">4. THỜI GIAN</h2>

                    <div className="bookCourt-form-group5">
                        <label htmlFor="datePicker">Ngày: </label>
                        <input
                            type="date"
                            id="datePicker"
                            min={new Date().toISOString().slice(0, 10)}
                            value={bookingDate}
                            onChange={e => setBookingDate(e.target.value)}
                        />
                    </div>

                    {bookingDate && selectedCourt && (
                        <div className="bookCourt-form-group4">
                            {loadingSlots ? (
                                <p>Đang tải khung giờ...</p>
                            ) : availableSlots.length === 0 ? (
                                <p style={{ color: '#ef4444' }}>Không còn khung giờ trống cho ngày này</p>
                            ) : (
                                <>
                                    <label className="text" htmlFor="time-start">Bắt đầu:</label>
                                    <select
                                        id="time-start"
                                        value={startTime}
                                        onChange={e => { setStartTime(e.target.value); setEndTime(''); }}
                                    >
                                        <option value="" hidden>Chọn giờ</option>
                                        {availableSlots.map(t => (
                                            <option key={t} value={t}>
                                                {t.slice(0, 5)}
                                            </option>
                                        ))}
                                    </select>

                                    <span className="text"> đến </span>

                                    <select
                                        id="time-end"
                                        value={endTime}
                                        onChange={e => setEndTime(e.target.value)}
                                        disabled={!startTime}
                                    >
                                        <option value="" hidden>Chọn giờ</option>
                                        {endSlots.map(t => {
                                            const endH = slotToHour(t) + 1;
                                            const endStr = `${endH.toString().padStart(2, '0')}:00:00`;
                                            return (
                                                <option key={endStr} value={endStr}>
                                                    {endStr.slice(0, 5)}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </>
                            )}
                        </div>
                    )}

                    {/* SUMMARY */}
                    <div className="bookcourt-status">
                        <h2 className="notes">5. TỔNG KẾT</h2>
                        {durationHours > 0 && (
                            <>
                                <p>Thời lượng: <strong>{durationHours} giờ</strong></p>
                                <p>Tổng tiền: <span className="priceSpan">{formatPrice(amount)}đ</span></p>
                            </>
                        )}
                        <p style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>
                            Thanh toán được xử lý tại quầy (Cash) hoặc theo hướng dẫn sau khi đặt.
                        </p>
                    </div>
                </div>
            </div>

            <button
                type="button"
                className="bookCourt-complete-booking-button"
                onClick={handleSubmit}
                disabled={submitting}
            >
                {submitting ? 'Đang xử lý...' : 'Xác nhận đặt sân'}
            </button>
        </div>
    );
};

export default BookCourt;
