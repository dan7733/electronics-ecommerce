import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../css/detailuser/usernotification.module.css';
import { Context } from '../login/context';

const UserNotification = () => {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quản lý số lượng thông báo hiển thị (Mặc định 10)
  const [displayLimit, setDisplayLimit] = useState(10);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Lấy danh sách thông báo với limit
  const fetchNotifications = useCallback(async (limitCount) => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/v1/user-notifications?limit=${limitCount}`, {
        withCredentials: true,
      });
      if (res.data?.errCode === 0) {
        setNotifications(res.data.data || []);
      } else {
        setError('Không thể tải danh sách thông báo.');
      }
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      } else {
        setError('Đã xảy ra lỗi khi tải thông báo.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, navigate]);

  useEffect(() => {
    if (user?.auth) {
      fetchNotifications(displayLimit);
    }
  }, [user, displayLimit, fetchNotifications]);

  const handleMarkRead = async (noti) => {
    if (!noti.is_read) {
      try {
        await axios.patch(
          `${API_URL}/api/v1/user-notifications/read/${noti.notification_id}`,
          {},
          { withCredentials: true }
        );
        setNotifications((prev) =>
          prev.map((item) =>
            item.notification_id === noti.notification_id ? { ...item, is_read: true } : item
          )
        );
      } catch (err) {
        console.error('Lỗi khi đánh dấu đã đọc:', err);
      }
    }

    if (noti.link) {
      navigate(noti.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch(
        `${API_URL}/api/v1/user-notifications/read-all`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (err) {
      console.error('Lỗi đánh dấu tất cả đã đọc:', err);
    }
  };

  // Nút Tải thêm 5 thông báo nữa
  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 5);
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'order') return item.type === 'order';
    if (activeTab === 'news') return item.type === 'news';
    if (activeTab === 'system') return item.type === 'system' || item.type === 'account';
    return true;
  });

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const getNotiIcon = (type) => {
    switch (type) {
      case 'order':
        return 'fa-box-archive';
      case 'news':
        return 'fa-bullhorn';
      case 'account':
        return 'fa-user-shield';
      default:
        return 'fa-bell';
    }
  };

  if (isLoading && notifications.length === 0) {
    return <div className={styles.loading}>Đang tải thông báo...</div>;
  }

  return (
    <div className={styles.formBox}>
      <div className={styles.headerBox}>
        <div className={styles.headerTitleGroup}>
          <h5>Thông báo của tôi</h5>
          {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount} chưa đọc</span>}
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            <i className="fa-solid fa-check-double me-1"></i> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <i className="fa-solid fa-layer-group me-1"></i> Tất cả ({notifications.length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'order' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('order')}
        >
          <i className="fa-solid fa-bag-shopping me-1"></i> Đơn hàng (
          {notifications.filter((n) => n.type === 'order').length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'news' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('news')}
        >
          <i className="fa-solid fa-bullhorn me-1"></i> Tin tức (
          {notifications.filter((n) => n.type === 'news').length})
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'system' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <i className="fa-solid fa-gear me-1"></i> Hệ thống (
          {notifications.filter((n) => n.type === 'system' || n.type === 'account').length})
        </button>
      </div>

      <div className={styles.notiList}>
        {filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.map((noti) => (
              <div
                key={noti.notification_id}
                className={`${styles.infoItem} ${!noti.is_read ? styles.unreadItem : ''}`}
                onClick={() => handleMarkRead(noti)}
              >
                <div className={styles.notiIconWrapper}>
                  <i className={`fa-solid ${getNotiIcon(noti.type)} ${styles.notiIcon}`}></i>
                </div>

                <div className={styles.notiBody}>
                  <div className={styles.notiHeaderLine}>
                    <span className={styles.infoLabel}>{noti.title}</span>
                    <span className={styles.notiTime}>
                      {new Date(noti.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className={styles.notiText}>{noti.message}</p>
                  {noti.link && (
                    <span className={styles.linkHint}>
                      Xem chi tiết <i className="fa-solid fa-arrow-right ms-1"></i>
                    </span>
                  )}
                </div>

                {!noti.is_read && <div className={styles.unreadDot} title="Chưa đọc"></div>}
              </div>
            ))}

            {/* Nút Xem Thêm */}
            {notifications.length >= displayLimit && (
              <div className="text-center my-3">
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={handleLoadMore} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Đang tải...' : 'Xem thêm thông báo cũ hơn'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <i className="fa-regular fa-bell-slash"></i>
            <p>Không có thông báo nào trong mục này.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserNotification;