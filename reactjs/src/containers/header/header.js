import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import LOGO from '../../img/header/logo.png';
import { Context } from '../../containers/login/context';
import styles from '../css/header/header.module.css';
import DFavatar from '../../img/avatar/avatar.png';

const Header = () => {
  const { user, logoutContext } = useContext(Context);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      logoutContext();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/v1/listcategory`)
      .then(response => {
        setCategories(response.data.categories || []);
      })
      .catch(error => console.error('Error fetching categories:', error));

    axios.get(`${API_URL}/api/v1/listbrand`)
      .then(response => {
        setBrands(response.data.brands || []);
      })
      .catch(error => console.error('Error fetching brands:', error));
  }, [API_URL]);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      const searchKeyword = e.target.value;
      if (searchKeyword.trim() !== '') {
        navigate(`/productlist/?searchkeyword=${searchKeyword}`);
      }
    }
  };

  return (
    <>
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
              <span className="input-group-text bg-white border-0">
                <i className="fa-solid fa-magnifying-glass text-muted"></i>
              </span>
              <input
                className={`form-control ${styles.searchBox}`}
                type="text"
                placeholder="Bạn tìm gì..."
                onKeyDown={handleSearchSubmit}
              />
            </div>
          </div>

          {/* Login & Cart */}
          <div className={`${styles.actionButtons} d-flex align-items-center`}>
            {user?.auth ? (
              <div className={styles.userDropdown}>
                <div
                  className={styles.userInfo}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
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

      {/* Mobile Header (Search & Hamburger) */}
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
            <span className="input-group-text bg-white border-0" style={{ padding: '5px 10px' }}>
              <i className="fa-solid fa-magnifying-glass text-muted"></i>
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

      {/* Main Menu */}
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
    </>
  );
};

export default Header;