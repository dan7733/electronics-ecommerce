import React, { useContext, useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import styles from '../css/detailuser/detailuser.module.css'; // Reuse existing styles
import { Context } from '../login/context'; // Adjusted path to match Header

const UserLayout = () => {
  const { user } = useContext(Context); // Access user from Context
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
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
    <div className="container-fluid">
      <div className={styles.contentWrapper}>
        {isMobile && (
          <button
            className={styles.sidebarToggle}
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        )}

        <div className={styles.layoutContainer}>
          <aside
            className={`${styles.sidebarUser} ${sidebarVisible ? styles.show : ''
              }`}
          >
            <div className={styles.sidebarHeader}>
              <h4 className={styles.sidebarTitle}>Tài khoản của</h4>
              <h4 className={styles.sidebarUsername}>
                {user?.fullname || user?.username || 'Khách'}
              </h4>
            </div>
            <nav className={styles.sidebarNav}>
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
                    to="/account/notification-settings"
                    onClick={closeSidebar}
                  >
                    Cài đặt thông báo
                  </Link>
                </div>
              </div>
              <Link
                className={styles.navLink}
                to={`/account/orderlist/${user?.username || ''}`}
                onClick={closeSidebar}
              >
                <i className="fa-solid fa-list me-2"></i>Quản lý đơn hàng
              </Link>
              <Link
                className={styles.navLink}
                to="/account/addresses"
                onClick={closeSidebar}
              >
                <i className="fa-solid fa-location-dot me-2"></i>Sổ địa chỉ
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
                to="/account/notifications"
                onClick={closeSidebar}
              >
                <i className="fa-solid fa-bell me-2"></i>Thông báo
              </Link>
            </nav>
          </aside>

          <div
            className={`${styles.mainContent} ${sidebarVisible && isMobile ? styles.hiddenMobile : ''
              }`}
          >
            <Outlet /> {/* Child route content will render here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLayout;