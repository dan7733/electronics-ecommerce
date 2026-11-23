import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Context } from '../login/context';
import styles from '../css/detailuser/review.module.css';

const ReviewForm = ({ orderId, productId, productName, existingReview, onReviewSubmitted }) => {
  const { user } = useContext(Context);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy URL trực tiếp từ biến môi trường .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Pre-populate form with existing review data
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (rating < 1 || rating > 5) {
      setError('Vui lòng chọn số sao từ 1 đến 5.');
      setIsSubmitting(false);
      return;
    }

    if (!user?.username) {
      setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
      setIsSubmitting(false);
      return;
    }

    if (!productId) {
      setError('Không tìm thấy thông tin sản phẩm. Vui lòng thử lại.');
      setIsSubmitting(false);
      return;
    }

    try {
      const requestData = {
        order_id: orderId,
        product_id: productId,
        username: user.username,
        rating,
        comment,
      };

      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        withCredentials: true,
      };

      let response;
      if (existingReview) {
        // Update existing review - Thay thế localhost bằng API_URL
        response = await axios.put(`${API_URL}/api/v1/review`, requestData, config);
      } else {
        // Create new review - Thay thế localhost bằng API_URL
        response = await axios.post(`${API_URL}/api/v1/review`, requestData, config);
      }

      setSuccess(response.data.message || 'Đánh giá đã được gửi thành công!');
      // Reset form if it was a new review
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
      onReviewSubmitted();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.reviewForm}>
      <h6>Đánh giá sản phẩm: {productName}</h6>
      {error && <p className={`text-danger ${styles.error}`}>{error}</p>}
      {success && <p className={`text-success ${styles.success}`}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className={styles.starRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`${styles.star} ${rating >= star ? styles.filled : ''}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>
        <div className={styles.textareaWrapper}>
          <textarea
            className="form-control"
            placeholder="Nhận xét của bạn"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            disabled={isSubmitting}
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            ></span>
          ) : existingReview ? (
            'Cập nhật đánh giá'
          ) : (
            'Gửi đánh giá'
          )}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;