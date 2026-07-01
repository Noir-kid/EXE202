import React, { useEffect, useState, useMemo } from 'react';
import './home.css';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';
import { IoSearchOutline, IoLocationOutline } from 'react-icons/io5';
import { MdSportsSoccer, MdSportsTennis, MdSportsBasketball } from 'react-icons/md';
import { GiShuttlecock } from 'react-icons/gi';
import { FiMapPin, FiTag, FiChevronRight } from 'react-icons/fi';
import heroBg from '../../Assets/image1.jpg';
import image2 from '../../Assets/image2.jpg';

const SPORTS = [
    { label: 'Bóng đá',  icon: <MdSportsSoccer />,    link: '/findCourt?sport=Bóng đá' },
    { label: 'Cầu lông', icon: <GiShuttlecock />,      link: '/findCourt?sport=Cầu lông' },
    { label: 'Tennis',   icon: <MdSportsTennis />,     link: '/findCourt?sport=Tennis' },
    { label: 'Bóng rổ',  icon: <MdSportsBasketball />, link: '/findCourt?sport=Bóng rổ' },
];

const SPORT_COLORS = {
    'Cầu lông':    '#3b82f6',
    'Tennis':      '#10b981',
    'Bóng đá':     '#f59e0b',
    'Bóng rổ':     '#ef4444',
    'Bóng chuyền': '#8b5cf6',
    'Bơi lội':     '#06b6d4',
};

const Home = ({ setSearchCriteria }) => {
    const [branches, setBranches]   = useState([]);
    const [courts, setCourts]       = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedSport,    setSelectedSport]    = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE}/branches`)
            .then(r => r.json())
            .then(data => {
                setBranches(data || []);
                setLocations([...new Set((data || []).map(b => b.city).filter(Boolean))]);
            })
            .catch(err => console.error('Error fetching branches:', err));

        fetch(`${API_BASE}/courts`)
            .then(r => r.json())
            .then(data => setCourts(data || []))
            .catch(() => {});
    }, []);

    const featuredCourts = useMemo(
        () => courts.filter(c =>
            c.status !== 'Inactive' && c.status !== 'Maintenance' &&
            c.status !== 2 && c.status !== 3
        ).slice(0, 6),
        [courts]
    );

    const handleSearch = () => {
        if (setSearchCriteria) setSearchCriteria({ branch: selectedSport, location: selectedLocation });
        const params = new URLSearchParams();
        if (selectedSport)    params.set('sport', selectedSport);
        if (selectedLocation) params.set('city',  selectedLocation);
        const qs = params.toString();
        navigate(`/findCourt${qs ? '?' + qs : ''}`);
    };

    const extractFirstImage = img => img || image2;
    const formatPrice = n => Math.floor(n || 0).toLocaleString('vi-VN');

    return (
        <>
            {/* HERO */}
            <section className="sg-hero" style={{ backgroundImage: `url(${heroBg})` }}>
                <div className="sg-hero-overlay">
                    <div className="sg-hero-content">
                        <h1 className="sg-hero-title">
                            Đặt sân thể thao{' '}
                            <span className="sg-hero-accent">nhanh 30s</span>
                        </h1>
                        <p className="sg-hero-subtitle">
                            Hệ thống đặt sân hiện đại, tiện lợi và nhanh chóng nhất cho người chơi thể thao Việt Nam.
                        </p>

                        <div className="sg-search-bar">
                            <div className="sg-search-field">
                                <IoLocationOutline className="sg-search-icon" />
                                <select
                                    value={selectedSport}
                                    onChange={e => setSelectedSport(e.target.value)}
                                >
                                    <option value="">Loại hình thể thao</option>
                                    <option value="Bóng đá">Bóng đá</option>
                                    <option value="Cầu lông">Cầu lông</option>
                                    <option value="Tennis">Tennis</option>
                                    <option value="Bóng rổ">Bóng rổ</option>
                                </select>
                            </div>

                            <div className="sg-search-divider" />

                            <div className="sg-search-field">
                                <IoLocationOutline className="sg-search-icon" />
                                <select
                                    value={selectedLocation}
                                    onChange={e => setSelectedLocation(e.target.value)}
                                >
                                    <option value="">Tất cả địa điểm</option>
                                    {locations.map((loc, i) => (
                                        <option key={i} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            <button className="sg-search-btn" onClick={handleSearch}>
                                <IoSearchOutline size={18} />
                                Tìm ngay
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* SPORT CATEGORIES */}
            <section className="sg-categories">
                <div className="sg-categories-inner">
                    {SPORTS.map((sport, i) => (
                        <Link key={i} to={sport.link} className="sg-category-card">
                            <div className="sg-category-icon">{sport.icon}</div>
                            <span>{sport.label}</span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* FEATURED COURTS */}
            {featuredCourts.length > 0 && (
                <section className="sg-featured">
                    <div className="sg-featured-inner">
                        <div className="sg-section-head">
                            <div>
                                <h2 className="sg-section-title">Sân nổi bật</h2>
                                <p className="sg-section-sub">Các sân thể thao được đặt nhiều nhất trên nền tảng</p>
                            </div>
                            <Link to="/findCourt" className="sg-view-all">
                                Xem tất cả <FiChevronRight size={15} />
                            </Link>
                        </div>

                        <div className="sg-court-grid">
                            {featuredCourts.map(court => {
                                const branch = branches.find(b => b.branchId === court.branchId);
                                const color  = SPORT_COLORS[court.sportName] || '#60a5fa';
                                return (
                                    <article
                                        key={court.courtId}
                                        className="sg-court-card"
                                        onClick={() => navigate(`/bookCourt?courtId=${court.courtId}`)}
                                    >
                                        <div className="sg-court-img-wrap">
                                            <img
                                                src={extractFirstImage(court.imageUrls)}
                                                alt={court.name}
                                                className="sg-court-img"
                                                onError={e => { e.target.src = image2; }}
                                            />
                                            {court.sportName && (
                                                <span className="sg-court-sport" style={{ background: color + 'dd' }}>
                                                    {court.sportName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="sg-court-body">
                                            <h3 className="sg-court-name">{court.name}</h3>
                                            {branch && (
                                                <p className="sg-court-branch">
                                                    <FiMapPin size={12} />
                                                    {branch.name}{branch.city ? ` · ${branch.city}` : ''}
                                                </p>
                                            )}
                                            <div className="sg-court-footer">
                                                <span className="sg-court-price">
                                                    <FiTag size={12} />
                                                    {formatPrice(court.basePrice)}đ/giờ
                                                </span>
                                                <span className="sg-court-book">Đặt ngay →</span>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default Home;
