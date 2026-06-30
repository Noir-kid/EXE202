import React, { useState } from 'react';
import './login.css';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
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
                toast.error(err.message || err.title || 'Đăng nhập Google thất bại.');
            }
        } catch (err) {
            toast.error('Lỗi: ' + err.message);
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
                <button className="sg-social-btn" type="button" onClick={handleGoogleLogin}>
                    <FcGoogle size={20} /> Đăng nhập với Google
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
