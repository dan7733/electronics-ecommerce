import React, { useState, useEffect } from 'react';
import styles from '../css/topbar/topbar.module.css';
import { Link } from 'react-router-dom';

// Biến toàn cục để theo dõi trạng thái tải Google Translate script
let isGoogleTranslateScriptLoaded = false;

const Topbar = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Chuyển đổi dark mode
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Xử lý tải Google Translate script và lỗi toàn cục
  useEffect(() => {
    // Trình xử lý lỗi toàn cục
    const errorHandler = (message, source, lineno, colno, error) => {
      console.error('Lỗi toàn cục:', {
        message,
        source,
        lineno,
        colno,
        error: error ? error.stack : 'Không có stack lỗi',
      });
      return false; // Cho phép trình duyệt tiếp tục xử lý lỗi
    };

    // Trình xử lý lỗi promise không được xử lý
    const unhandledRejectionHandler = (event) => {
      console.error('Lỗi promise không xử lý:', {
        reason: event.reason,
        stack: event.reason?.stack || 'Không có stack lỗi',
      });
    };

    window.onerror = errorHandler;
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    // Kiểm tra xem script đã được tải chưa
    if (isGoogleTranslateScriptLoaded || document.getElementById('google-translate-script')) {
      console.log('Script Google Translate đã được tải');
      // Khởi tạo lại nếu cần
      if (window.google && window.google.translate) {
        window.googleTranslateInit();
      }
      return;
    }

    // Định nghĩa hàm khởi tạo Google Translate
    window.googleTranslateInit = () => {
      console.log('Khởi tạo Google Translate');
      try {
        if (!window.google || !window.google.translate) {
          console.error('API Google Translate không khả dụng');
          return;
        }
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'vi',
            includedLanguages: 'vi,en,fr,es,zh-CN,ja,ko',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        console.log('Khởi tạo Google Translate thành công');
      } catch (error) {
        console.error('Lỗi khi khởi tạo Google Translate:', error);
      }
    };

    // Tải script Google Translate với độ trễ
    const loadScript = () => {
      console.log('Đang tải script Google Translate');
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateInit';
      script.async = true;
      script.onload = () => {
        console.log('Tải script Google Translate thành công');
        isGoogleTranslateScriptLoaded = true;
      };
      script.onerror = (event) => {
        console.error('Tải script Google Translate thất bại:', event);
        isGoogleTranslateScriptLoaded = false;
      };
      document.body.appendChild(script);
    };

    const timer = setTimeout(loadScript, 500);

    // Dọn dẹp khi component unmount
    return () => {
      console.log('Dọn dẹp Google Translate script');
      clearTimeout(timer);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      window.onerror = null;

      // Chỉ xóa script nếu nó tồn tại và chưa được sử dụng bởi instance khác
      const script = document.getElementById('google-translate-script');
      if (script && script.parentNode && !isGoogleTranslateScriptLoaded) {
        script.parentNode.removeChild(script);
      }

      // Xóa callback toàn cục
      delete window.googleTranslateInit;
    };
  }, []);

  return (
    <div className={`${styles.topbar} d-flex justify-content-between align-items-center`}>
      <span className={styles['topbar-address']}>
        <span className={styles['topbar-text-content']}>
          256 Nguyễn Văn Cừ, Quận Ninh Kiều, Thành phố Cần Thơ
        </span>
      </span>
      <div className="d-flex align-items-center">
        <span className={styles['topbar-action-item']}>
          <i className={`fa-solid fa-location-dot ${styles['topbar-icon-content']}`}></i>
          <Link to="/storemap" className={styles['topbar-text-content']}>
            Tìm Vị trí
          </Link>
        </span>
        <span className={styles['topbar-action-item']}>
          <i className={`fa-solid fa-phone ${styles['topbar-icon-content']}`}></i>
          <span className={styles['topbar-text-content']}>Tư vấn mua hàng: </span>0123456789
        </span>

        <div
          className={`${styles['topbar-theme-switch']} ${darkMode ? styles['dark-mode'] : ''}`}
          onClick={toggleDarkMode}
        >
          <i className={`fa-regular fa-sun ${styles['topbar-sun']}`}></i>
          <div className={styles['topbar-switch-slider']}></div>
          <i className={`fa-solid fa-moon ${styles['topbar-moon']}`}></i>
        </div>

        <div className={styles['topbar-language-switch']}>
          <div id="google_translate_element"></div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;