import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import registerNowImg from '../../img/logreg/dangkyngay.jpg';
import waveImg from '../../img/logreg/z6477485754611_927f4860679801e4a4dc44ff262ad957.jpg';
import styles from '../css/register/register.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Lấy URL trực tiếp từ biến môi trường .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleChange = ({ target: { name, value } }) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Password validation
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp!');
      setIsLoading(false);
      return;
    }

    try {
      // Thay thế localhost bằng API_URL
      const response = await axios.post(`${API_URL}/api/v1/register`, {
        username: formData.username,
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setSuccess(response.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Overlay loading */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      <div className={styles.containerLogin}>
        <div className="row w-100 align-items-center">
          {/* Left Side: Register Image */}
          <div className="col-md-6 text-center">
            <img
              src={registerNowImg}
              alt="Đăng ký ngay"
              className={styles.leftSideImg}
            />
          </div>

          {/* Right Register Form */}
          <div className="col-md-6 mx-auto">
            <div className={styles.rightSide}>
              <div className={`${styles.tabs} d-flex justify-content-center mb-3`}>
                <Link className={styles.active} to="/login">ĐĂNG NHẬP</Link>
                <Link className={styles.active} to="/register">ĐĂNG KÝ</Link>
              </div>

              <h4 className="text-center mb-3">ĐĂNG KÝ</h4>

              {error && <p className="text-danger text-center">{error}</p>}
              {success && <p className="text-success text-center">{success}</p>}

              <form onSubmit={handleSubmit}>
                <div className="mb-2">
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    placeholder="Tài khoản"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-2">
                  <input
                    type="text"
                    name="fullname"
                    className="form-control"
                    placeholder="Họ và tên"
                    value={formData.fullname}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-2">
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-2">
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="Số điện thoại"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-2">
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  className={styles.loginBtn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                  ) : (
                    'ĐĂNG KÝ'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Section */}
      <div className={styles.wave}>
        <img src={waveImg} alt="Wave background" />
      </div>
    </>
  );
};

export default Register;