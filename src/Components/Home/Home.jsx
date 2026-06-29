import React, { useEffect, useState } from 'react';
import './home.css';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';
import { IoSearchOutline, IoLocationOutline } from 'react-icons/io5';
import { MdSportsSoccer, MdSportsTennis, MdSportsBasketball } from 'react-icons/md';
import { GiShuttlecock } from 'react-icons/gi';
import heroBg from '../../Assets/image1.jpg';

const SPORTS = [
    { label: 'Bóng đá', icon: <MdSportsSoccer />, link: '/findCourt' },
    { label: 'Cầu lông', icon: <GiShuttlecock />, link: '/findCourt' },
    { label: 'Tennis', icon: <MdSportsTennis />, link: '/findCourt' },
    { label: 'Bóng rổ', icon: <MdSportsBasketball />, link: '/findCourt' },
];

const Home = ({ setSearchCriteria }) => {
    const [branches, setBranches] = useState([]);
    const [locations, setLocations] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${API_BASE}/branches`)
            .then((r) => r.json())
            .then((data) => {
                setBranches(data);
                setLocations([...new Set(data.map((b) => b.city).filter(Boolean))]);
            })
            .catch((err) => console.error('Error fetching branches:', err));
    }, []);

    const handleSearch = () => {
        setSearchCriteria({ branch: selectedBranch, location: selectedLocation });
        navigate('/findCourt');
    };

    return (
        <>
            {/* HERO */}
            <section
                className="sg-hero"
                style={{ backgroundImage: `url(${heroBg})` }}
            >
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
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
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
                                    onChange={(e) => {
                                        setSelectedLocation(e.target.value);
                                        setSearchCriteria({ branch: selectedBranch, location: e.target.value });
                                    }}
                                >
                                    <option value="">Tất cả địa điểm</option>
                                    {locations.map((loc, i) => (
                                        <option key={i} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sg-search-divider" />

                            <div className="sg-search-field">
                                <input type="datetime-local" />
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
        </>
    );
};

export default Home;
