import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/recommendProduct/popularProduct.module.css';

const PopularProductDisplay = () => {
  const [popularProducts, setPopularProducts] = useState([]);

  // Lấy URL trực tiếp từ biến môi trường
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Fetch popularity-based recommendations
    axios.get(`${API_URL}/api/v1/recommend/popularity-based`)
      .then(response => {
        if (response.data.errCode === 0) {
          setPopularProducts(response.data.product);
        } else {
          console.error('Error in response:', response.data.message);
        }
      })
      .catch(error => console.error('Error fetching popular products:', error));
  }, [API_URL]);

  const renderProduct = (product) => (
    <Link
      key={product.product_id}
      className={styles['product-card']}
      to={`/detailproduct/${product.product_id}`}
    >
      <img
        src={`${API_URL}/images/products/${product.product_img}`}
        alt={product.name}
      />
      
      {/* KHỐI THÔNG TIN: Tự co giãn để gióng thẳng các dòng giá bên dưới */}
      <div className={styles['product-info']}>
        <h5 className={styles['product-title']}>{product.name}</h5>
        <p className={styles['product-promo']}>Giá quá rẻ</p>
      </div>

      {/* KHỐI GIÁ TIỀN: Luôn nằm ở dưới cùng */}
      <div className={styles['product-pricing']}>
        <p className={styles['product-old-price']}>
          {/* Sử dụng \u00A0 để tạo khoảng trống tàng hình nếu không có discount */}
          {product.discount_price > 0 ? `${product.price.toLocaleString()} Đ` : '\u00A0'}
        </p>
        <p className={styles['product-new-price']}>
          {(product.discount_price > 0 ? product.discount_price : product.price).toLocaleString()} Đ
        </p>
      </div>
    </Link>
  );

  return (
    <div className={`container-lg mt-4 ${styles['product-container']}`}>
      <div className={`${styles['product-category-bar']} ${styles['popularproduct-category-bar']}`}>
        <span className="text-white fw-bold">SẢN PHẨM PHỔ BIẾN</span>
        <div className={styles['product-category-links']}>
          <Link to="#">HOT</Link>
          <Link to="#">TRENDING</Link>
          <Link to="#" className={styles['product-more']}>
            Nhiều hơn <i className="fa-solid fa-angle-double-right"></i>
          </Link>
        </div>
      </div>
      <div className={`mt-3 ${styles['product-wrapper']} ${styles['popularproduct-wrapper']}`}>
        {Array.isArray(popularProducts) && popularProducts.length > 0 ? (
          popularProducts.map(renderProduct)
        ) : (
          <p className={styles['no-products']}>Không có sản phẩm phổ biến.</p>
        )}
      </div>
    </div>
  );
};

export default PopularProductDisplay;