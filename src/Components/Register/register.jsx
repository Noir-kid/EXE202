import React, { useState } from 'react';
import './register.css';
import { toast } from 'react-toastify';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdPhone } from 'react-icons/md';
import { IoPersonOutline } from 'react-icons/io5';
import { FcGoogle } from 'react-icons/fc';
import { auth } from '../googleSignin/config';
import { signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { API_BASE } from '../../config';

const Register = ({ onSwitchToLogin }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName,  setLastName]  = useState('');
    const [email,     setEmail]     = useState('');
    const [phone,     setPhone]     = useState('');
    const [password,  setPassword]  = useState('');
    const [showPwd,   setShowPwd]   = useState(false);
    const [agreed,    setAgreed]    = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const validate = () => {
        if (!firstName || !lastName) { toast.warning('Vui lòng nhập họ và tên'); return false; }
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
            toast.warning('Email không hợp lệ'); return false;
        }
        if (phone && !/^0\d{9}$/.test(phone)) {
            toast.warning('Số điện thoại phải có 10 chữ số, bắt đầu bằng 0'); return false;
        }
        if (password.length < 6) { toast.warning('Mật khẩu tối thiểu 6 ký tự'); return false; }
        if (!agreed) { toast.warning('Vui lòng đồng ý với điều khoản sử dụng'); return false; }
        return true;
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, firstName, lastName, phone }),
            });
            if (res.ok) {
                toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
                onSwitchToLogin?.();
            } else {
                const err = await res.text();
                toast.error(err.includes('đã') ? 'Email đã được đăng ký.' : 'Đăng ký thất bại.');
            }
        } catch {
            toast.error('Lỗi kết nối. Vui lòng thử lại.');
        }
    };

    const handleGoogleRegister = (e) => {
        e.preventDefault();
        if (googleLoading) return;
        setGoogleLoading(true);
        const provider = new GoogleAuthProvider();
        // Redirect tới Google — kết quả được xử lý bởi useGoogleRedirectResult ở App.js
        signInWithRedirect(auth, provider).catch((err) => {
            setGoogleLoading(false);
            toast.error('Lỗi: ' + err.message);
        });
    };

    return (
        <div className="sg-login-wrap">
            <h2 className="sg-form-title">Đăng ký tài khoản</h2>
            <p className="sg-form-switch">
                Đã có tài khoản?{' '}
                <span className="sg-form-link" onClick={onSwitchToLogin}>Đăng nhập</span>
            </p>

            <div className="sg-social-btns">
                <button className="sg-social-btn" type="button" onClick={handleGoogleRegister} disabled={googleLoading}>
                    <FcGoogle size={20} /> {googleLoading ? 'Đang xử lý...' : 'Đăng ký với Google'}
                </button>
            </div>

            <div className="sg-divider"><span>Hoặc đăng ký bằng email</span></div>

            <form onSubmit={handleRegister} className="sg-form">
                <div style={{ display: 'flex', gap: 8 }}>
                    <div className="sg-field" style={{ flex: 1 }}>
                        <label>Họ</label>
                        <div className="sg-input-box">
                            <IoPersonOutline className="sg-field-icon" />
                            <input type="text" placeholder="Nguyễn"
                                value={lastName} onChange={e => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div className="sg-field" style={{ flex: 1 }}>
                        <label>Tên</label>
                        <div className="sg-input-box">
                            <input type="text" placeholder="Văn A"
                                value={firstName} onChange={e => setFirstName(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="sg-field">
                    <label>Email</label>
                    <div className="sg-input-box">
                        <MdEmail className="sg-field-icon" />
                        <input type="email" placeholder="example@email.com"
                            value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                </div>

                <div className="sg-field">
                    <label>Số điện thoại</label>
                    <div className="sg-input-box">
                        <MdPhone className="sg-field-icon" />
                        <input type="tel" placeholder="09xxxxxxxx"
                            value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                </div>

                <div className="sg-field">
                    <label>Mật khẩu</label>
                    <div className="sg-input-box">
                        <MdLock className="sg-field-icon" />
                        <input type={showPwd ? 'text' : 'password'} placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)} />
                        <span className="sg-eye" onClick={() => setShowPwd(!showPwd)}>
                            {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                        </span>
                    </div>
                </div>

                <label className="sg-checkbox-label">
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                    <span>Tôi đồng ý với <span className="sg-form-link">Điều khoản sử dụng</span></span>
                </label>

                <button type="submit" className="sg-submit-btn sg-green-btn">Đăng ký</button>
            </form>
        </div>
    );
};

export default Register;
