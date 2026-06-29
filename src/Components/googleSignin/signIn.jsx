import React, { useState, useEffect } from "react";
import { auth, provider } from "./config";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';
import { toast } from "react-toastify";

const SignIn = () => {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithPopup(auth, provider);

      // Lấy Google ID token (không phải Firebase token) để BE validate qua Google tokeninfo API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const googleIdToken = credential?.idToken;

      if (!googleIdToken) {
        toast.error('Không lấy được Google token. Vui lòng thử lại.');
        return;
      }

      const response = await fetch(
        `${API_BASE}/auth/google`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: googleIdToken }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const returnedToken = data.accessToken;
        sessionStorage.setItem('token', returnedToken);
        if (data.user) sessionStorage.setItem('user', JSON.stringify(data.user));
        setValue(returnedToken);
        toast.success('Đăng nhập thành công!');

        const role = data.user?.role || '';
        if (role === 'SuperAdmin') navigate('/admin/dashboard');
        else if (role === 'PartnerAdmin' || role === 'BranchManager') navigate('/owner/dashboard');
        else if (role === 'Staff') navigate('/staff/booking');
        else navigate('/home');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message || 'Đăng nhập thất bại.');
      }
    } catch (error) {
      toast.error('Lỗi: ' + error.message);
    }
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    if (storedToken) {
      setValue(storedToken);
      navigate('/home');
    }
  }, [navigate]);

  return (
    <div className='return'>
      {!value && (
        <div onClick={handleClick} style={{ cursor: 'pointer' }}>
          <FcGoogle className='icon' />
        </div>
      )}
    </div>
  );
};

export default SignIn;
