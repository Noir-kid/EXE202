import React, { useEffect, useState } from 'react';
import Header from '../Header/header';
import Navbar from '../Navbar/Navbar';
import './viewCourtInfo.css';
import Footer from '../Footer/Footer';
import { FiArrowLeft, FiArrowRight, FiMapPin, FiInfo, FiTag, FiClock, FiLayers } from 'react-icons/fi';
import { format, addDays, subDays, startOfWeek } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../config';
import image2 from '../../Assets/image2.jpg';

const ViewCourtInfo = () => {
    const [mainCourt, setMainCourt] = useState(null);
    const [recommendedCourts, setRecommendedCourts] = useState([]);
    const [branch, setBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));
    const [currentHourIndex, setCurrentHourIndex] = useState(0);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const maxVisibleHours = 5;

    const navigate = useNavigate();
    const location = useLocation();

    const token = sessionStorage.getItem('token');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams(location.search);
                const courtId = params.get('courtId');

                const [branchRes, courtRes] = await Promise.all([
                    fetch(`${API_BASE}/branches`),
                    fetch(`${API_BASE}/courts`),
                ]);
                if (!branchRes.ok || !courtRes.ok) throw new Error('Không thể tải dữ liệu');

                const branches = await branchRes.json();
                const courts = await courtRes.json();

                const court = courts.find(c => c.courtId === courtId) || courts[0];
                if (!court) { setError('Không tìm thấy sân'); setLoading(false); return; }

                const br = branches.find(b => b.branchId === court.branchId);
                const recCourts = courts
                    .filter(c => c.branchId === court.branchId && c.courtId !== court.courtId)
                    .slice(0, 2);

                setMainCourt(court);
                setBranch(br || null);
                setRecommendedCourts(recCourts);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [location.search]);

    useEffect(() => {
        if (!mainCourt) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        fetch(`${API_BASE}/bookings/availability?courtId=${mainCourt.courtId}&date=${dateStr}`)
            .then(r => r.ok ? r.json() : [])
            .then(slots => setAvailableSlots(slots || []))
            .catch(() => setAvailableSlots([]));
    }, [mainCourt, selectedDate]);

    const generateWeekDates = (weekStart) => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(weekStart, i);
            dates.push({
                day: format(date, 'EEE'),
                date: format(date, 'dd'),
                month: format(date, 'MMM'),
                fullDate: date,
            });
        }
        return dates;
    };

    const extractImageUrls = (imageUrls) => {
        if (!imageUrls) return [];
        return imageUrls.split('|').map(u => u.trim()).filter(Boolean);
    };

    const formatPrice = (n) => {
        if (!n && n !== 0) return '0';
        return Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const generateHourTimeline = () => {
        if (!branch) return [];
        const openH = branch.openTime ? parseInt(branch.openTime.slice(0, 2)) : 6;
        const closeH = branch.closeTime ? parseInt(branch.closeTime.slice(0, 2)) : 22;
        const hours = [];
        for (let h = openH; h < closeH; h++) {
            // Slot strings from BE keep the branch's real OpenTime minute
            // (e.g. "01:05:00"), not necessarily ":00:00" — match by hour.
            const isAvailable = availableSlots.some(s => parseInt(s.slice(0, 2)) === h);
            const isActive = mainCourt?.status === 'Active';
            let status = 'maintenance';
            if (isActive) status = isAvailable ? 'available' : 'booked';
            hours.push({
                start: `${h.toString().padStart(2, '0')}:00`,
                end: `${(h + 1).toString().padStart(2, '0')}:00`,
                status,
            });
        }
        return hours;
    };

    const allHours = generateHourTimeline();
    const visibleHours = allHours.slice(currentHourIndex, currentHourIndex + maxVisibleHours);
    const weekDates = generateWeekDates(currentWeekStart);
    const images = mainCourt ? extractImageUrls(mainCourt.imageUrls) : [];

    if (loading) {
        return (
            <div className="vci-loader-container">
                <div className="vci-spinner"></div>
                <p>Đang tải thông tin sân đấu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vci-error-container">
                <FiInfo size={32} />
                <p>Đã xảy ra lỗi: {error}</p>
                <button className="vci-back-btn" onClick={() => navigate(-1)}>Quay lại</button>
            </div>
        );
    }

    return (
        <div className="vci-page">
            {token ? <div className="vci-header-wrap"><Header /></div> : <Navbar />}

            <main className="vci-main-content">
                <div className="vci-grid-layout">
                    {/* LEFT COLUMN: Gallery slider & Meta Info */}
                    <section className="vci-left-column">
                        <div className="vci-gallery-card">
                            {images.length > 0 ? (
                                <div className="vci-slider">
                                    <button 
                                        className="vci-slider-arrow arrow-left" 
                                        onClick={() => setCurrentImageIndex(i => Math.max(i - 1, 0))}
                                        disabled={currentImageIndex === 0}
                                    >
                                        <FiArrowLeft />
                                    </button>
                                    
                                    <img
                                        className="vci-main-img"
                                        src={images[currentImageIndex] || ''}
                                        alt={`Sân đấu ${mainCourt?.name}`}
                                    />
                                    
                                    <button 
                                        className="vci-slider-arrow arrow-right" 
                                        onClick={() => setCurrentImageIndex(i => Math.min(i + 1, images.length - 1))}
                                        disabled={currentImageIndex === images.length - 1}
                                    >
                                        <FiArrowRight />
                                    </button>
                                </div>
                            ) : (
                                <div className="vci-slider-placeholder">
                                    <p>Không có hình ảnh sân đấu</p>
                                </div>
                            )}
                            
                            {images.length > 1 && (
                                <div className="vci-indicator-row">
                                    {images.map((_, idx) => (
                                        <span 
                                            key={idx} 
                                            className={`vci-indicator-dot ${currentImageIndex === idx ? 'active' : ''}`}
                                            onClick={() => setCurrentImageIndex(idx)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Core Meta Card Overlay */}
                            <div className="vci-quick-meta-card">
                                <div className="vci-meta-item">
                                    <FiMapPin className="vci-meta-icon" />
                                    <div>
                                        <h4 className="vci-meta-label">Chi nhánh & Địa chỉ</h4>
                                        <p className="vci-meta-val"><strong>{branch?.name}</strong> - {branch?.address}</p>
                                    </div>
                                </div>
                                <div className="vci-meta-divider"></div>
                                <div className="vci-meta-item">
                                    <FiTag className="vci-meta-icon" />
                                    <div>
                                        <h4 className="vci-meta-label">Giá thuê sân</h4>
                                        <p className="vci-meta-val"><span className="vci-price-highlight">{formatPrice(mainCourt?.basePrice)}đ</span> / giờ</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* RIGHT COLUMN: Details & Time Selection */}
                    <section className="vci-right-column">
                        <div className="vci-details-card">
                            <h1 className="vci-court-title">Sân: {mainCourt?.name}</h1>
                            
                            {mainCourt?.description && (
                                <div className="vci-description-box">
                                    <h3 className="vci-sub-title">Mô tả chi tiết</h3>
                                    <p className="vci-desc-text">{mainCourt.description}</p>
                                </div>
                            )}

                            {/* CALENDAR & TIMELINE SLIDERS */}
                            <div className="vci-booking-widget">
                                <div className="vci-widget-header">
                                    <FiClock className="vci-widget-icon" />
                                    <span>Chọn thời gian & kiểm tra lịch trống</span>
                                </div>

                                <div className="vci-step-container">
                                    {/* Step 1: Date Selector */}
                                    <div className="vci-step-row">
                                        <span className="vci-step-badge">1</span>
                                        <h4 className="vci-step-title">Chọn Ngày Đặt Sân</h4>
                                    </div>

                                    <div className="vci-date-slider-wrapper">
                                        <button className="vci-arrow-btn" onClick={() => setCurrentWeekStart(d => subDays(d, 7))}>
                                            <FiArrowLeft />
                                        </button>
                                        
                                        <div className="vci-date-slider">
                                            {weekDates.map((d, idx) => (
                                                <button
                                                    key={idx}
                                                    className={`vci-date-item ${selectedDate?.toDateString() === d.fullDate.toDateString() ? 'selected' : ''}`}
                                                    onClick={() => { setSelectedDate(d.fullDate); setCurrentHourIndex(0); }}
                                                >
                                                    <span className="vci-date-day">{d.day}</span>
                                                    <span className="vci-date-num">{d.date}</span>
                                                    <span className="vci-date-month">{d.month}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <button className="vci-arrow-btn" onClick={() => setCurrentWeekStart(d => addDays(d, 7))}>
                                            <FiArrowRight />
                                        </button>
                                    </div>

                                    {/* Step 2: Time Slots Timeline */}
                                    <div className="vci-step-row" style={{ marginTop: '28px' }}>
                                        <span className="vci-step-badge">2</span>
                                        <h4 className="vci-step-title">Trạng Thái Khung Giờ Trong Ngày</h4>
                                    </div>

                                    <div className="vci-timeline-container">
                                        <div className="vci-timeline-row">
                                            <button 
                                                className="vci-arrow-btn" 
                                                onClick={() => setCurrentHourIndex(i => Math.max(i - 1, 0))}
                                                disabled={currentHourIndex === 0}
                                            >
                                                <FiArrowLeft />
                                            </button>
                                            
                                            <div className="vci-timeline-slots">
                                                {visibleHours.map((hour, idx) => (
                                                    <div key={idx} className={`vci-time-slot ${hour.status}`}>
                                                        <span className="vci-slot-time">{hour.start} - {hour.end}</span>
                                                        <span className="vci-slot-label">
                                                            {hour.status === 'available' ? 'Còn trống' : hour.status === 'booked' ? 'Đã đặt' : 'Bảo trì'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <button 
                                                className="vci-arrow-btn" 
                                                onClick={() => setCurrentHourIndex(i => Math.min(i + 1, allHours.length - maxVisibleHours))}
                                                disabled={currentHourIndex >= allHours.length - maxVisibleHours}
                                            >
                                                <FiArrowRight />
                                            </button>
                                        </div>

                                        <div className="vci-timeline-legend">
                                            <div className="vci-legend-item">
                                                <span className="vci-legend-color available"></span>
                                                <span>Còn trống</span>
                                            </div>
                                            <div className="vci-legend-item">
                                                <span className="vci-legend-color booked"></span>
                                                <span>Đã đặt</span>
                                            </div>
                                            <div className="vci-legend-item">
                                                <span className="vci-legend-color maintenance"></span>
                                                <span>Bảo trì</span>
                                            </div>
                                        </div>

                                        <button
                                            className="vci-action-book-btn"
                                            onClick={() => navigate(`/bookCourt?courtId=${mainCourt?.courtId}`)}
                                            disabled={mainCourt?.status !== 'Active'}
                                        >
                                            Đặt sân này ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* BOTTOM SECTION: Recommended/Other Courts */}
                {recommendedCourts.length > 0 && (
                    <section className="vci-recommended-section">
                        <div className="vci-section-header">
                            <FiLayers className="vci-recommended-icon" />
                            <h2 className="vci-recommended-title">Sân Đấu Khác Tại Chi Nhánh</h2>
                        </div>
                        
                        <div className="vci-recommended-grid">
                            {recommendedCourts.map((court, idx) => {
                                const imgs = extractImageUrls(court.imageUrls);
                                return (
                                    <article key={idx} className="vci-rec-court-card">
                                        <img className="vci-rec-img" src={imgs[0] || image2} alt={court.name} />
                                        <div className="vci-rec-content">
                                            <h3 className="vci-rec-court-name">{court.name}</h3>
                                            <p className="vci-rec-meta-text"><FiMapPin size={13} /> {branch?.name}</p>
                                            <p className="vci-rec-price"><FiTag size={13} /> {formatPrice(court.basePrice)}đ/giờ</p>
                                            
                                            {court.description && (
                                                <p className="vci-rec-desc">{court.description}</p>
                                            )}
                                            
                                            <button
                                                className="vci-rec-btn"
                                                onClick={() => navigate(`/viewCourtInfo?courtId=${court.courtId}`)}
                                                disabled={court.status !== 'Active'}
                                            >
                                                Xem sân này
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ViewCourtInfo;
