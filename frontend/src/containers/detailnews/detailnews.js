import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
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
  const location = useLocation();
  const { user } = useContext(Context);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchNews = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/detailnews/${newsid}`);
      if (response.data.errCode === 0) {
        setNews(response.data.news);
        setError(null);
      } else {
        setError(response.data.message || 'Không tìm thấy tin tức.');
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết tin tức:', err);
      setError('Có lỗi xảy ra khi tải dữ liệu tin tức.');
    } finally {
      setLoading(false);
    }
  }, [newsid, API_URL]);

  useEffect(() => {
    fetchNews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchNews]);

  const showTemporaryNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);
  };

  // NÚT QUAY LẠI THÔNG MINH - ĐIỀU HƯỚNG VỀ /newslist?page=X
  const handleBack = () => {
    if (location.state?.fromPage) {
      navigate(`/newslist?page=${location.state.fromPage}`);
    } else {
      navigate('/newslist'); // Cập nhật đúng đường dẫn /newslist
    }
  };

  const handleAddToReadingList = () => {
    if (isAddingToReadingList) return;
    setIsAddingToReadingList(true);

    const newsId = news?.news_id || news?.id;
    if (!newsId) {
      showTemporaryNotification('Không thể thêm tin tức do thiếu thông tin.');
      setIsAddingToReadingList(false);
      return;
    }

    if (!user || !user.auth) {
      showTemporaryNotification('Vui lòng đăng nhập để thêm vào danh sách đọc!');
      setIsAddingToReadingList(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    const readingListItem = {
      news_id: newsId,
      title: news.title,
      summary: news.summary,
      image: news.image,
    };

    const existingReadingList = JSON.parse(localStorage.getItem('readingList')) || [];
    const isAlreadyInReadingList = existingReadingList.some(
      (item) => item.news_id === readingListItem.news_id
    );

    if (isAlreadyInReadingList) {
      showTemporaryNotification(`Bài viết "${news.title}" đã có trong danh sách đọc!`);
      setIsAddingToReadingList(false);
      return;
    }

    existingReadingList.push(readingListItem);
    localStorage.setItem('readingList', JSON.stringify(existingReadingList));
    showTemporaryNotification(`Đã lưu "${news.title}" vào danh sách đọc!`);
    setIsAddingToReadingList(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showTemporaryNotification('Đã sao chép liên kết bài viết!');
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const estimateReadingTime = (content) => {
    if (!content) return '1 phút đọc';
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
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Đang tải chi tiết tin tức...</p>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={styles.errorState}>
        <i className="fas fa-exclamation-triangle mb-3"></i>
        <h5>{error || 'Không tìm thấy tin tức.'}</h5>
        <button onClick={handleBack} className={styles.actionBtnPrimary}>
          <i className="fas fa-arrow-left me-2"></i>Quay lại danh sách
        </button>
      </div>
    );
  }

  const sanitizedContent = DOMPurify.sanitize(news.content || '', {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'img', 'h1', 'h2', 'h3', 'h4', 'span', 'blockquote', 'a'],
    ALLOWED_ATTR: ['src', 'alt', 'href', 'target', 'style', 'class'],
    ADD_ATTR: ['loading'],
  });

  return (
    <div className={styles.pageContainer}>
      {/* Breadcrumb Navigation */}
      <nav className={styles.breadcrumbNav}>
        <Link to="/" className={styles.breadcrumbLink}>TRANG CHỦ</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <button onClick={handleBack} className={styles.breadcrumbButton}>TIN TỨC</button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>Chi tiết bài viết</span>
      </nav>

      <article className={styles.articleCard}>
        {/* Top Header */}
        <div className={styles.articleHeader}>
          <button onClick={handleBack} className={styles.backBtn} aria-label="Quay lại">
            <i className="fas fa-arrow-left"></i> Quay lại
          </button>

          <div className={styles.badgeCategory}>TIN TỨC SẢN PHẨM</div>

          <h1 className={styles.articleTitle}>{news.title}</h1>

          <div className={styles.metaRow}>
            <span>
              <i className="far fa-calendar-alt me-1"></i>
              {new Date(news.created_at || Date.now()).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
            <span className={styles.metaDot}>•</span>
            <span>
              <i className="far fa-clock me-1"></i>
              {estimateReadingTime(news.content)}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className={styles.actionBar}>
          <div className={styles.shareGroup}>
            <span className={styles.shareTitle}>Chia sẻ:</span>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialIcon} ${styles.fb}`}
              title="Chia sẻ lên Facebook"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
            <a
              href={shareLinks.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialIcon} ${styles.tw}`}
              title="Chia sẻ lên Twitter"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.socialIcon} ${styles.in}`}
              title="Chia sẻ lên LinkedIn"
            >
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>

          <div className={styles.buttonGroup}>
            <button onClick={handleCopyLink} className={styles.actionBtnOutline}>
              <i className={copied ? 'fas fa-check text-success' : 'fas fa-link'}></i>
              <span>{copied ? 'Đã sao chép' : 'Sao chép link'}</span>
            </button>

            <button
              onClick={handleAddToReadingList}
              disabled={isAddingToReadingList}
              className={styles.actionBtnTeal}
            >
              <i className="fas fa-bookmark"></i>
              <span>Lưu để đọc sau</span>
            </button>
          </div>
        </div>

        {/* Ảnh đại diện */}
        <div className={styles.imageWrapper}>
          <img
            src={news.image ? `${API_URL}/images/news/${news.image}` : 'https://via.placeholder.com/900x500'}
            alt={news.title}
            className={styles.featuredImage}
          />
        </div>

        {/* Tóm tắt */}
        {news.summary && (
          <div className={styles.summaryBox}>
            <p className={styles.summaryText}>{news.summary}</p>
          </div>
        )}

        {/* Nội dung */}
        <div className={styles.contentContainer}>
          <div
            className={styles.contentFormatted}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </div>

        {/* Footer */}
        <footer className={styles.articleFooter}>
          <button onClick={handleBack} className={styles.footerBtnOutline}>
            <i className="fas fa-arrow-left me-2"></i> Quay lại
          </button>
          <button onClick={scrollToTop} className={styles.footerBtnTeal}>
            <i className="fas fa-arrow-up me-2"></i> Trở lên trên
          </button>
        </footer>
      </article>

      {notification.show && (
        <div className={styles.notificationToast}>
          <div className={styles.toastContent}>
            <i className="fas fa-check-circle me-2"></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailNews;