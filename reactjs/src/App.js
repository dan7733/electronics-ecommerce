import logo from './logo.svg';
import './App.css';

import { Outlet } from 'react-router-dom';
import Topbar from './containers/topbar/topbar';
import Header from './containers/header/header';
import  Footer  from './containers/footer/footer';
import { ContextProvider } from './containers/login/context'; 
// import Menu from './containers/menu/menu';
// import './containers/css/style.css'

function App() {


  return (
    <ContextProvider>
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
    </ContextProvider>
  );
}

export default App;
