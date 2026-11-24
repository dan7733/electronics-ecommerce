import logo from './logo.svg';
import './App.css';
import React, { useEffect, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Topbar from './containers/topbar/topbar';
import Header from './containers/header/header';
import Footer from './containers/footer/footer';
import CookieBanner from './containers/cookiebanner/CookieBanner';
import { ContextProvider, Context } from './containers/login/context'; 
import { setupAxiosInterceptors } from './containers/login/userService';
import { ThemeProvider } from './context/ThemeContext'; 

const AppContent = () => {
  const navigate = useNavigate();
  const { logoutContext } = useContext(Context);

  useEffect(() => {
    // Kích hoạt/Cập nhật navigate và logoutContext cho Axios Interceptor
    setupAxiosInterceptors(navigate, logoutContext);
  }, [navigate, logoutContext]);

  return (
    <div>
      <div>
        <Topbar />
      </div>
      <div className='header'>
        <Header />
      </div>
      <div className='outlet'>
        <Outlet />
      </div>
      <div className='footer'>
        <Footer />
      </div>

      {/* Hiển thị Popup Cookie ở cấp toàn trang */}
      <CookieBanner />
    </div>
  );
};

function App() {
  return (
    <ContextProvider>
      {/* Bọc toàn bộ ứng dụng trong ThemeProvider */}
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ContextProvider>
  );
}

export default App;