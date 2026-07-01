import React, { useState, useEffect, useMemo } from 'react';
import './findcourt.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../Header/header';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import {
    FiMapPin, FiInfo, FiTag, FiStar, FiChevronRight,
    FiSearch, FiX, FiClock, FiSliders,
} from 'react-icons/fi';
import image2 from '../../Assets/image2.jpg';
import userImg from '../../Assets/user.jpg';
import { API_BASE } from '../../config';

const SPORT_META = {
    'Cầu lông':    { emoji: '🏸', color: '#3b82f6' },
    'Tennis':      { emoji: '🎾', color: '#10b981' },
    'Bóng đá':     { emoji: '⚽', color: '#f59e0b' },
    'Bóng rổ':     { emoji: '🏀', color: '#ef4444' },
    'Bóng chuyền': { emoji: '🏐', color: '#8b5cf6' },
    'Bơi lội':     { emoji: '🏊', color: '#06b6d4' },
};

const FindCourt = () => {
    const [courts,   setCourts]   = useState([]);
    const [branches, setBranches] = useState([]);
    const [reviews,  setReviews]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState(null);

    const [selectedSport,  setSelectedSport]  = useState('');
    const [selectedCity,   setSelectedCity]   = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [searchText,     setSearchText]     = useState('');

    const token    = sessionStorage.getItem('token');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const branch = params.get('branch');
        const sport  = params.get('sport');
        const city   = params.get('city');
        if (branch) setSelectedBranch(branch);
        if (sport)  setSelectedSport(sport);
        if (city)   setSelectedCity(city);
    }, [location.search]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [branchRes, courtRes] = await Promise.all([
                    fetch(`${API_BASE}/branches`),
                    fetch(`${API_BASE}/courts`),
                ]);
                if (!branchRes.ok || !courtRes.ok) throw new Error('Không thể tải dữ liệu');
                const [branchData, courtData] = await Promise.all([branchRes.json(), courtRes.json()]);
                setBranches(branchData || []);
                setCourts(courtData || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchReviews = () => {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            fetch(`${API_BASE}/reviews`, { headers })
                .then(r => r.ok ? r.json() : [])
                .then(data => setReviews((data || []).filter(r => r.isVisible)))
                .catch(() => {});
        };

        fetchData();
        fetchReviews();
    }, [token]);

    const sportTypes = useMemo(
        () => [...new Set(courts.map(c => c.sportName).filter(Boolean))].sort(),
        [courts]
    );

    const cities = useMemo(
        () => [...new Set(branches.map(b => b.city).filter(Boolean))].sort(),
        [branches]
    );

    const filteredCourts = useMemo(() => courts.filter(c => {
        const branch = branches.find(b => b.branchId === c.branchId);
        const q = searchText.toLowerCase();
        return (
            (!selectedSport  || c.sportName === selectedSport) &&
            (!selectedCity   || branch?.city === selectedCity || c.branchCity === selectedCity) &&
            (!selectedBranch || c.branchId === selectedBranch) &&
            (!searchText     ||
                c.name?.toLowerCase().includes(q) ||
                c.branchName?.toLowerCase().includes(q) ||
                branch?.name?.toLowerCase().includes(q) ||
                branch?.address?.toLowerCase().includes(q))
        );
    }), [courts, branches, selectedSport, selectedCity, selectedBranch, searchText]);

    const selectedBranchObj = useMemo(
        () => branches.find(b => b.branchId === selectedBranch),
        [branches, selectedBranch]
    );

    const hasFilter = selectedSport || selectedCity || selectedBranch || searchText;

    const clearAll = () => {
        setSelectedSport('');
        setSelectedCity('');
        setSelectedBranch('');
        setSearchText('');
    };

    const extractFirstImage = (imageUrl) => imageUrl || image2;

    const formatPrice = (n) =>
        Math.floor(n || 0).toLocaleString('vi-VN');

    const renderStars = (rating) =>
        Array.from({ length: 5 }, (_, i) => (
            <FiStar key={i} size={12}
                className={i < rating ? 'star-filled' : 'star-empty'}
                fill={i < rating ? '#f59e0b' : 'none'} />
        ));

    return (
        <div className="fc-page">
            {token ? <div className="fc-header-wrap"><Header /></div> : <Navbar />}

            <main className="fc-main">
                {/* COMPACT HERO */}
                <section className="fc-hero">
                    <div className="fc-hero-inner">
                        <p className="fc-hero-eyebrow">Nền tảng đặt sân thể thao</p>
                        <h1 className="fc-hero-title">
                            Tìm <span className="fc-gradient-text">Sân Thể Thao</span> Gần Bạn
                        </h1>
                        <div className="fc-hero-search">
                            <FiSearch className="fc-hero-search-icon" />
                            <input
                                className="fc-hero-search-input"
                                placeholder="Tìm theo tên sân, chi nhánh, địa chỉ..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                            />
                            {searchText && (
                                <button className="fc-hero-search-clear" onClick={() => setSearchText('')}>
                                    <FiX />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* BODY: SIDEBAR + RESULTS */}
                <div className="fc-body">
                    {/* ── SIDEBAR ── */}
                    <aside className="fc-sidebar">
                        <div className="fc-sidebar-inner">
                            <div className="fc-sidebar-header">
                                <FiSliders size={15} />
                                <span>Bộ lọc</span>
                                {hasFilter && (
                                    <button className="fc-sidebar-clear" onClick={clearAll}>Xóa tất cả</button>
                                )}
                            </div>

                            {/* Sport type */}
                            <div className="fc-sidebar-section">
                                <p className="fc-sidebar-label">Môn thể thao</p>
                                <ul className="fc-sport-list">
                                    <li>
                                        <button
                                            className={`fc-sport-item ${selectedSport === '' ? 'active' : ''}`}
                                            onClick={() => setSelectedSport('')}
                                        >
                                            <span className="fc-sport-dot" style={{ background: '#60a5fa' }}>🏅</span>
                                            <span className="fc-sport-name">Tất cả</span>
                                            <span className="fc-sport-count">{courts.length}</span>
                                        </button>
                                    </li>
                                    {sportTypes.map(s => {
                                        const meta  = SPORT_META[s] || { emoji: '🏟️', color: '#64748b' };
                                        const count = courts.filter(c => c.sportName === s).length;
                                        return (
                                            <li key={s}>
                                                <button
                                                    className={`fc-sport-item ${selectedSport === s ? 'active' : ''}`}
                                                    onClick={() => setSelectedSport(prev => prev === s ? '' : s)}
                                                >
                                                    <span className="fc-sport-dot">{meta.emoji}</span>
                                                    <span className="fc-sport-name">{s}</span>
                                                    <span className="fc-sport-count">{count}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <div className="fc-sidebar-divider" />

                            {/* City */}
                            <div className="fc-sidebar-section">
                                <p className="fc-sidebar-label">Thành phố</p>
                                <select
                                    className="fc-sidebar-select"
                                    value={selectedCity}
                                    onChange={e => setSelectedCity(e.target.value)}
                                >
                                    <option value="">Tất cả thành phố</option>
                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Active branch from URL */}
                            {selectedBranch && selectedBranchObj && (
                                <>
                                    <div className="fc-sidebar-divider" />
                                    <div className="fc-sidebar-section">
                                        <p className="fc-sidebar-label">Chi nhánh</p>
                                        <div className="fc-branch-tag">
                                            <FiMapPin size={12} />
                                            <span>{selectedBranchObj.name}</span>
                                            <button onClick={() => setSelectedBranch('')}><FiX /></button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>

                    {/* ── RESULTS ── */}
                    <div className="fc-results">
                        {/* Results header */}
                        <div className="fc-results-header">
                            <div className="fc-results-meta">
                                <span className="fc-results-count">{filteredCourts.length} sân</span>
                                {(selectedSport || selectedCity) && (
                                    <span className="fc-results-context">
                                        {selectedSport && <span>{SPORT_META[selectedSport]?.emoji} {selectedSport}</span>}
                                        {selectedCity && <span>📍 {selectedCity}</span>}
                                    </span>
                                )}
                            </div>
                            {hasFilter && (
                                <div className="fc-active-tags">
                                    {selectedSport && (
                                        <span className="fc-tag">
                                            {SPORT_META[selectedSport]?.emoji} {selectedSport}
                                            <button onClick={() => setSelectedSport('')}><FiX size={10}/></button>
                                        </span>
                                    )}
                                    {selectedCity && (
                                        <span className="fc-tag">
                                            📍 {selectedCity}
                                            <button onClick={() => setSelectedCity('')}><FiX size={10}/></button>
                                        </span>
                                    )}
                                    {searchText && (
                                        <span className="fc-tag">
                                            🔍 "{searchText}"
                                            <button onClick={() => setSearchText('')}><FiX size={10}/></button>
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* States */}
                        {loading && (
                            <div className="fc-state-box">
                                <div className="fc-spinner" />
                                <p>Đang tải dữ liệu...</p>
                            </div>
                        )}

                        {error && (
                            <div className="fc-error-box">
                                <FiInfo />
                                <span>{error}</span>
                            </div>
                        )}

                        {!loading && !error && filteredCourts.length === 0 && (
                            <div className="fc-empty-box">
                                <span className="fc-empty-emoji">🏟️</span>
                                <h3>Không tìm thấy sân phù hợp</h3>
                                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                                {hasFilter && (
                                    <button className="fc-btn-outline" onClick={clearAll}>Xóa bộ lọc</button>
                                )}
                            </div>
                        )}

                        {/* Court list */}
                        {!loading && !error && filteredCourts.length > 0 && (
                            <div className="fc-court-list">
                                {filteredCourts.map(court => {
                                    const branch = branches.find(b => b.branchId === court.branchId);
                                    const meta   = SPORT_META[court.sportName] || { emoji: '🏟️', color: '#60a5fa' };
                                    return (
                                        <article key={court.courtId} className="fc-court-card">
                                            <div className="fc-card-img-wrap">
                                                <img
                                                    src={extractFirstImage(court.imageUrl)}
                                                    alt={court.name}
                                                    className="fc-card-img"
                                                    onError={e => { e.target.src = image2; }}
                                                />
                                                <span
                                                    className="fc-card-sport"
                                                    style={{ background: meta.color + 'dd' }}
                                                >
                                                    {meta.emoji} {court.sportName}
                                                </span>
                                            </div>

                                            <div className="fc-card-body">
                                                <div className="fc-card-top">
                                                    <h3 className="fc-card-name">{court.name}</h3>
                                                    <div className="fc-card-price">
                                                        <FiTag size={13} />
                                                        <strong>{formatPrice(court.basePrice)}đ</strong>
                                                        <span>/giờ</span>
                                                    </div>
                                                </div>

                                                <div className="fc-card-meta">
                                                    <span className="fc-card-meta-item">
                                                        <FiMapPin size={13} />
                                                        {branch?.name || '—'}
                                                        {branch?.city && <span className="fc-city-dot"> · {branch.city}</span>}
                                                    </span>
                                                    {branch?.address && (
                                                        <span className="fc-card-meta-item fc-card-address">
                                                            {branch.address}
                                                        </span>
                                                    )}
                                                    {(branch?.openTime || branch?.closeTime) && (
                                                        <span className="fc-card-meta-item">
                                                            <FiClock size={13} />
                                                            {branch.openTime || '?'} – {branch.closeTime || '?'}
                                                        </span>
                                                    )}
                                                </div>

                                                {court.description && (
                                                    <p className="fc-card-desc">{court.description}</p>
                                                )}

                                                <div className="fc-card-footer">
                                                    <button
                                                        className="fc-book-btn"
                                                        onClick={() => navigate(`/viewCourtInfo?courtId=${court.courtId}`)}
                                                    >
                                                        Xem & Đặt sân
                                                        <FiChevronRight size={15} className="fc-btn-arrow" />
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* Reviews */}
                        {!loading && reviews.length > 0 && (
                            <section className="fc-reviews-section">
                                <div className="fc-reviews-header">
                                    <h2 className="fc-reviews-title">Đánh giá từ khách hàng</h2>
                                </div>
                                <div className="fc-reviews-grid">
                                    {reviews.slice(0, 6).map(r => (
                                        <div key={r.reviewId} className="fc-review-card">
                                            <div className="fc-review-top">
                                                <img
                                                    src={r.userAvatar || userImg}
                                                    alt={r.userName}
                                                    className="fc-review-avatar"
                                                    onError={e => { e.target.src = userImg; }}
                                                />
                                                <div>
                                                    <p className="fc-review-name">{r.userName}</p>
                                                    <div className="fc-stars">{renderStars(r.rating)}</div>
                                                </div>
                                            </div>
                                            <p className="fc-review-text">"{r.comment}"</p>
                                            <div className="fc-review-foot">
                                                <span>{r.courtName} · {r.branchName}</span>
                                                <time>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</time>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>

            <div className="fc-footer-wrap"><Footer /></div>
        </div>
    );
};

export default FindCourt;
