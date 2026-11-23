import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import registerNowImg from '../../img/logreg/dangkyngay.jpg';
import waveImg from '../../img/logreg/z6477485754611_927f4860679801e4a4dc44ff262ad957.jpg';
import styles from '../css/register/register.module.css'; // Lưu ý trỏ đúng đường dẫn CSS bạn vừa tạo

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', fullname: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const handleChange = ({ target: { name, value } }) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setIsLoading(true);

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự!');
      setIsLoading(false); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp!');
      setIsLoading(false); return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/v1/register`, {
        username: formData.username,
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      setSuccess(response.data.message || 'Đăng ký thành công! Vui lòng kiểm tra email.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className="spinner-border text-dark" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <div className={styles.containerLogin}>
        <div className="row w-100 align-items-center m-0">
          <div className="col-md-6 text-center d-none d-md-block">
            <img src={registerNowImg} alt="Đăng ký ngay" className={styles.leftSideImg} />
          </div>

          <div className="col-md-6 mx-auto">
            <div className={styles.rightSide}>
              <div className={`${styles.tabs} d-flex justify-content-center`}>
                <Link className={location.pathname === '/login' ? styles.active : ''} to="/login">ĐĂNG NHẬP</Link>
                <Link className={location.pathname === '/register' ? styles.active : ''} to="/register">ĐĂNG KÝ</Link>
              </div>

              {error && <div className="alert alert-danger py-2 text-center" style={{fontSize:'14px'}}>{error}</div>}
              {success && <div className="alert alert-success py-2 text-center" style={{fontSize:'14px'}}>{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input type="text" name="username" className={`form-control ${styles.formControl}`} placeholder="Tên đăng nhập" value={formData.username} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="mb-3">
                  <input type="text" name="fullname" className={`form-control ${styles.formControl}`} placeholder="Họ và tên" value={formData.fullname} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="mb-3">
                  <input type="email" name="email" className={`form-control ${styles.formControl}`} placeholder="Email" value={formData.email} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="mb-3">
                  <input type="tel" name="phone" className={`form-control ${styles.formControl}`} placeholder="Số điện thoại" value={formData.phone} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="mb-3">
                  <input type="password" name="password" className={`form-control ${styles.formControl}`} placeholder="Mật khẩu (ít nhất 6 ký tự)" value={formData.password} onChange={handleChange} required disabled={isLoading} />
                </div>
                <div className="mb-4">
                  <input type="password" name="confirmPassword" className={`form-control ${styles.formControl}`} placeholder="Xác nhận mật khẩu" value={formData.confirmPassword} onChange={handleChange} required disabled={isLoading} />
                </div>
                
                <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                  {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ MỚI'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.wave}>
        <img src={waveImg} alt="Wave background" />
      </div>
    </>
  );
};

export default Register;