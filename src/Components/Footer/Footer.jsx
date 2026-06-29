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
                        <li><a href="#">Đặt sân bóng đá</a></li>
                        <li><a href="#">Đặt sân cầu lông</a></li>
                        <li><a href="#">Đặt sân Tennis</a></li>
                        <li><a href="#">Giải đấu thể thao</a></li>
                    </ul>
                </div>

                {/* Hỗ trợ */}
                <div className="sg-footer-col">
                    <h4 className="sg-footer-heading">HỖ TRỢ</h4>
                    <ul>
                        <li><a href="#">Trung tâm trợ giúp</a></li>
                        <li><a href="#">Chính sách bảo mật</a></li>
                        <li><a href="#">Điều khoản sử dụng</a></li>
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
