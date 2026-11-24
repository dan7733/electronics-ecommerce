import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import styles from '../css/detailuser/detailuser.module.css';
import { Context } from '../login/context';

const UserLayout = () => {
  const { user } = useContext(Context);
  const navigate = useNavigate();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Bảo vệ toàn bộ khu vực tài khoản từ cấp Layout
  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className={styles.contentWrapper}>
        {/* Thanh Header Mobile */}
        {isMobile && (
          <div className={styles.mobileTopBar}>
            <button
              className={styles.sidebarToggle}
              onClick={toggleSidebar}
              aria-label="Danh mục tài khoản"
            >
              <i className={`fa-solid ${sidebarVisible ? 'fa-xmark' : 'fa-bars-staggered'} me-2`}></i>
              <span>{sidebarVisible ? 'Đóng danh mục' : 'Danh mục tài khoản'}</span>
            </button>
          </div>
        )}

        {/* Lớp phủ mờ nền khi bật Menu trên Mobile */}
        {isMobile && sidebarVisible && (
          <div className={styles.sidebarOverlay} onClick={closeSidebar}></div>
        )}

        <div className={styles.layoutContainer}>
          <aside className={`${styles.sidebarUser} ${sidebarVisible ? styles.show : ''}`}>
            <div className={styles.sidebarHeader}>
              <h4 className={styles.sidebarTitle}>Tài khoản của</h4>
              <h4 className={styles.sidebarUsername}>
                {user?.fullname || user?.username || 'Khách'}
              </h4>
            </div>

            <nav className={styles.sidebarNav}>
              {/* Nhóm Quản lý tài khoản (Dropdown/Collapse) */}
              <div className={styles.navSection}>
                <button
                  className={styles.navCollapseButton}
                  data-bs-toggle="collapse"
                  data-bs-target="#accountCollapse"
                  aria-expanded="false"
                  aria-controls="accountCollapse"
                  type="button"
                >
                  <span>
                    <i className="fa-solid fa-user me-2"></i>Quản lý tài khoản
                  </span>
                  <i className="fa-solid fa-chevron-down small"></i>
                </button>
                <div className={`collapse ${styles.navCollapseContent}`} id="accountCollapse">
                  <Link
                    className={styles.navLink}
                    to={`/account/${user?.username || ''}`}
                    onClick={closeSidebar}
                  >
                    Hồ sơ
                  </Link>
                  <Link
                    className={styles.navLink}
                    to={`/account/changeinfor/${user?.username || ''}`}
                    onClick={closeSidebar}
                  >
                    Cập nhật
                  </Link>
                  <Link
                    className={styles.navLink}
                    to={`/account/changepassword/${user?.username || ''}`}
                    onClick={closeSidebar}
                  >
                    Đổi mật khẩu
                  </Link>
                  <Link
                    className={styles.navLink}
                    to={`/account/notification-settings/${user?.username || ''}`}
                    onClick={closeSidebar}
                  >
                    Cài đặt thông báo
                  </Link>
                </div>
              </div>

              {/* Các liên kết điều hướng độc lập */}
              <Link
                className={styles.navLink}
                to={`/account/orderlist/${user?.username || ''}`}
                onClick={closeSidebar}
              >
                <i className="fa-solid fa-list me-2"></i>Quản lý đơn hàng
              </Link>
              <Link
                className={styles.navLink}
                to="/account/wishlist"
                onClick={closeSidebar}
              >
                <i className="fa-solid fa-heart me-2"></i>Sản phẩm yêu thích
              </Link>
              <Link
                className={styles.navLink}
                to="/account/readinglist"
                onClick={closeSidebar}
              >
                <i className="fa-solid fa-bookmark me-2"></i>Danh sách đọc
              </Link>
              <Link
                className={styles.navLink}
                to={`/account/notifications/${user?.username || ''}`}
                onClick={closeSidebar}
              >
                <i className="fa-solid fa-bell me-2"></i>Thông báo
              </Link>
            </nav>
          </aside>

          <div className={styles.mainContent}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;