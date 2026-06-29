import React from 'react';
import './BuyFail.css';
import { useNavigate } from 'react-router-dom';

const BuyFail = () => {
  const navigate = useNavigate();
  return (
    <div className="pay-success-background">
      <div className="buyFail">
        <div className="buyFail_bodyContainer">
          <h1 className="buyFail_title">Giao dịch thất bại</h1>
          <article className="buyFail_article">
            <p className="buyFail_p">Rất tiếc, giao dịch của bạn không thể hoàn tất. Vui lòng thử lại sau.</p>
            <div className="buyFail_centerDiv">
              <button className="buyFail_btn" onClick={() => navigate('/findCourt')}>
                Quay lại đặt sân
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BuyFail;
