import React, { useEffect, useState } from 'react';
import './PaySuccess.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config';

const PaySuccess = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(null);
  const [info, setInfo] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // VNPay redirect: xác nhận lại với BE (verify chữ ký + cập nhật booking)
    // thay vì tin thẳng vnp_ResponseCode trên URL, vì IPN server-to-server
    // của VNPay không gọi tới được BE khi chạy local (localhost không public).
    if (params.get('vnp_ResponseCode') !== null) {
      fetch(`${API_BASE}/payments/vnpay/callback${window.location.search}`)
        .then((res) => res.text())
        .then((text) => {
          setSuccess(text.includes('RspCode=00') ? 1 : -1);
          setInfo({
            ref: params.get('vnp_TransactionNo') || params.get('vnp_TxnRef'),
            amount: params.get('vnp_Amount') ? Number(params.get('vnp_Amount')) / 100 : null,
            gateway: 'VNPay',
          });
        })
        .catch(() => setSuccess(-1));
      return;
    }

    // MoMo callback: resultCode=0 = success
    if (params.get('resultCode') !== null) {
      const ok = params.get('resultCode') === '0';
      setSuccess(ok ? 1 : -1);
      setInfo({
        ref: params.get('transId') || params.get('orderId'),
        amount: params.get('amount') ? Number(params.get('amount')) : null,
        gateway: 'MoMo',
      });
      return;
    }

    // Fallback: ?msg=Success
    const msg = params.get('msg');
    if (msg === 'Success') setSuccess(1);
    else setSuccess(-1);
  }, []);

  const fmt = (n) => n?.toLocaleString('vi-VN');

  return (
    <div className={`pay-success-background ${success === -1 ? 'failure' : ''}`}>
      <div className='pay-success-paymentresult'>
        <div className="pay-success-container-paymentresult">
          {success === 1 ? (
            <>
              <div className="icon-payment">
                <i className="fas fa-check-circle" style={{ color: '#4CAF50' }}></i>
              </div>
              <h1>Thanh toán thành công!</h1>
              <p>Giao dịch của bạn đã được xử lý thành công.</p>
              {info.gateway && <p style={{ color: '#6b7280', fontSize: 14 }}>Cổng: {info.gateway}</p>}
              {info.ref && <p style={{ color: '#6b7280', fontSize: 14 }}>Mã GD: {info.ref}</p>}
              {info.amount && <p style={{ color: '#10b981', fontWeight: 600 }}>Số tiền: {fmt(info.amount)}đ</p>}
            </>
          ) : success === -1 ? (
            <>
              <div className="icon-payment">
                <i className="fas fa-times-circle" style={{ color: '#e53935' }}></i>
              </div>
              <h1>Thanh toán thất bại</h1>
              <p>Giao dịch không thể hoàn thành. Vui lòng thử lại.</p>
            </>
          ) : (
            <p>Đang xử lý...</p>
          )}
          {success !== null && (
            <button onClick={() => navigate(success === 1 ? '/bookingHistory' : '/bookingHistory')}>
              {success === 1 ? 'Xem lịch đặt sân' : 'Quay lại'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaySuccess;
