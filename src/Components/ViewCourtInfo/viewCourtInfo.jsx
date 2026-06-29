import React, { useEffect, useState } from 'react';
import Header from '../Header/header';
import Navbar from '../Navbar/Navbar';
import './viewCourtInfo.css';
import Footer from '../Footer/Footer';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { format, addDays, subDays, startOfWeek } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../config';

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
            const slotTimeStr = `${h.toString().padStart(2, '0')}:00:00`;
            const isAvailable = availableSlots.includes(slotTimeStr);
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

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;
    if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>;

    return (
        <div className="viewcourtinfo">
            {token ? <div className="findCourtHeader"><Header /></div> : <Navbar />}
            <div className="viewCourtInfo-wrapper">
                <div className="background">
                    <div className="viewcourtinfo-body">
                        <div className="viewcourtinfo-body-content">
                            <div className="viewcourtinfo-body-pic">
                                {images.length > 0 && (
                                    <div className="viewcourtinfo-slider">
                                        <button className="arrow-left" onClick={() => setCurrentImageIndex(i => Math.max(i - 1, 0))}>
                                            <FaArrowLeft />
                                        </button>
                                        <img
                                            className="viewcourtinfo-img"
                                            src={images[currentImageIndex] || ''}
                                            alt={`Court ${currentImageIndex}`}
                                        />
                                        <button className="arrow-right" onClick={() => setCurrentImageIndex(i => Math.min(i + 1, images.length - 1))}>
                                            <FaArrowRight />
                                        </button>
                                    </div>
                                )}
                                <div className="indicator-wrapper">
                                    {images.map((_, idx) => (
                                        <span key={idx} className={`indicator ${currentImageIndex === idx ? 'active' : ''}`} />
                                    ))}
                                </div>
                                <div className="viewcourtinfo-info-status">
                                    <div className="viewcourtinfo-info">
                                        <p className="viewcourt-title">Địa chỉ: {branch?.address}</p>
                                        <p className="viewcourt-title">Chi nhánh: {branch?.name}</p>
                                        <p className="viewcourt-title">Giá: {formatPrice(mainCourt?.basePrice)} VND/giờ</p>
                                    </div>
                                </div>
                            </div>

                            <div className="viewcourtinfo-body-details">
                                <div className="viewcourtinfo-body-courtId">
                                    <h1>Sân: {mainCourt?.name}</h1>
                                </div>
                                <div className="viewcourtinfo-body-des">
                                    <h1 className="viewcourtinfo-des-h1">Mô tả:</h1>
                                    <p className="viewcourtinfo-des-p">{mainCourt?.description}</p>
                                </div>

                                <div className="chooseTimeLine">
                                    <div className="chooseDate">CHỌN NGÀY</div>
                                    <div className="date-slider-wrapper">
                                        <button className="arrow-left" onClick={() => setCurrentWeekStart(d => subDays(d, 7))}>
                                            <FaArrowLeft />
                                        </button>
                                        <div className="date-slider">
                                            {weekDates.map((d, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`date-item ${selectedDate?.toDateString() === d.fullDate.toDateString() ? 'selected' : ''}`}
                                                    onClick={() => { setSelectedDate(d.fullDate); setCurrentHourIndex(0); }}
                                                >
                                                    <div>{d.day}</div>
                                                    <div className="line-separator"></div>
                                                    <div className="viewcourt-date">{d.date}</div>
                                                    <div className="viewcourt-month">{d.month}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="arrow-right" onClick={() => setCurrentWeekStart(d => addDays(d, 7))}>
                                            <FaArrowRight />
                                        </button>
                                    </div>

                                    <div className="chooseTime">CHỌN GIỜ</div>
                                    <div className="schedule-legend-wrapper">
                                        <div className="schedule">
                                            <div className="court">
                                                <button className="arrow-left-timeline" onClick={() => setCurrentHourIndex(i => Math.max(i - 1, 0))}>
                                                    <FaArrowLeft />
                                                </button>
                                                <div className="court-timeline">
                                                    {visibleHours.map((hour, idx) => (
                                                        <div key={idx} className={`time-slot ${hour.status}`}>
                                                            {hour.start} - {hour.end}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button className="arrow-right-timeline" onClick={() => setCurrentHourIndex(i => Math.min(i + 1, allHours.length - maxVisibleHours))}>
                                                    <FaArrowRight />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="legend">
                                            <div className="legend-item">
                                                <div className="legend-color booked"></div>
                                                <div className="legend-text">Đã đặt</div>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color available"></div>
                                                <div className="legend-text">Còn trống</div>
                                            </div>
                                            <div className="legend-item">
                                                <div className="legend-color maintenance"></div>
                                                <div className="legend-text">Bảo trì</div>
                                            </div>
                                        </div>
                                        <button
                                            className="timeline-viewCourt"
                                            onClick={() => navigate(`/bookCourt?courtId=${mainCourt?.courtId}`)}
                                            disabled={mainCourt?.status !== 'Active'}
                                        >
                                            Đặt sân
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {recommendedCourts.length > 0 && (
                        <div className="viewcourtinfo-othercourts">
                            <h1 className="viewcourtinfo-othercourts-h1">SÂN KHÁC</h1>
                            <div className="viewcourtinfo-othercourts-content">
                                {recommendedCourts.map((court, idx) => {
                                    const imgs = extractImageUrls(court.imageUrls);
                                    return (
                                        <div key={idx} className="viewcourtinfo-other-pic">
                                            <img className="viewcourtinfo-other-img" src={imgs[0] || ''} alt="" />
                                            <div className="viewcourtinfo-other-info">
                                                <h2>Sân: {court.name}</h2>
                                                <p>Địa chỉ: {branch?.address}</p>
                                                <p>Chi nhánh: {branch?.name}</p>
                                                <p>Giá: {formatPrice(court.basePrice)} VND/giờ</p>
                                                <div className="viewcourtinfo-other-des">
                                                    <h1 className="viewcourtinfo-other-des-h1">Mô tả:</h1>
                                                    <p className="viewcourtinfo-other-des-p">{court.description}</p>
                                                </div>
                                                <div className="other-court-button">
                                                    <button
                                                        className="viewCourt"
                                                        onClick={() => navigate(`/viewCourtInfo?courtId=${court.courtId}`)}
                                                        disabled={court.status !== 'Active'}
                                                    >
                                                        Xem sân
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ViewCourtInfo;
