import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../css/detailuser/wishlist.module.css';
import { Context } from '../login/context';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const { user } = useContext(Context);
  const navigate = useNavigate();

  // Lấy URL trực tiếp từ biến môi trường .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
      return;
    }

    const existingWishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    setWishlist(existingWishlist);
  }, [user, navigate]);

  const showTemporaryNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);
  };

  const handleRemoveFromWishlist = (product_id) => {
    const updatedWishlist = wishlist.filter((item) => item.product_id !== product_id);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    setWishlist(updatedWishlist);
    showTemporaryNotification('Đã xóa sản phẩm khỏi danh sách yêu thích!');
  };

  const handleAddToCart = (item) => {
    const cartItem = {
      product_id: item.product_id,
      name: item.name,
      price: item.price,
      discount_price: item.discount_price,
      product_img: item.product_img,
      quantity: 1,
      selected: false,
    };

    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItemIndex = existingCart.findIndex(
      (cartItem) => cartItem.product_id === item.product_id
    );

    if (existingItemIndex >= 0) {
      existingCart[existingItemIndex].quantity += 1;
    } else {
      existingCart.push(cartItem);
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    showTemporaryNotification(`Đã thêm ${item.name} vào giỏ hàng!`);
  };

  if (!wishlist.length) {
    return (
      <div className={styles['wishlist-container']}>
        <h2 className={styles['wishlist-title']}>Danh Sách Yêu Thích</h2>
        <p className={styles['wishlist-empty']}>
          Danh sách yêu thích của bạn đang trống. Hãy thêm sản phẩm để theo dõi!
        </p>
      </div>
    );
  }

  return (
    <div className={styles['wishlist-container']}>
      <h2 className={styles['wishlist-title']}>Danh Sách Yêu Thích</h2>
      <div className={styles['wishlist-grid']}>
        {wishlist.map((item) => (
          <div key={item.product_id} className={styles['wishlist-item']}>
            <img
              /* Thay thế localhost bằng API_URL cho đường dẫn ảnh sản phẩm */
              src={`${API_URL}/images/products/${item.product_img}`}
              alt={item.name}
              className={styles['wishlist-item-img']}
            />
            <div className={styles['wishlist-item-info']}>
              <h3 className={styles['wishlist-item-name']}>{item.name}</h3>
              <div className={styles['wishlist-item-price']}>
                {item.discount_price ? (
                  <>
                    <span className={styles['price-original']}>
                      {item.price.toLocaleString()}₫
                    </span>
                    <span className={styles['price-discount']}>
                      {item.discount_price.toLocaleString()}₫
                    </span>
                  </>
                ) : (
                  <span className={styles['price']}>{item.price.toLocaleString()}₫</span>
                )}
              </div>
              <div className={styles['wishlist-item-actions']}>
                <button
                  className={styles['button-add-cart']}
                  onClick={() => handleAddToCart(item)}
                >
                  <i className="fa-solid fa-cart-shopping"></i> Thêm vào giỏ hàng
                </button>
                <button
                  className={styles['button-remove']}
                  onClick={() => handleRemoveFromWishlist(item.product_id)}
                >
                  <i className="fa-solid fa-trash"></i> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notification.show && (
        <div className={styles['notification']}>
          <div className={styles['notification-content']}>
            <i className="fa-solid fa-check-circle"></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;