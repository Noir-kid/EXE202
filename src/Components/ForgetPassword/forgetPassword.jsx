import React, { useState, useEffect } from 'react';
import './forgetpassword.css';
import Navbar from '../Navbar/Navbar';
import { API_BASE } from '../../config';


const ResetPassword = () => {
  const [userId, setUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('userId') || params.get('id');
    const tok = params.get('token');
    if (id) setUserId(id);
    if (tok) setToken(tok);
  }, []);

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu không khớp. Vui lòng thử lại.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token, newPassword }),
      });

      if (response.ok) {
        setMessage('Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
        setTimeout(() => { window.location.href = '/signin'; }, 2000);
      } else {
        const responseData = await response.json().catch(() => ({}));
        setMessage(responseData.message || 'Đổi mật khẩu thất bại.');
      }
    } catch (error) {
      setMessage('Lỗi kết nối. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <div><Navbar /></div>
      <div className='reset-password-wrapper'>
        <div className="reset-password-container">
          <h1 className='reset-password-title'>Reset Password</h1>
          <div className="reset-password-input-box">
            <i className="reset-password-input-icon fas fa-lock"></i>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="reset-password-input"
              placeholder='Enter new password'
              required
            />
          </div>
          <div className="reset-password-input-box">
            <i className="reset-password-input-icon fas fa-lock"></i>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="reset-password-input"
              placeholder='Confirm new password'
              required
            />
          </div>
          <button className='reset-password-button' onClick={handleResetPassword}>Reset Password</button>
          {message && <p className="forget-password-message">{message}</p>}
        </div>
      </div>
    </>
  );
}

export default ResetPassword;
