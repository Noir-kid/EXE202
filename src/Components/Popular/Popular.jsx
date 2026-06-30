import React, { useState, useEffect } from 'react';
import './popular.css';
import { Link } from 'react-router-dom';
import { IoLocationOutline } from 'react-icons/io5';
import { FaStar } from 'react-icons/fa';
import { API_BASE } from '../../config';

const RATINGS = [4.8, 4.9, 4.7, 4.6, 4.9, 4.8];
const PRICES = ['150,000', '120,000', '180,000', '100,000', '200,000', '160,000'];

const Popular = ({ searchCriteria }) => {
    const [courtBranches, setCourtBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const token = sessionStorage.getItem('token');

    useEffect(() => {
        fetch(`${API_BASE}/branches`)
            .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
            .then((data) => {
                setCourtBranches(data);
                setFilteredBranches(data);
            })
            .catch((err) => console.error('Error fetching branches:', err));
    }, [token]);

    useEffect(() => {
        if (searchCriteria && (searchCriteria.branch || searchCriteria.location)) {
            const filtered = courtBranches.filter(
                (b) =>
                    (searchCriteria.branch ? (b.name || '').includes(searchCriteria.branch) : true) &&
                    (searchCriteria.location ? (b.city || b.address || '').includes(searchCriteria.location) : true)
            );
            setFilteredBranches(filtered);
        } else {
            setFilteredBranches(courtBranches);
        }
    }, [searchCriteria, courtBranches]);

    return (
        <>
            {/* SÂN NỔI BẬT */}
            <section className="sg-popular">
                <div className="sg-popular-inner">
                    <div className="sg-section-header">
                        <h2 className="sg-section-title">Sân nổi bật</h2>
                        <Link to="/findCourt" className="sg-see-all">Xem tất cả →</Link>
                    </div>

                    {filteredBranches.length === 0 ? (
                        <p className="sg-no-data">Không tìm thấy sân phù hợp.</p>
                    ) : (
                        <div className="sg-court-grid">
                            {filteredBranches.slice(0, 6).map((branch, idx) => (
                                <Link
                                    key={branch.branchId}
                                    to={`/findCourt?branch=${branch.branchId}`}
                                    className="sg-court-card"
                                >
                                    <div className="sg-court-img-wrap">
                                        {branch.imageUrl ? (
                                            <img
                                                src={branch.imageUrl}
                                                alt={branch.name}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.style.display = 'none';
                                                    if (e.currentTarget.nextElementSibling) {
                                                        e.currentTarget.nextElementSibling.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div className="sg-court-img-placeholder" style={{ display: branch.imageUrl ? 'none' : 'flex' }}>
                                            <span>{(branch.name || '?').charAt(0)}</span>
                                        </div>
                                        {idx === 0 && <span className="sg-badge sg-badge-new">MỚI</span>}
                                        {idx === 2 && <span className="sg-badge sg-badge-hot">HOT</span>}
                                        <span className="sg-court-rating">
                                            <FaStar className="sg-star" />
                                            {RATINGS[idx % RATINGS.length]}
                                        </span>
                                    </div>
                                    <div className="sg-court-info">
                                        <h3 className="sg-court-name">{branch.name}</h3>
                                        <p className="sg-court-location">
                                            <IoLocationOutline />
                                            {branch.city || branch.address}
                                        </p>
                                        <div className="sg-court-footer">
                                            <div>
                                                <span className="sg-court-price-label">Chỉ từ</span>
                                                <span className="sg-court-price">{PRICES[idx % PRICES.length]}đ/giờ</span>
                                            </div>
                                            <button className="sg-book-btn">
                                                Đặt ngay
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* APP DOWNLOAD */}
            <section className="sg-app-section">
                <div className="sg-app-inner">
                    <div className="sg-app-text">
                        <h2 className="sg-app-title">
                            Trải nghiệm ngay trên ứng dụng di động
                        </h2>
                        <p className="sg-app-desc">
                            Tải ngay ứng dụng SportSG để nhận thông báo về sân trống và các ưu đãi độc quyền lên đến 50%.
                        </p>
                        <div className="sg-app-btns">
                            <button className="sg-store-btn">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                                </svg>
                                <div>
                                    <div className="sg-store-sub">Download on the</div>
                                    <div className="sg-store-main">App Store</div>
                                </div>
                            </button>
                            <button className="sg-store-btn">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                    <path d="M3.18 23.76c.3.17.64.24 1 .19l12-6.93-2.59-2.59-10.41 9.33zm-1.43-20.4A1.49 1.49 0 001.5 4.5v15c0 .47.19.89.5 1.19L14.38 8.12 1.75 3.36zm19.47 8.48l-2.9-1.67-3.16 2.86 3.16 2.86 2.9-1.67c.83-.48.83-1.91 0-2.38zM4.18.05L16.18 6.98l-2.59 2.59L1.18.24c.37-.15.77-.18 1-.19z" />
                                </svg>
                                <div>
                                    <div className="sg-store-sub">GET IT ON</div>
                                    <div className="sg-store-main">Google Play</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="sg-phone-frame">
                        <div className="sg-phone-screen">
                            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" opacity="0.4">
                                <rect width="32" height="32" rx="8" fill="white" />
                                <rect x="8" y="8" width="16" height="16" rx="3" fill="#16a34a" />
                            </svg>
                            <span>SportSG App</span>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Popular;
