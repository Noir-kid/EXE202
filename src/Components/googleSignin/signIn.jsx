import React, { useState, useEffect } from "react";
import { auth, provider } from "./config";
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';
import { toast } from "react-toastify";

const SignIn = () => {
  const [value, setValue] = useState('');
  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    const googleProvider = new GoogleAuthProvider();
    // Redirect tới Google — kết quả được xử lý bởi useGoogleRedirectResult ở App.js
    signInWithRedirect(auth, googleProvider).catch((error) => {
      toast.error('Lỗi: ' + error.message);
    });
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
