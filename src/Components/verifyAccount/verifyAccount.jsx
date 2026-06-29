import React, { useState } from 'react';
import './verifyAccount.css';
import Navbar from '../Navbar/Navbar';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';

const VerifyAccount = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSendResetLink = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        setMessage('Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
      } else {
        setMessage('Không tìm thấy tài khoản với email này.');
      }
    } catch (error) {
      setMessage('Error sending reset link. Please check your email and try again.');
    }
  };

  return (
    <>
    <div><Navbar/></div>
    <div className='verifyaccount-background'>
    <div className='verifyaccount-wrapper'>
      <h1>Forget Password</h1>
      <div className="verifyaccount-input-box">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="verifyaccount-input"
          placeholder='Enter your email'
          required
        />
      </div>
      <button className='verifyaccount-button' onClick={handleSendResetLink}>Send Reset Link</button>
      {message && <p className="verifyaccount-message">{message}</p>}
    </div>
    </div>
    </>
  );
}

export default VerifyAccount;
