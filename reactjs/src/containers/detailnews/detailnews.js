import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DOMPurify from 'dompurify';
import styles from '../css/detailnews/detailnews.module.css';
import { Context } from '../login/context';

const DetailNews = () => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingToReadingList, setIsAddingToReadingList] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [copied, setCopied] = useState(false);
  const { newsid } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(Context);

  // Sử dụng trực tiếp biến môi trường không dùng fallback
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchNews = useCallback(async () => {
    try {
      // Cập nhật đường dẫn API
      const response = await axios.get(`${API_URL}/api/v1/detailnews/${newsid}`);
      console.log('API Response:', response.data); // Debug log
      if (response.data.errCode === 0) {
        setNews(response.data.news);
        setError(null);
      } else {
        setError(response.data.message || 'Không tìm thấy tin tức.');
      }
    } catch (err) {
      console.error('Error fetching news detail:', err);
      setError('Lỗi khi tải dữ liệu tin tức.');
    } finally {
      setLoading(false);
    }
  }, [newsid, API_URL]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const showTemporaryNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);
  };

  const handleAddToReadingList = () => {
    if (isAddingToReadingList) return;
    setIsAddingToReadingList(true);

    if (!news?.news_id) {
      console.error('News ID is missing:', news);
      showTemporaryNotification('Không thể thêm tin tức do thiếu thông tin.');
      setIsAddingToReadingList(false);
      return;
    }

    if (!user || !user.auth) {
      showTemporaryNotification('Vui lòng đăng nhập để thêm vào danh sách đọc!');
      setIsAddingToReadingList(false);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    const readingListItem = {
      news_id: news.news_id,
      title: news.title,
      summary: news.summary,
      image: news.image,
    };

    const existingReadingList = JSON.parse(localStorage.getItem('readingList')) || [];
    const isAlreadyInReadingList = existingReadingList.some(
      (item) => item.news_id === readingListItem.news_id
    );

    if (isAlreadyInReadingList) {
      showTemporaryNotification(`${news.title} đã có trong danh sách đọc!`);
      setIsAddingToReadingList(false);
      return;
    }

    existingReadingList.push(readingListItem);
    localStorage.setItem('readingList', JSON.stringify(existingReadingList));
    showTemporaryNotification(`Đã thêm ${news.title} vào danh sách đọc!`);
    setIsAddingToReadingList(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const estimateReadingTime = (content) => {
    const text = content.replace(/<[^>]+>/g, '');
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} phút đọc`;
  };

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(news?.title || '')}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(news?.title || '')}`,
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <i className="fas fa-spinner fa-spin"></i> Đang tải tin tức...
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={styles.error}>
        <i className="fas fa-exclamation-circle"></i> {error || 'Không tìm thấy tin tức.'}
      </div>
    );
  }

  const sanitizedContent = DOMPurify.sanitize(news.content || '', {
    ALLOWED_TAGS: ['p', 'strong', 'ul', 'li', 'br', 'img'],
    ALLOWED_ATTR: ['src', 'alt'],
    ADD_ATTR: ['loading'],
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={handleBack} className={styles.backButton} aria-label="Quay lại">
          <i className="fas fa-arrow-left"></i> Quay lại
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{news.title}</h1>
          <p className={styles.meta}>
            <i className="fas fa-calendar-alt"></i>
            {new Date(news.created_at).toLocaleDateString('vi-VN')} •{' '}
            <i className="fas fa-clock"></i> {estimateReadingTime(news.content)}
          </p>
        </div>
      </header>

      <div className={styles.imageContainer}>
        <img
          src={news.image ? `${API_URL}/images/news/${news.image}` : 'https://via.placeholder.com/900'}
          alt={news.title}
          className={styles.image}
          loading="lazy"
        />
      </div>

      <div className={styles.summaryContainer}>
        <p className={styles.summary}>{news.summary}</p>
      </div>

      <div className={styles.shareContainer}>
        <span className={styles.shareLabel}>Chia sẻ:</span>
        <a
          href={shareLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareIcon}
          title="Chia sẻ lên Facebook"
        >
          <i className="fab fa-facebook-f"></i>
        </a>
        <a
          href={shareLinks.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareIcon}
          title="Chia sẻ lên Twitter"
        >
          <i className="fab fa-twitter"></i>
        </a>
        <a
          href={shareLinks.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.shareIcon}
          title="Chia sẻ lên LinkedIn"
        >
          <i className="fab fa-linkedin-in"></i>
        </a>
        <button
          onClick={handleCopyLink}
          className={styles.copyButton}
          aria-label={copied ? 'Đã sao chép' : 'Sao chép liên kết'}
        >
          <i className={copied ? 'fas fa-check' : 'fas fa-link'}></i>
          {copied ? 'Đã sao chép!' : 'Sao chép liên kết'}
        </button>
        <button
          className={styles.bookmarkButton}
          onClick={handleAddToReadingList}
          disabled={isAddingToReadingList}
          aria-label="Thêm vào danh sách đọc"
        >
          <i className="fas fa-bookmark"></i> Lưu để đọc sau
        </button>
      </div>

      <div className={styles.contentContainer}>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      </div>

      <footer className={styles.footer}>
        <button
          onClick={handleBack}
          className={styles.footerBackButton}
          aria-label="Quay lại danh sách tin tức"
        >
          <i className="fas fa-arrow-left"></i> Quay lại
        </button>
        <button
          onClick={scrollToTop}
          className={styles.footerTopButton}
          aria-label="Lên đầu trang"
        >
          <i className="fas fa-arrow-up"></i> Trở lên trên
        </button>
      </footer>

      {notification.show && (
        <div className={styles.notification}>
          <div className={styles.notificationContent}>
            <i className="fas fa-check-circle"></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailNews;