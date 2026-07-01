import React, { useState } from 'react';
import './login.css';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { auth } from '../googleSignin/config';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
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

    const handleGoogleLogin = async (e) => {
        e.preventDefault();
        // Chặn double-click: nếu 1 popup đang mở, request thứ 2 sẽ bị Firebase
        // huỷ với lỗi "auth/cancelled-popup-request".
        if (googleLoading) return;
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result   = await signInWithPopup(auth, provider);

            // Lấy Google OAuth id_token (không phải Firebase token)
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const idToken    = credential?.idToken;

            if (!idToken) {
                toast.error('Không lấy được Google token. Vui lòng thử lại.');
                return;
            }

            const res = await fetch(`${API_BASE}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (res.ok) {
                saveAndRedirect(await res.json());
            } else {
                const err = await res.json().catch(() => ({}));
                toast.error(err.detail || err.message || err.title || 'Đăng nhập Google thất bại.');
            }
        } catch (err) {
            // Người dùng tự đóng popup / bấm huỷ — không phải lỗi thật, đừng làm phiền.
            if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
                return;
            }
            if (err.code === 'auth/popup-blocked') {
                toast.error('Trình duyệt đã chặn popup đăng nhập. Vui lòng cho phép popup và thử lại.');
                return;
            }
            if (err.code === 'auth/network-request-failed') {
                toast.error('Lỗi mạng khi đăng nhập Google. Vui lòng kiểm tra kết nối và thử lại.');
                return;
            }
            toast.error('Lỗi: ' + err.message);
        } finally {
            setGoogleLoading(false);
        }
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
