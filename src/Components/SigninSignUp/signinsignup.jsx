import React, { useState, useEffect } from 'react';
import './signinsignup.css';
import Login from '../Login/login';
import Register from '../Register/register';
import loginBg from '../../Assets/login.jpg';
import image3 from '../../Assets/image3.jpg';
import logo from '../../Assets/logo.svg';
import { MdCheckCircle } from 'react-icons/md';

const SignInSignUp = ({ defaultLoginVisible }) => {
    const [isLogin, setIsLogin] = useState(defaultLoginVisible);

    useEffect(() => {
        setIsLogin(defaultLoginVisible);
    }, [defaultLoginVisible]);

    const loginFeatures = [
        'Đặt sân chỉ trong 30 giây',
        'Hơn 500+ sân thể thao',
        'Thanh toán an toàn & bảo mật',
    ];

    const registerFeatures = [
        'Miễn phí đăng ký & sử dụng',
        'Ưu đãi độc quyền lên đến 50%',
        'Kết nối với đối thủ & đồng đội',
    ];

    return (
        <div className="sg-auth-page">
            {/* LEFT PANEL */}
            <div
                className="sg-auth-panel-left"
                style={{
                    backgroundImage: `url(${isLogin ? loginBg : image3})`,
                }}
            >
                <div
                    className="sg-auth-overlay"
                    style={{ background: isLogin ? 'rgba(15,35,64,0.88)' : 'rgba(194,65,12,0.85)' }}
                >
                    <div className="sg-auth-panel-content">
                        <div className="sg-auth-brand">
                            <img src={logo} alt="SportSG" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 10, background: 'white', padding: 3 }} />
                            <span>SportSG</span>
                        </div>

                        <h1 className="sg-panel-title">
                            {isLogin ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình thể thao!'}
                        </h1>

                        <p className="sg-panel-desc">
                            {isLogin
                                ? 'Đăng nhập để trải nghiệm đặt sân thể thao nhanh chóng và tiện lợi nhất.'
                                : 'Tham gia cộng đồng hơn 50,000+ người chơi thể thao trên khắp Việt Nam.'}
                        </p>

                        <ul className="sg-panel-features">
                            {(isLogin ? loginFeatures : registerFeatures).map((f, i) => (
                                <li key={i}>
                                    <MdCheckCircle className="sg-feature-check" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="sg-auth-panel-right">
                {isLogin
                    ? <Login onSwitchToRegister={() => setIsLogin(false)} />
                    : <Register onSwitchToLogin={() => setIsLogin(true)} />
                }
            </div>
        </div>
    );
};

export default SignInSignUp;
