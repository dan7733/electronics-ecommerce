import { createBrowserRouter } from 'react-router-dom';
import App from '../App'; // Ensure the path is correct
import ProductDisplay from '../containers/product/product';
import Slider from '../containers/slider/slider';
import Category from '../containers/category/category';
import DetailProduct from '../containers/detailproduct/detailproduct';
import About from '../containers/about/about';
import ProductList from '../containers/listproduct/listproduct';
import Login from '../containers/login/login';
import Payment from '../containers/payment/payment';
import OrderSuccess from '../containers/ordersuccess/ordersuccess'
import StoreMap from '../containers/storemap/storemap'
import Cart from '../containers/cart/cart';
import Register from '../containers/register/register';
import NewsDisplay from '../containers/news/news'
import ListNews from '../containers/listnews/listnews'
import DetailNews from '../containers/detailnews/detailnews'
import Compare from '../containers/compare/compare'
import UserLayout from '../containers/userlayout/userlayout';
import DetailUser from '../containers/userlayout/detailuser';
import ChangePassword from '../containers/userlayout/changepassword';
import ChangInfor from '../containers/userlayout/changeinfor';
import OrderList from '../containers/userlayout/order';
import OrderDetail from '../containers/userlayout/detailorder';
import ForgotPassword from '../containers/forgotpassword/forgotpassword';
import Wishlist from '../containers/userlayout/wishlist';
import ReadingList from '../containers/userlayout/readinglist';
import ListLastestProduct from '../containers/listlatestproduct/listlatestproduct';
import ListLastestReviews from '../containers/listlastestreviews/ListLastestReviews'; // Ensure the path is correct
const HomePage = () => {
  return (
    // React.Fragment
    <> 
      <Slider />
      <Category />
      <ProductDisplay />
      <NewsDisplay />
      <ListLastestProduct />
      <ListLastestReviews />
    </>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />  // This will render both Slider and ProductList together
      },
      {
        path: "detailproduct/:id",
        element: <DetailProduct />
      },
      {
        path: "aboutus",
        element: <About />
      },
      {
        path: "productlist",  // Tất cả các tham số đều tùy chọn
        element: <ProductList />
      },
      {
        path: "login",  // Tất cả các tham số đều tùy chọn
        element: <Login />
      },
      {
        path: "register", 
        element: <Register />
      },
      {
        path: "payment", 
        element: <Payment />
      },
      {
        path: "ordersuccess", 
        element: <OrderSuccess />
      },
      {
        path: "storemap", 
        element: <StoreMap />
      },
      {
        path: "cart", 
        element: <Cart />
      },
      {
        path: "newslist", 
        element: <ListNews />
      },
      {
        path: "detailnews/:newsid",
        element: <DetailNews />
      },
      {
        path: "Compare",
        element: <Compare />
      },
      {
        path: "forgot-password",
        element: <ForgotPassword />
      },
      {
        path: "account",
        element: <UserLayout />,
        children: [
          {
            index: true, // Default route for /account
            element: <DetailUser />, // Could display a dashboard or redirect
          },
          {
            path: ":username", // Route for /account/:username
            element: <DetailUser />, // Display user info (read-only or simplified)
          },
          {
            path: "changeinfor/:username", // Route for /account/changeinfor/:username
            element: <ChangInfor />, // Editable form for updating user info
          },
          {
            path: "changepassword/:username",
            element: <ChangePassword />,
          },
          {
            path: "orderlist/:username",
            element: <OrderList />,
          },
          {
            path: "detailorder/:orderid",
            element: <OrderDetail />,
          },
          {
            path: "wishlist",
            element: <Wishlist />,
          },
          {
            path: 'readinglist',
            element: <ReadingList />,
          },
        ],
      }
    ]
  }
]);
