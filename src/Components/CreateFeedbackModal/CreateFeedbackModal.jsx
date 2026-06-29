import React, { useState } from 'react';
import { Modal, Rate, Input, Button } from 'antd';
import { fetchWithAuth } from '../fetchWithAuth/fetchWithAuth';
import { API_BASE } from '../../config';
import './CreateFeedbackModal.css';

const { TextArea } = Input;

const CreateFeedbackModal = ({ visible, onCancel, bookingId, branchId, userId }) => {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);

  const handleSubmitFeedback = async (event) => {
    event.preventDefault();
    try {
      const res = await fetchWithAuth(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, rating, comment: feedback }),
      });
      if (res.ok) onCancel();
      else console.error('Feedback submission failed');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      footer={null}
      centered={true}
    >
      <div className="cfm-fb-info">
      <h1>FeedBack</h1>
      <p>Booking ID: {bookingId}</p>
      <p>Branch Id: {branchId}</p>
      </div>

      <form onSubmit={handleSubmitFeedback}>
        <div className="cfm-form-group">
          <label htmlFor="rating">Rating:</label>
          <Rate
            id="rating"
            name="rating"
            value={rating}
            onChange={(value) => setRating(value)}
          />
        </div>
        <div className="cfm-feedback-group">
          <label htmlFor="feedback">Feedback:</label>
          <TextArea
            id="feedback"
            name="feedback"
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <div className="cfm-btn">
          <Button className="cfm-btn-cancel" type="default" onClick={onCancel}>Cancel</Button>
          <Button className="cfm-btn-submit" type="primary" htmlType="submit">Submit Feedback</Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateFeedbackModal;
