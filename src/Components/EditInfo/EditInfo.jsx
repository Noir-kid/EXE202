import React, { useState, useEffect } from 'react';
import './EditInfo.css';
import Header from '../Header/header';
import Footer from '../Footer/Footer';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import { imageDb } from '../googleSignin/config';
import { v4 } from 'uuid';
import { uploadBytes, getDownloadURL, ref } from 'firebase/storage';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import userImg from '../../Assets/user.jpg';
import { IoCreateOutline, IoCloudUploadOutline, IoSaveOutline } from 'react-icons/io5';

export default function EditInfo() {
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({ userId: '', firstName: '', lastName: '', email: '', phone: '', img: '' });
    const [userData, setUserData] = useState({});
    const [img, setImg] = useState(null);
    const [imgPreview, setImgPreview] = useState('');
    const [uploading, setUploading] = useState(false);

    const token = sessionStorage.getItem('token');

    useEffect(() => {
        if (!token) return;
        fetchWithAuth(`${API_BASE}/users/me`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    setUserInfo({ ...data, img: data.avatarUrl || '' });
                    setImgPreview(data.avatarUrl || '');
                }
            })
            .catch(() => {});
    }, [token]);

    const handleSave = () => {
        fetchWithAuth(`${API_BASE}/users/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: userInfo.firstName,
                lastName:  userInfo.lastName,
                phone:     userInfo.phone,
                avatarUrl: userInfo.img || null,
            }),
        })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(() => { toast.success('Cập nhật thông tin thành công!'); navigate('/viewInfo'); })
            .catch(() => toast.error('Cập nhật thất bại.'));
    };

    const handleImageChange = e => {
        const file = e.target.files[0];
        if (file) { setImg(file); setImgPreview(URL.createObjectURL(file)); }
    };

    const handleUpload = () => {
        if (!img) { toast.error('Chưa chọn ảnh'); return; }
        setUploading(true);
        const imgRef = ref(imageDb, `files/${v4()}`);
        uploadBytes(imgRef, img)
            .then(() => getDownloadURL(imgRef))
            .then(url => {
                setUserInfo(prev => ({ ...prev, img: url }));
                toast.success('Upload ảnh thành công!');
                setUploading(false);
            })
            .catch(() => { toast.error('Upload thất bại.'); setUploading(false); });
    };

    return (
        <div className="ei-page">
            <Header />

            <div className="ei-body">
                <div className="ei-container">
                    <div className="ei-card">
                        {/* Header */}
                        <div className="ei-card-header">
                            <div className="ei-header-icon"><IoCreateOutline /></div>
                            <h2>Chỉnh sửa hồ sơ</h2>
                        </div>

                        {/* Body */}
                        <div className="ei-card-body">
                            {/* Avatar */}
                            <div className="ei-avatar-col">
                                <div className="ei-avatar-ring">
                                    <img
                                        src={imgPreview || userInfo.img || userImg}
                                        alt="avatar"
                                        className="ei-avatar-img"
                                        onError={e => { e.target.src = userImg; }}
                                    />
                                </div>
                                <label className="ei-file-label" htmlFor="ei-file-input">
                                    Chọn ảnh
                                </label>
                                <input
                                    id="ei-file-input"
                                    type="file"
                                    className="ei-file-input"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <button className="ei-upload-btn" onClick={handleUpload} disabled={uploading}>
                                    <IoCloudUploadOutline />
                                    {uploading ? 'Đang tải...' : 'Upload ảnh'}
                                </button>
                            </div>

                            {/* Fields */}
                            <div className="ei-fields-col">
                                <div className="ei-two-col">
                                    <div className="ei-field">
                                        <label>Họ</label>
                                        <input
                                            type="text"
                                            placeholder="Nguyễn"
                                            value={userInfo.firstName}
                                            onChange={e => setUserInfo({ ...userInfo, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="ei-field">
                                        <label>Tên</label>
                                        <input
                                            type="text"
                                            placeholder="Văn A"
                                            value={userInfo.lastName}
                                            onChange={e => setUserInfo({ ...userInfo, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="ei-field">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        placeholder="example@email.com"
                                        value={userInfo.email}
                                        onChange={e => setUserInfo({ ...userInfo, email: e.target.value })}
                                    />
                                </div>

                                <div className="ei-field">
                                    <label>Số điện thoại</label>
                                    <input
                                        type="tel"
                                        placeholder="0901234567"
                                        value={userInfo.phone}
                                        onChange={e => setUserInfo({ ...userInfo, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="ei-card-footer">
                            <Link to="/viewInfo" className="ei-cancel-btn">Hủy</Link>
                            <button className="ei-save-btn" onClick={handleSave}>
                                <IoSaveOutline />
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
