import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../css/detailuser/usernotificationsetting.module.css';
import { Context } from '../login/context';

const UserNotificationSetting = () => {
  const { user } = useContext(Context);
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    notify_order: true,
    notify_news: true,
    notify_account: true,
    notify_system: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axios.get(`${API_URL}/api/v1/user-notification-settings`, {
        withCredentials: true,
      });

      if (res.data?.errCode === 0 && res.data.data) {
        setSettings({
          notify_order: Boolean(res.data.data.notify_order),
          notify_news: Boolean(res.data.data.notify_news),
          notify_account: Boolean(res.data.data.notify_account),
          notify_system: Boolean(res.data.data.notify_system),
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải cài đặt thông báo:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      } else {
        setMessage({ type: 'error', text: 'Không thể tải cài đặt thông báo.' });
      }
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, navigate]);

  useEffect(() => {
    if (user?.auth) {
      fetchSettings();
    }
  }, [user, fetchSettings]);

  const handleToggle = async (key) => {
    const updatedSettings = {
      ...settings,
      [key]: !settings[key],
    };

    setSettings(updatedSettings);

    try {
      const res = await axios.patch(
        `${API_URL}/api/v1/user-notification-settings`,
        updatedSettings,
        { withCredentials: true }
      );
      if (res.data?.errCode === 0) {
        setMessage({ type: 'success', text: 'Đã cập nhật cài đặt!' });
      } else {
        setSettings(settings);
        setMessage({ type: 'error', text: res.data?.message || 'Cập nhật thất bại.' });
      }
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt thông báo:', error);
      setSettings(settings);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu cài đặt.' });
      }
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (isLoading) {
    return <div className={styles.loading}>Đang tải cài đặt thông báo...</div>;
  }

  return (
    <div className={styles.formBox}>
      <h5>Cài đặt thông báo</h5>
      <p className={styles.subTitle}>
        Tùy chỉnh danh mục thông báo bạn muốn nhận từ ESHOP.
      </p>

      {message.text && (
        <div className={message.type === 'success' ? styles.success : styles.error}>
          {message.text}
        </div>
      )}

      <div className={styles.settingList}>
        <div className={styles.infoItem}>
          <div className={styles.itemContent}>
            <div className={styles.itemTitleGroup}>
              <i className={`fa-solid fa-bag-shopping ${styles.itemIcon}`}></i>
              <span className={styles.infoLabel}>Thông báo đơn hàng</span>
            </div>
            <p className={styles.itemDescription}>
              Nhận cập nhật về trạng thái đơn hàng, thanh toán ZaloPay và hành trình vận chuyển.
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.notify_order}
              onChange={() => handleToggle('notify_order')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.itemContent}>
            <div className={styles.itemTitleGroup}>
              <i className={`fa-solid fa-bullhorn ${styles.itemIcon}`}></i>
              <span className={styles.infoLabel}>Tin tức & Khuyến mãi</span>
            </div>
            <p className={styles.itemDescription}>
              Nhận tin tức sản phẩm mới, mã giảm giá Voucher và các chương trình ưu đãi đặc biệt.
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.notify_news}
              onChange={() => handleToggle('notify_news')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.itemContent}>
            <div className={styles.itemTitleGroup}>
              <i className={`fa-solid fa-shield-halved ${styles.itemIcon}`}></i>
              <span className={styles.infoLabel}>Tài khoản & Bảo mật</span>
            </div>
            <p className={styles.itemDescription}>
              Cảnh báo bảo mật, thông báo đổi mật khẩu và cập nhật thông tin cá nhân.
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.notify_account}
              onChange={() => handleToggle('notify_account')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.infoItem}>
          <div className={styles.itemContent}>
            <div className={styles.itemTitleGroup}>
              <i className={`fa-solid fa-gear ${styles.itemIcon}`}></i>
              <span className={styles.infoLabel}>Thông báo hệ thống</span>
            </div>
            <p className={styles.itemDescription}>
              Thông báo bảo trì hệ thống, điều khoản dịch vụ và các tin nhắn quản trị quan trọng.
            </p>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={settings.notify_system}
              onChange={() => handleToggle('notify_system')}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default UserNotificationSetting;