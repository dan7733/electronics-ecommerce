import React, { useContext } from 'react';
import styles from '../css/topbar/topbar.module.css';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext'; // Import ThemeContext

const Topbar = () => {
  // Sử dụng state và hàm toggle dùng chung từ ThemeContext
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <div className={`${styles.topbar} d-flex justify-content-between align-items-center`}>
      
      {/* Bên trái: Địa chỉ (Bị ẩn hoàn toàn trên Mobile/Tablet) */}
      <span className={styles['topbar-address']}>
        256 Nguyễn Văn Cừ, Quận Ninh Kiều, Thành phố Cần Thơ
      </span>

      {/* Bên phải: Nút hành động */}
      <div className={styles['topbar-actions']}>
        
        {/* Nút Tìm vị trí */}
        <Link to="/storemap" className={styles['topbar-action-item']}>
          <i className={`fa-solid fa-location-dot ${styles['topbar-icon-content']}`}></i>
          <span className={styles['topbar-text-location']}>Cửa hàng</span>
        </Link>

        {/* Nút Tư vấn */}
        <a href="tel:0123456789" className={styles['topbar-action-item']}>
          <i className={`fa-solid fa-phone ${styles['topbar-icon-content']}`}></i>
          <span className={styles['topbar-text-consult']}>Tư vấn: </span>
          <span className={styles['topbar-phone']}>0123.456.789</span>
        </a>

        {/* Cần gạt Dark Mode đồng bộ */}
        <div
          className={`${styles['topbar-theme-switch']} ${darkMode ? styles['dark-mode'] : ''}`}
          onClick={toggleDarkMode}
          title={darkMode ? "Chuyển sang Chế độ sáng" : "Chuyển sang Chế độ tối"}
        >
          <i className={`fa-regular fa-sun ${styles['topbar-sun']}`}></i>
          <div className={styles['topbar-switch-slider']}></div>
          <i className={`fa-solid fa-moon ${styles['topbar-moon']}`}></i>
        </div>

      </div>
    </div>
  );
};

export default Topbar;