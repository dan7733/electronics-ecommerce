import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Context } from './context';
import imgfoot from '../../img/logreg/z6477485754611_927f4860679801e4a4dc44ff262ad957.jpg';
import imgside from '../../img/logreg/TGDD-540x270.png';
import facebookIcon from '../../img/logreg/facebook.png';
import styles from '../css/login/login.module.css';
import { login, account, loginWithGoogle } from './userService';

const Login = () => {
  const [stateInput, setStateInput] = useState({ user: '', pass: '', remember: false });
  const { loginContext } = useContext(Context);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const handleGoogleSignIn = useCallback(
    async (response) => {
      try {
        const { credential } = response;
        if (!credential || typeof credential !== 'string' || credential.split('.').length !== 3) {
            throw new Error('Invalid JWT format');
        }

        const payload = JSON.parse(decodeURIComponent(escape(atob(credential.split('.')[1]))));
        
        const googleId = payload.sub;
        const email = payload.email;
        const fullname = payload.name;

        const googleResponse = await loginWithGoogle(googleId, email, fullname);
        if (googleResponse.data.errCode !== 0) {
          setErrorMessage(googleResponse.data.message);
          return;
        }

        const userResponse = await account();
        if (!userResponse.data || userResponse.data.errCode !== 0) {
          throw new Error(userResponse.data.message || 'Invalid account data');
        }

        const userData = {
          username: userResponse.data.data.user,
          fullname: userResponse.data.data.fullname,
          avatar: userResponse.data.data.avatar,
        };

        loginContext(userData, true);
        navigate('/');
      } catch (err) {
        console.error('Google login error:', err);
        setErrorMessage('Đăng nhập Google không thành công. Vui lòng thử lại!');
      }
    },
    [loginContext, navigate]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
      });
      renderGoogleButton();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleSignIn,
        });
        renderGoogleButton();
      };
      document.body.appendChild(script);
    }
  }, [handleGoogleSignIn, GOOGLE_CLIENT_ID]);

  // Hàm render giao diện nút Google
  const renderGoogleButton = () => {
    const buttonDiv = document.getElementById('googleSignInButton');
    if (buttonDiv) {
      // Đo chiều rộng của thẻ cha chứa form để làm cho nút Google khít 100%
      const containerWidth = buttonDiv.parentElement.clientWidth || 360; 
      
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'signin_with',
        width: containerWidth // Truyền biến chiều rộng vừa đo được vào
      });
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      const items = await login(stateInput.user, stateInput.pass);
      if (items.data.errCode !== 0) {
        setErrorMessage(items.data.message);
        return;
      }

      const userResponse = await account();
      if (!userResponse.data || userResponse.data.errCode !== 0) {
         throw new Error(userResponse.data.message || 'Invalid account data');
      }

      const userData = {
         username: userResponse.data.data.user,
         fullname: userResponse.data.data.fullname,
         avatar: userResponse.data.data.avatar,
      };

      loginContext(userData, stateInput.remember);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage('Đăng nhập không thành công. Vui lòng thử lại!');
    }
  };

  return (
    <>
      <div className={styles.containerLogin}>
        <div className="row w-100 align-items-center m-0">
          <div className="col-md-6 text-center d-none d-md-block">
            <img src={imgside} alt="Illustration" className={styles.leftSideImg} />
          </div>
          
          <div className="col-md-6 mx-auto">
            <div className={styles.rightSide}>
              <div className={`${styles.tabs} d-flex justify-content-center`}>
                <Link className={location.pathname === '/login' ? styles.active : ''} to="/login">ĐĂNG NHẬP</Link>
                <Link className={location.pathname === '/register' ? styles.active : ''} to="/register">ĐĂNG KÝ</Link>
              </div>

              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <input
                    type="text"
                    className={`form-control ${styles.formControl}`}
                    placeholder="Tên đăng nhập"
                    required
                    onChange={(e) => setStateInput({ ...stateInput, user: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className={`form-control ${styles.formControl}`}
                    placeholder="Mật khẩu"
                    required
                    onChange={(e) => setStateInput({ ...stateInput, pass: e.target.value })}
                  />
                </div>
                
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      onChange={(e) => setStateInput({ ...stateInput, remember: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="rememberMe" style={{fontSize: '14px'}}>Ghi nhớ</label>
                  </div>
                  <Link to="/forgot-password" className={styles.forgotPassword}>Quên mật khẩu?</Link>
                </div>

                <button type="submit" className={styles.loginBtn}>ĐĂNG NHẬP</button>
              </form>

              <div className={styles.socialContainer}>
                <p className="text-center text-muted mb-3" style={{fontSize: '14px'}}>Hoặc đăng nhập bằng</p>
                
                <div className={styles.socialButtons}>
                  {/* Google chuyển lên trên */}
                  <div id="googleSignInButton" className={styles.googleWrapper}></div>

                  {/* Facebook đẩy xuống dưới và chặn click */}
                  <button type="button" className={styles.socialBtnFb} disabled>
                    <img src={facebookIcon} alt="Facebook" /> Đăng nhập bằng Facebook
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="alert alert-danger mt-3 py-2 text-center" style={{fontSize: '14px'}}>
                  {errorMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.wave}>
        <img src={imgfoot} alt="Wave background" />
      </div>
    </>
  );
};

export default Login;