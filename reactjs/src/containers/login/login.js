import React, { useState, useContext, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Context } from './context';
import imgfoot from '../../img/logreg/z6477485754611_927f4860679801e4a4dc44ff262ad957.jpg';
import imgside from '../../img/logreg/TGDD-540x270.png';
import facebookIcon from '../../img/logreg/facebook.png';
import styles from '../css/login/login.module.css';
import { login, account, loginWithGoogle } from './userService';

const Login = () => {
  const [stateInput, setStateInput] = useState({});
  const { loginContext } = useContext(Context);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Lấy Client ID từ biến môi trường
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  const handleGoogleSignIn = useCallback(
    async (response) => {
      console.log('Google response:', response);
      try {
        const { credential } = response;
        // ... (Code xử lý credential giữ nguyên)
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
    if (!GOOGLE_CLIENT_ID) {
        console.error("Missing Google Client ID in .env file");
        return;
    }

    if (window.google) {
      console.log('Google API loaded successfully');
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID, // SỬ DỤNG BIẾN MÔI TRƯỜNG
        callback: handleGoogleSignIn,
      });
      const buttonDiv = document.getElementById('googleSignInButton');
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
        });
      }
    } else {
      console.error('Google API not loaded');
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = () => {
        console.log('Google API script loaded dynamically');
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID, // SỬ DỤNG BIẾN MÔI TRƯỜNG
          callback: handleGoogleSignIn,
        });
        const buttonDiv = document.getElementById('googleSignInButton');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
          });
        }
      };
      document.body.appendChild(script);
    }
  }, [handleGoogleSignIn, GOOGLE_CLIENT_ID]);

  // ... (Phần handleLogin và return UI giữ nguyên)
  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const items = await login(stateInput.user, stateInput.pass);
      if (items.data.errCode !== 0) {
        setErrorMessage(items.data.message);
      }

      const userResponse = await account();
      // ...
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
      // ... Giữ nguyên toàn bộ nội dung JSX bên trong return ...
      <>
      <div className={styles.containerLogin}>
        <div className="row w-100 align-items-center">
            {/* ... Nội dung UI Login ... */}
            <div className="col-md-6 text-center">
                <img src={imgside} alt="Illustration" className={styles.leftSideImg} />
            </div>
            
            <div className="col-md-6 mx-auto">
                <div className={styles.rightSide}>
                     {/* ... Tab ... */}
                     <div className={`${styles.tabs} d-flex justify-content-center mb-3`}>
                        <Link className={styles.active} to="/login">ĐĂNG NHẬP</Link>
                        <Link className={styles.active} to="/register">ĐĂNG KÝ</Link>
                    </div>
                    
                    <h4 className="text-center mb-3">ĐĂNG NHẬP</h4>

                    <form onSubmit={handleLogin}>
                        {/* ... Inputs ... */}
                         <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Tên đăng nhập"
                                onChange={(e) => setStateInput({ ...stateInput, user: e.target.value })}
                            />
                        </div>
                        <div className="mb-3">
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Mật khẩu"
                                onChange={(e) => setStateInput({ ...stateInput, pass: e.target.value })}
                            />
                        </div>
                         {/* ... Checkbox & Button ... */}
                         <div className="form-check mb-3">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="rememberMe"
                                onChange={(e) => setStateInput({ ...stateInput, remember: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
                        </div>

                        <button type="submit" className={styles.loginBtn}>ĐĂNG NHẬP</button>
                         <div className="text-center mt-2">
                            <Link to="/forgot-password" className={styles.forgotPassword}>Quên mật khẩu</Link>
                        </div>
                    </form>

                     <p className="text-center mt-3">Hoặc đăng nhập bằng</p>

                    <div className={`${styles.socialButtons} d-flex justify-content-around mt-2`}>
                        <button className="btn d-flex align-items-center">
                            <img src={facebookIcon} alt="Facebook Icon" /> Facebook
                        </button>
                        <div
                            id="googleSignInButton"
                            style={{ width: '200px', height: '40px' }}
                            className="btn d-flex align-items-center"
                        ></div>
                    </div>

                    {errorMessage && (
                        <p className="text-danger text-center mt-2">{errorMessage}</p>
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