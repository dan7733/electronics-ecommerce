import logo from './logo.svg';
import './App.css';
import React, { useEffect, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Topbar from './containers/topbar/topbar';
import Header from './containers/header/header';
import Footer from './containers/footer/footer';
import { ContextProvider, Context } from './containers/login/context'; 
import { setupAxiosInterceptors } from './containers/login/userService';

// Tách ra một component nội bộ để có thể xài được useNavigate và useContext
const AppContent = () => {
  const navigate = useNavigate();
  const { logoutContext } = useContext(Context);

  useEffect(() => {
    // Kích hoạt đánh chặn token tự động cho toàn bộ app
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
    </div>
  );
};

function App() {
  return (
    <ContextProvider>
      <AppContent />
    </ContextProvider>
  );
}

export default App;