import React from 'react';
import './footer.css';
import { Link } from 'react-router-dom';
import { MdEmail, MdPhone, MdLocationOn } from 'react-icons/md';
import logo from '../../Assets/logo.svg';

const Footer = () => {
    return (
        <footer className="sg-footer" id="contacts">
            <div className="sg-footer-inner">
                {/* Brand column */}
                <div className="sg-footer-brand">
                    <div className="sg-footer-logo">
                        <img src={logo} alt="SportSG" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 7 }} />
                        <span>SportSG</span>
                    </div>
                    <p className="sg-footer-tagline">
                        Nền tảng kết nối người chơi thể thao và các chủ sân hàng đầu Việt Nam.
                    </p>
                </div>

                {/* Dịch vụ */}
                <div className="sg-footer-col">
                    <h4 className="sg-footer-heading">DỊCH VỤ</h4>
                    <ul>
                        <li><span>Đặt sân bóng đá</span></li>
                        <li><span>Đặt sân cầu lông</span></li>
                        <li><span>Đặt sân Tennis</span></li>
                        <li><span>Giải đấu thể thao</span></li>
                    </ul>
                </div>

                {/* Hỗ trợ */}
                <div className="sg-footer-col">
                    <h4 className="sg-footer-heading">HỖ TRỢ</h4>
                    <ul>
                        <li><span>Trung tâm trợ giúp</span></li>
                        <li><span>Chính sách bảo mật</span></li>
                        <li><span>Điều khoản sử dụng</span></li>
                        <li><Link to="/contacts">Liên hệ quảng cáo</Link></li>
                    </ul>
                </div>

                {/* Liên hệ */}
                <div className="sg-footer-col">
                    <h4 className="sg-footer-heading">LIÊN HỆ</h4>
                    <ul className="sg-footer-contact">
                        <li>
                            <MdEmail />
                            <a href="mailto:contact@sportsg.vn">contact@sportsg.vn</a>
                        </li>
                        <li>
                            <MdPhone />
                            <span>1900 6868</span>
                        </li>
                        <li>
                            <MdLocationOn />
                            <span>Quận 1, TP. Hồ Chí Minh</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="sg-footer-bottom">
                <p>© 2024 SportSG. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
