import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import styles from '../css/productreviews/productreviews.module.css';

const ProductReviews = () => {
  const { id: productId } = useParams(); // Get product_id from URL
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [starFilter, setStarFilter] = useState('all'); // Filter state: 'all', '5', '4', '3', '2', '1'
  const [ratingStats, setRatingStats] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
    total: 0,
  });

  // Sử dụng trực tiếp biến môi trường từ file .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Fetch reviews for the product
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // Thay thế localhost bằng API_URL cho API lấy review
        const response = await axios.get(`${API_URL}/api/v1/reviews/${productId}`);
        if (response.data.errCode === 0) {
          const fetchedReviews = response.data.data;
          setReviews(fetchedReviews);
          setFilteredReviews(fetchedReviews); // Initially show all reviews
          // Calculate rating statistics
          const stats = {
            5: fetchedReviews.filter((r) => r.rating === 5).length,
            4: fetchedReviews.filter((r) => r.rating === 4).length,
            3: fetchedReviews.filter((r) => r.rating === 3).length,
            2: fetchedReviews.filter((r) => r.rating === 2).length,
            1: fetchedReviews.filter((r) => r.rating === 1).length,
            total: fetchedReviews.length,
          };
          setRatingStats(stats);
          console.log('Fetched reviews:', fetchedReviews);
          console.log('Rating stats:', stats);
        } else {
          console.error('Error fetching reviews:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId, API_URL]); // Thêm API_URL vào dependency array

  // Update filtered reviews when starFilter changes
  useEffect(() => {
    if (starFilter === 'all') {
      setFilteredReviews(reviews);
    } else {
      const rating = parseInt(starFilter);
      setFilteredReviews(reviews.filter((review) => review.rating === rating));
    }
  }, [starFilter, reviews]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFilterChange = (filter) => {
    setStarFilter(filter);
  };

  return (
    <div className="container mt-5">
      <div className={styles['reviews-container']}>
        <h2 className={styles['reviews-title']}>
          <i className="fa-solid fa-star"></i> ĐÁNH GIÁ SẢN PHẨM
        </h2>

        {/* Rating Statistics */}
        <div className={styles['rating-stats']}>
          <h3 className={styles['stats-title']}>Thống kê đánh giá</h3>
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className={styles['stat-row']}>
              <span className={styles['stat-label']}>{star} sao</span>
              <div className={styles['progress-bar']}>
                <div
                  className={styles['progress-fill']}
                  style={{
                    width: `${
                      ratingStats.total > 0 ? (ratingStats[star] / ratingStats.total) * 100 : 0
                    }%`,
                  }}
                ></div>
              </div>
              <span className={styles['stat-count']}>({ratingStats[star]})</span>
            </div>
          ))}
        </div>

        {/* Star Filter */}
        <div className={styles['star-filter']}>
          <button
            className={`${styles['filter-button']} ${
              starFilter === 'all' ? styles['active'] : ''
            }`}
            onClick={() => handleFilterChange('all')}
          >
            Tất cả
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              className={`${styles['filter-button']} ${
                starFilter === star.toString() ? styles['active'] : ''
              }`}
              onClick={() => handleFilterChange(star.toString())}
            >
              {star} sao
            </button>
          ))}
        </div>

        {filteredReviews.length === 0 ? (
          <p className={styles['no-reviews']}>
            {starFilter === 'all'
              ? 'Chưa có đánh giá nào cho sản phẩm này.'
              : `Chưa có đánh giá ${starFilter} sao nào.`}
          </p>
        ) : (
          <div className={styles['reviews-list']}>
            {filteredReviews.map((review, index) => (
              <div
                key={review.review_id}
                className={`${styles['review-item']} ${styles['fade-in']}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles['review-header']}>
                  <div className={styles['review-user']}>
                    {review.User?.avatar ? (
                      <img
                        // Thay thế localhost bằng API_URL cho ảnh đại diện user trong review
                        src={`${API_URL}/images/useravatar/${review.User.avatar}`}
                        alt={review.User.fullname || 'Người dùng'}
                        className={styles['review-avatar']}
                      />
                    ) : (
                      <i
                        className={`fa-solid fa-user ${styles['review-avatar-placeholder']}`}
                      ></i>
                    )}
                    <span className={styles['review-username']}>
                      {review.User?.fullname || 'Người dùng ẩn danh'}
                    </span>
                  </div>
                  <div className={styles['review-rating']}>
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`fa-solid fa-star ${
                          i < review.rating ? styles['star-filled'] : styles['star-empty']
                        }`}
                      ></i>
                    ))}
                  </div>
                </div>
                <p
                  className={styles['review-comment']}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(review.comment || 'Không có nhận xét.', {
                      ALLOWED_TAGS: ['p', 'br', 'strong'],
                    }),
                  }}
                />
                <p className={styles['review-date']}>{formatDate(review.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;