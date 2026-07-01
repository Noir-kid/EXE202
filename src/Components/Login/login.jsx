import React, { useState } from 'react';
import './login.css';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { auth } from '../googleSignin/config';
import { signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { API_BASE } from '../../config';

const roleToPath = {
    SuperAdmin:    '/admin',
    PartnerAdmin:  '/owner',
    BranchManager: '/owner',
    Staff:         '/staff',
    Customer:      '/home',
};

const Login = ({ onSwitchToRegister }) => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd]   = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();

    const saveAndRedirect = (data) => {
        sessionStorage.setItem('token', data.accessToken);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        const path = roleToPath[data.user.role] || '/home';
        navigate(path);
        setTimeout(() => toast.success('Đăng nhập thành công!'), 100);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) { toast.error('Vui lòng điền đầy đủ thông tin.'); return; }
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                const err = await res.text();
                toast.warning(err.includes('khóa') ? 'Tài khoản đã bị khóa.' : 'Email hoặc mật khẩu không đúng.');
                return;
            }
            saveAndRedirect(await res.json());
        } catch {
            toast.error('Lỗi kết nối. Vui lòng thử lại.');
        }
    };

    const handleGoogleLogin = (e) => {
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
            <h2 className="sg-form-title">Đăng nhập</h2>
            <p className="sg-form-switch">
                Chưa có tài khoản?{' '}
                <span className="sg-form-link" onClick={onSwitchToRegister}>Đăng ký ngay</span>
            </p>

            <div className="sg-social-btns">
                <button className="sg-social-btn" type="button" onClick={handleGoogleLogin} disabled={googleLoading}>
                    <FcGoogle size={20} /> {googleLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Google'}
                </button>
            </div>

            <div className="sg-divider"><span>Hoặc đăng nhập bằng email</span></div>

            <form onSubmit={handleLogin} className="sg-form">
                <div className="sg-field">
                    <label>Email</label>
                    <div className="sg-input-box">
                        <MdEmail className="sg-field-icon" />
                        <input type="email" placeholder="example@email.com"
                            value={email} onChange={e => setEmail(e.target.value)} />
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
                <div className="sg-form-row">
                    <Link to="/verifyAccount" className="sg-form-link">Quên mật khẩu?</Link>
                </div>
                <button type="submit" className="sg-submit-btn sg-green-btn">Đăng nhập</button>
            </form>
        </div>
    );
};

export default Login;
