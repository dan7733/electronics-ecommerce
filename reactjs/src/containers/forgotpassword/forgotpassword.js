// src/components/ForgotPassword.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import loginStyles from '../css/login/login.module.css'; // Styles for login-related classes
import styles from '../css/forgotpassword/forgotpassword.module.css'; // Styles for spinner
import axios from 'axios';

const ForgotPassword = () => {
  const [input, setInput] = useState({ usernameOrEmail: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const navigate = useNavigate();

  // Sử dụng trực tiếp biến môi trường từ file .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true); // Start loading

    try {
      // Thay thế đường dẫn bằng biến môi trường
      const response = await axios.post(`${API_URL}/api/v1/request-password-reset`, {
        usernameOrEmail: input.usernameOrEmail,
      });

      if (response.data.errCode === 0) {
        setSuccessMessage(response.data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setErrorMessage(response.data.message);
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau!'
      );
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className={loginStyles.containerLogin}>
      <div className="row w-100 align-items-center">
        <div className="col-md-6 mx-auto">
          <div className={loginStyles.rightSide}>
            <h4 className="text-center mb-3">QUÊN MẬT KHẨU</h4>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tên đăng nhập hoặc Email"
                  value={input.usernameOrEmail}
                  onChange={(e) =>
                    setInput({ ...input, usernameOrEmail: e.target.value })
                  }
                  disabled={isLoading} // Disable input during loading
                />
              </div>
              <button
                type="submit"
                className={loginStyles.loginBtn}
                disabled={isLoading} // Disable button during loading
              >
                {isLoading ? (
                  <span>
                    <span className={styles.spinner}></span> Đang gửi...
                  </span>
                ) : (
                  'GỬI YÊU CẦU'
                )}
              </button>
              <div className="text-center mt-2">
                <Link to="/login" className={loginStyles.forgotPassword}>
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
            {errorMessage && (
              <p className="text-danger text-center mt-2">{errorMessage}</p>
            )}
            {successMessage && (
              <p className="text-success text-center mt-2">{successMessage}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;