import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/forgotpassword/forgotpassword.module.css';

const ForgotPassword = () => {
  const [input, setInput] = useState({ usernameOrEmail: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!input.usernameOrEmail.trim()) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập hoặc Email của bạn.');
      return;
    }

    setIsLoading(true);

    // Bắn request ngầm gửi lên server (không await, lỗi hay không cũng kệ nó)
    axios.post(`${API_URL}/api/v1/request-password-reset`, {
      usernameOrEmail: input.usernameOrEmail,
    }).catch(() => {}); 

    // Xoay spinner "cho có lệ" đúng 1.5s là báo thành công luôn
    setTimeout(() => {
      setSuccessMessage(
        'Yêu cầu đã được xử lý. Vui lòng kiểm tra hộp thư Email của bạn!'
      );
      setInput({ usernameOrEmail: '' });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <i className="fas fa-key"></i>
        </div>

        <h4 className={styles.title}>QUÊN MẬT KHẨU</h4>
        <p className={styles.subtitle}>
          Nhập Tên đăng nhập hoặc Email đã đăng ký. Hệ thống sẽ xử lý và gửi thông tin đến Email của bạn.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <i className={`fas fa-envelope ${styles.inputIcon}`}></i>
            <input
              type="text"
              className={styles.inputField}
              placeholder="Nhập tên đăng nhập hoặc email..."
              value={input.usernameOrEmail}
              onChange={(e) =>
                setInput({ ...input, usernameOrEmail: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {errorMessage && (
            <div className={styles.errorAlert}>
              <i className="fas fa-exclamation-circle me-2"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className={styles.successAlert}>
              <i className="fas fa-check-circle me-2"></i>
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.loadingFlex}>
                <span className={styles.spinner}></span>
                <span>Đang xử lý...</span>
              </span>
            ) : (
              'GỬI YÊU CẦU KHÔI PHỤC'
            )}
          </button>

          <div className={styles.backLinkWrapper}>
            <Link to="/login" className={styles.backLink}>
              <i className="fas fa-arrow-left me-2"></i>Quay lại trang đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;