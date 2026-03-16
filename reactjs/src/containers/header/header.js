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

  // Sử dụng trực tiếp biến môi trường không dùng fallback
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
    // Thay thế localhost bằng API_URL cho danh sách danh mục
    axios.get(`${API_URL}/api/v1/listcategory`)
      .then(response => {
        setCategories(response.data.categories || []);
      })
      .catch(error => console.error('Error fetching categories:', error));

    // Thay thế localhost bằng API_URL cho danh sách thương hiệu
    axios.get(`${API_URL}/api/v1/listbrand`)
      .then(response => {
        setBrands(response.data.brands || []);
      })
      .catch(error => console.error('Error fetching brands:', error));
  }, [API_URL]); // Thêm API_URL vào dependency array

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      const searchKeyword = e.target.value;
      navigate(`/productlist/?searchkeyword=${searchKeyword}`);
    }
  };

  return (
    <>
      {/* Main Header */}
      <nav className={`navbar navbar-expand-lg ${styles.headerContainer}`} id="header">
        <div className="container-fluid d-flex align-items-center">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img src={LOGO} alt="ESHOP" width="40" />
            <span className="fw-bold ms-2 text-white">ESHOP</span>
          </Link>

          {/* Desktop Search */}
          <div className={`${styles.searchContainer} d-none d-lg-flex align-items-center`}>
            <div className="input-group">
              <span className="input-group-text bg-white border-0">
                <i className="fa-solid fa-magnifying-glass"></i>
              </span>
              <input
                className={`form-control border-0 ${styles.searchBox}`}
                type="text"
                placeholder="Tìm kiếm..."
                onKeyDown={handleSearchSubmit}
              />
            </div>
          </div>

          {/* Login & Cart */}
          <div className={`d-flex align-items-center ${styles.actionButtons}`}>
            {user?.auth ? (
              <div className={styles.userDropdown}>
                <div
                  className={styles.userInfo}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                >
                  <img
                    // Thay thế localhost bằng API_URL cho ảnh đại diện user
                    src={user.avatar ? `${API_URL}/images/useravatar/${user.avatar}` : DFavatar}
                    alt="User Avatar"
                    className={styles.avatar}
                  />
                  <span className={styles.fullname}>{user.fullname}</span>
                  <i className={`fa-solid fa-chevron-${userDropdownOpen ? 'up' : 'down'}`}></i>
                </div>
                {userDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <Link
                      to={`/account/${user.username}`}
                      className={styles.dropdownItem}
                    >
                      <i className="fa-solid fa-user"></i> Thông tin tài khoản
                    </Link>
                    <Link
                      to="/account/wishlist"
                      className={styles.dropdownItem}
                    >
                      <i className="fa-solid fa-heart"></i> Yêu thích
                    </Link>
                    <Link
                      to="/account/readinglist"
                      className={styles.dropdownItem}
                    >
                      <i className="fa-solid fa-bookmark"></i> Danh sách đọc
                    </Link>
                    <div
                      className={styles.dropdownItem}
                      onClick={handleLogout}
                    >
                      <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn text-white">
                <i className="fa-solid fa-user text-white"></i> Đăng nhập
              </Link>
            )}

            <Link to="/cart" className="btn text-white">
              <i className="fa-solid fa-cart-shopping text-white"></i> Giỏ hàng
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <div className={`d-lg-none ${styles.mobileHeader} p-2 d-flex align-items-center`} id="mobile-header">
        <button
          className="navbar-toggler me-2 text-white"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="fa-solid fa-bars"></span>
        </button>
        <div className={`${styles.mobileSearch} d-flex w-100 px-2`}>
          <div className="input-group">
            <span className="input-group-text bg-white border-0">
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input
              className={`form-control border-0 ${styles.searchBox}`}
              type="text"
              placeholder="Tìm kiếm..."
              onKeyDown={handleSearchSubmit}
            />
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <nav className={`navbar navbar-expand-lg ${styles.navMenu}`} id="navmenu">
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
              <Link className="nav-link text-white" to="/lien-he">Liên Hệ</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-white" to="/compare">So sánh</Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default Header;