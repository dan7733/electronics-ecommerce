import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/listlastestreviews/listlatestproduct.module.css';
import dfavatar from '../../img/avatar/avatar.png'; // Placeholder for user avatar

const ListLastestReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy URL trực tiếp từ biến môi trường
  const API_URL = process.env.REACT_APP_BACKEND_URL;
  const REVIEW_API_URL = `${API_URL}/api/v1/latestreviews`;

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const response = await axios.get(REVIEW_API_URL);
        setReviews(response.data.data || []);
      } catch (err) {
        setError('Unable to load reviews. Please try again.');
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [REVIEW_API_URL]);

  const renderReview = (review) => (
    <div className="col-lg-3 col-md-6 col-12 mb-4 d-flex align-items-stretch" key={review.review_id}>
      <Link
        className={`${styles['review-card']} w-100`}
        to={`/detailproduct/${review.product_id}`}
        aria-label={`View product ${review.Product.name}`}
      >
        <div className={styles['review-content']}>
          <div className={styles['review-header']}>
            <img
              src={review.User.avatar ? `${API_URL}/images/useravatar/${review.User.avatar}` : dfavatar}
              alt={`Avatar of ${review.User.username}`}
              className={styles.avatar}
              onError={(e) => (e.target.src = dfavatar)}
            />
            <div className={styles['user-info']}>
              <span className={styles.username}>{review.User.fullname || review.User.username}</span>
              <div className={styles.rating}>
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.star} ${i < review.rating ? styles.filled : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
          {/* Bình luận luôn hiển thị đầy đủ */}
          <p className={styles.comment}>{review.comment || 'No comment provided.'}</p>
          
          {/* Tên sản phẩm tự động neo ở dưới đáy */}
          <p className={styles['product-name']}>{review.Product.name}</p>
        </div>
      </Link>
    </div>
  );

  return (
    <section className={`${styles['reviews-section']} container`}>
      <div className={`${styles['section-header']} text-center mb-5`}>
        <h2 className={styles['section-title']}>Đánh giá mới nhất</h2>
      </div>
      <div className="row">
        {reviews.length > 0 ? (
          reviews.map(renderReview)
        ) : !loading && !error ? (
          <p className={`${styles['no-reviews']} text-center col-12`}>No reviews to display.</p>
        ) : null}
      </div>
      {loading && <div className={`${styles.loading} text-center mt-4`}>Loading...</div>}
      {error && <div className={`${styles.error} text-center mt-4 text-danger`}>{error}</div>}
    </section>
  );
};

export default ListLastestReviews;