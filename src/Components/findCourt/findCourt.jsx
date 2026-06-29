import React, { useState, useEffect } from 'react';
import './findcourt.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../Header/header';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import image2 from '../../Assets/image2.jpg';
import userImg from '../../Assets/user.jpg';
import { API_BASE } from '../../config';

const FindCourt = () => {
  const [courts, setCourts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');

  const token = sessionStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const branchId = params.get('branch');
    if (branchId) setSelectedBranch(branchId);
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [branchRes, courtRes] = await Promise.all([
          fetch(`${API_BASE}/branches`),
          fetch(`${API_BASE}/courts`),
        ]);
        if (!branchRes.ok || !courtRes.ok) throw new Error('Không thể tải dữ liệu');
        const branchData = await branchRes.json();
        const courtData = await courtRes.json();
        setBranches(branchData || []);
        setCourts(
          (courtData || []).map(c => ({
            ...c,
            image: c.imageUrls ? c.imageUrls.split('|')[0].trim() : image2,
          }))
        );
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

  const filteredCourts = courts.filter(c =>
    (selectedBranch === '' || c.branchId === selectedBranch) &&
    (selectedCourt === '' || c.courtId === selectedCourt) &&
    c.status === 'Active'
  );

  const filteredReviews = reviews.filter(r =>
    selectedBranch === '' ||
    branches.find(b => b.branchId === selectedBranch)?.name === r.branchName
  );

  const extractFirstImage = (imageUrls) => {
    if (!imageUrls) return image2;
    const first = imageUrls.split('|')[0].trim();
    return first || image2;
  };

  const formatPrice = (n) =>
    Math.floor(n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const renderStars = (rating) =>
    '★'.repeat(rating) + '☆'.repeat(5 - rating);

  return (
    <div className="findCourt">
      {token ? <div className="findCourtHeader"><Header /></div> : <Navbar />}

      <div className="findCourt-wrapper">
        <div className="background">
          <section className="findCourt-find">
            <div className="secContainer container">
              <div className="findCourt-homeText">
                <h1 className="findcourt-Title">Tìm Sân</h1>
              </div>

              <div className="findCourt-searchCard grid">
                <div className="branchDiv">
                  <label htmlFor="branch">Chi nhánh</label>
                  <select
                    value={selectedBranch}
                    onChange={e => { setSelectedBranch(e.target.value); setSelectedCourt(''); }}
                  >
                    <option value="">Tất cả chi nhánh</option>
                    {branches.map(b => (
                      <option key={b.branchId} value={b.branchId}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="findCourt-courtDiv">
                  <label htmlFor="court">Sân</label>
                  <select
                    value={selectedCourt}
                    onChange={e => setSelectedCourt(e.target.value)}
                  >
                    <option value="">Tất cả sân</option>
                    {courts
                      .filter(c => !selectedBranch || c.branchId === selectedBranch)
                      .map(c => (
                        <option key={c.courtId} value={c.courtId}>{c.name}</option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="findCourt-courtList">
              {loading && <p>Đang tải...</p>}
              {error && <p style={{ color: 'red' }}>{error}</p>}
              {!loading && filteredCourts.length === 0 && <p>Không tìm thấy sân phù hợp.</p>}
              {filteredCourts.map(court => {
                const branch = branches.find(b => b.branchId === court.branchId);
                return (
                  <div className="findCourt-courtCard" key={court.courtId}>
                    <div className="findCourt-courtImage">
                      <img src={extractFirstImage(court.imageUrls)} alt={court.name} />
                    </div>
                    <div className="findCourt-courtInfo">
                      <h2>Sân: {court.name}</h2>
                      <p>Chi nhánh: {branch?.name || '—'}</p>
                      <p>Địa chỉ: {branch?.address || '—'}</p>
                      <p>Giá: {formatPrice(court.basePrice)} VND/giờ</p>
                      {court.description && <p>Mô tả: {court.description}</p>}
                      <button
                        className="findCourt-bookBtn"
                        onClick={() => navigate(`/viewCourtInfo?courtId=${court.courtId}`)}
                      >
                        Xem & Đặt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* REVIEWS SECTION */}
            <div className="findcourt-feedbackBox">
              <h1>Đánh giá từ khách hàng</h1>
              {filteredReviews.length === 0 && <p>Chưa có đánh giá nào.</p>}
              <div className="findcourt-feedbackGrid">
                {filteredReviews.map(r => (
                  <div key={r.reviewId} className="findcourt-feedbackCard">
                    <div className="findcourt-feedbackInfo">
                      <div className="findcourt-user-info">
                        <img
                          src={r.userAvatar || userImg}
                          alt={r.userName}
                          className="findcourt-user-image"
                          onError={e => { e.target.src = userImg; }}
                        />
                        <div className="findcourt-user-details">
                          <p className="findcourt-user-name"><strong>{r.userName}</strong></p>
                          <p className="findcourt-user-rating">
                            <span className="stars">{renderStars(r.rating)}</span>
                          </p>
                        </div>
                      </div>
                      <p>Sân: {r.courtName} — {r.branchName}</p>
                      <p>Đánh giá: {r.comment}</p>
                      <p className="feedback-datetime">
                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="findCourtFooter"><Footer /></div>
    </div>
  );
};

export default FindCourt;
