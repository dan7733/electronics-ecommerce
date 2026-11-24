import React, { useEffect, useState, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import LOGO from '../../img/header/logo.png';
import { Context } from '../login/context';
import { getAccessToken } from '../login/userService';
import styles from '../css/header/header.module.css';
import DFavatar from '../../img/avatar/avatar.png';

const Header = () => {
  const { user, logoutContext } = useContext(Context);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // State quản lý Thông báo người dùng
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef(null);

  // 1. Lấy danh sách Loại sản phẩm & Thương hiệu
  useEffect(() => {
    axios.get(`${API_URL}/api/v1/listcategory`)
      .then(response => setCategories(response.data.categories || []))
      .catch(error => console.error('Error fetching categories:', error));

    axios.get(`${API_URL}/api/v1/listbrand`)
      .then(response => setBrands(response.data.brands || []))
      .catch(error => console.error('Error fetching brands:', error));
  }, [API_URL]);

  // 2. Hàm gọi API lấy thông báo của User (Sử dụng Token từ Context hoặc getAccessToken)
  const fetchNotifications = useCallback(async () => {
    try {
      const token = getAccessToken() || user?.accessToken;
      if (!token) return;

      // Axios Interceptors sẽ tự động đính kèm Authorization: Bearer <token>
      const res = await axios.get(`${API_URL}/api/v1/user-notifications`);
      
      if (res.data?.errCode === 0 && Array.isArray(res.data.data)) {
        setNotifications(res.data.data);
        const unread = res.data.data.filter(item => !item.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    }
  }, [API_URL, user]);

  //3. Polling 30s tự động kiểm tra thông báo mới khi người dùng đã đăng nhập
  useEffect(() => {
    if (user?.auth) {
      fetchNotifications();

      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, fetchNotifications]);

  // 4. Lắng nghe click bên ngoài để tự động đóng dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
        setNotiDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      logoutContext();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Click vào 1 thông báo -> Đánh dấu đã đọc & Chuyển hướng
  const handleNotificationClick = async (noti) => {
    if (!noti.is_read) {
      try {
        await axios.patch(`${API_URL}/api/v1/user-notifications/read/${noti.notification_id}`);
        setNotifications(prev =>
          prev.map(item => item.notification_id === noti.notification_id ? { ...item, is_read: true } : item)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
      }
    }

    setNotiDropdownOpen(false);
    if (noti.link) {
      navigate(noti.link);
    }
  };

  // Đánh dấu tất cả thông báo là đã đọc
  const handleMarkAllRead = async () => {
    try {
      await axios.patch(`${API_URL}/api/v1/user-notifications/read-all`);
      setNotifications(prev => prev.map(item => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo đã đọc:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      const searchKeyword = e.target.value;
      if (searchKeyword.trim() !== '') {
        navigate(`/productlist/?searchkeyword=${searchKeyword}`);
      }
    }
  };

  const getNotiIcon = (type) => {
    switch (type) {
      case 'order': return 'fa-shopping-bag text-success';
      case 'news': return 'fa-bullhorn text-primary';
      case 'account': return 'fa-shield-halved text-info';
      default: return 'fa-circle-exclamation text-warning';
    }
  };

  return (
    <header ref={dropdownRef}>
      {/* Main Header */}
      <nav className={`navbar navbar-expand-lg ${styles.headerContainer}`} id="header">
        <div className="container-fluid d-flex align-items-center justify-content-between flex-nowrap">
          
          <Link className="navbar-brand d-flex align-items-center m-0" to="/">
            <img src={LOGO} alt="ESHOP" width="35" />
            <span className="fw-bold ms-2 text-white d-none d-sm-block">ESHOP</span>
          </Link>

          {/* Desktop Search */}
          <div className={`${styles.searchContainer} d-none d-lg-flex align-items-center`}>
            <div className="input-group">
              <span className={`input-group-text bg-transparent border-0 ${styles.searchIcon}`}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                className={`form-control ${styles.searchBox}`}
                type="text"
                placeholder="Bạn tìm gì..."
                onKeyDown={handleSearchSubmit}
              />
            </div>
          </div>

          {/* Action Buttons: Notification, Profile, Cart */}
          <div className={`${styles.actionButtons} d-flex align-items-center`}>
            {user?.auth ? (
              <>
                {/* 🔔 Nút Quả chuông Thông báo */}
                <div className={styles.notiDropdown}>
                  <button
                    className={`btn text-white position-relative ${styles.iconBtn}`}
                    onClick={() => {
                      setNotiDropdownOpen(!notiDropdownOpen);
                      setUserDropdownOpen(false);
                    }}
                    title="Thông báo"
                  >
                    <i className="fa-solid fa-bell fs-5"></i>
                    {unreadCount > 0 && (
                      <span className={styles.notiBadge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu Thông báo */}
                  {notiDropdownOpen && (
                    <div className={styles.notiMenu}>
                      <div className={styles.notiHeader}>
                        <h6 className="m-0 fw-bold"><i className="fa-solid fa-bell me-2"></i>Thông báo</h6>
                        {unreadCount > 0 && (
                          <button className={styles.markReadBtn} onClick={handleMarkAllRead}>
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>

                      <div className={styles.notiList}>
                        {notifications.length > 0 ? (
                          notifications.map((noti) => (
                            <div
                              key={noti.notification_id}
                              className={`${styles.notiItem} ${!noti.is_read ? styles.unread : ''}`}
                              onClick={() => handleNotificationClick(noti)}
                            >
                              <div className={styles.notiIconBox}>
                                <i className={`fa-solid ${getNotiIcon(noti.type)} fs-5`}></i>
                              </div>
                              <div className={styles.notiContent}>
                                <div className={styles.notiTitle}>{noti.title}</div>
                                <div className={styles.notiMessage}>{noti.message}</div>
                                <div className={styles.notiTime}>
                                  {new Date(noti.created_at).toLocaleString('vi-VN')}
                                </div>
                              </div>
                              {!noti.is_read && <span className={styles.unreadDot}></span>}
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-muted">
                            <i className="fa-regular fa-bell-slash fs-3 mb-2 d-block"></i>
                            <span className="small">Bạn chưa có thông báo nào</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Dropdown */}
                <div className={styles.userDropdown}>
                  <div
                    className={styles.userInfo}
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setNotiDropdownOpen(false);
                    }}
                  >
                    <img
                      src={user.avatar ? `${API_URL}/images/useravatar/${user.avatar}` : DFavatar}
                      alt="User Avatar"
                      className={styles.avatar}
                    />
                    <span className={styles.fullname}>{user.fullname}</span>
                    <i className={`fa-solid fa-chevron-${userDropdownOpen ? 'up' : 'down'} text-white`}></i>
                  </div>
                  {userDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      <Link to={`/account/${user.username}`} className={styles.dropdownItem}>
                        <i className="fa-solid fa-user"></i> Thông tin tài khoản
                      </Link>
                      <Link to="/account/wishlist" className={styles.dropdownItem}>
                        <i className="fa-solid fa-heart"></i> Yêu thích
                      </Link>
                      <Link to="/account/readinglist" className={styles.dropdownItem}>
                        <i className="fa-solid fa-bookmark"></i> Danh sách đọc
                      </Link>
                      <hr className="dropdown-divider m-0" />
                      <div className={styles.dropdownItem} onClick={handleLogout}>
                        <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="btn text-white">
                <i className="fa-solid fa-user"></i> <span>Đăng nhập</span>
              </Link>
            )}

            <Link to="/cart" className="btn text-white">
              <i className="fa-solid fa-cart-shopping"></i> <span>Giỏ hàng</span>
            </Link>
          </div>

        </div>
      </nav>

      {/* Mobile Header */}
      <div className={`d-lg-none ${styles.mobileHeader} d-flex align-items-center gap-2`} id="mobile-header">
        <button
          className="navbar-toggler border-0 text-white"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ boxShadow: 'none' }}
        >
          <span className="fa-solid fa-bars fs-4"></span>
        </button>
        <div className={`${styles.mobileSearch} d-flex align-items-center w-100`}>
          <div className="input-group">
            <span className={`input-group-text bg-transparent border-0 ${styles.searchIcon}`} style={{ padding: '5px 10px' }}>
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input
              className={`form-control ${styles.searchBox}`}
              type="text"
              placeholder="Tìm kiếm..."
              onKeyDown={handleSearchSubmit}
              style={{ padding: '5px' }}
            />
          </div>
        </div>
      </div>

      {/* Main Navigation Menu */}
      <nav className={`navbar navbar-expand-lg ${styles.navMenu}`} id="navmenu">
        <div className="container-fluid">
          <div className={menuOpen ? "collapse navbar-collapse show" : "collapse navbar-collapse"} id="mainMenu">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link text-white" to="/">Trang Chủ</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/aboutus">Giới Thiệu</Link>
              </li>
              <li className="nav-item dropdown">
                <Link className="nav-link dropdown-toggle text-white" to="#" role="button" data-bs-toggle="dropdown">
                  Sản phẩm
                </Link>
                <ul className="dropdown-menu">
                  {categories && categories.map((category, index) => (
                    <li key={index}>
                      <Link className="dropdown-item" to={`/productlist/?categoryId=${category.category_id}`}>
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className="nav-item dropdown">
                <Link className="nav-link dropdown-toggle text-white" to="#" role="button" data-bs-toggle="dropdown">
                  Thương hiệu
                </Link>
                <ul className="dropdown-menu">
                  {brands && brands.map((brand, index) => (
                    <li key={index}>
                      <Link className="dropdown-item" to={`/productlist/?brandId=${brand.brand_id}`}>
                        {brand.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>

              <li className="nav-item">
                <Link className="nav-link text-white" to="/newslist">Tin Tức</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/compare">So sánh</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;