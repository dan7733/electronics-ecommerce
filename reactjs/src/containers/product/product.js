import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/product/product.module.css';

const ProductDisplay = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [phoneProducts, setPhoneProducts] = useState([]);
  const [laptopProducts, setLaptopProducts] = useState([]);
  const [tabletProducts, setTabletProducts] = useState([]);

  // Lấy URL trực tiếp từ biến môi trường .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Sử dụng API_URL cho tất cả các yêu cầu lấy danh sách sản phẩm
    axios.get(`${API_URL}/api/v1/latestproducts`)
      .then(response => setNewProducts(response.data.products))
      .catch(error => console.error('Error fetching new products:', error));

    axios.get(`${API_URL}/api/v1/latestproducts/1`)
      .then(response => setPhoneProducts(response.data.products))
      .catch(error => console.error('Error fetching phone products:', error));

    axios.get(`${API_URL}/api/v1/latestproducts/2`)
      .then(response => setLaptopProducts(response.data.products))
      .catch(error => console.error('Error fetching laptop products:', error));

    axios.get(`${API_URL}/api/v1/latestproducts/9`)
      .then(response => setTabletProducts(response.data.products))
      .catch(error => console.error('Error fetching tablet products:', error));
  }, [API_URL]);

  const renderProduct = (product) => (
    <Link key={product.product_id} className={styles['product-card']} to={`/detailproduct/${product.product_id}`}>
      {/* Cập nhật đường dẫn ảnh từ server thông qua biến môi trường */}
      <img
        src={`${API_URL}/images/products/${product.product_img}`}
        alt={product.name}
      />
      <h5 className={styles['product-title']}>{product.name}</h5>
      <p className="text-danger">Giá quá rẻ</p>
      {product.discount_price > 0 && (
        <p className={styles['product-old-price']}>
          {product.price.toLocaleString()} Đ
        </p>
      )}
      <p className={styles['product-new-price']}>
        {(product.discount_price > 0 ? product.discount_price : product.price).toLocaleString()} Đ
      </p>
    </Link>
  );

  return (
    <>
      {/* SẢN PHẨM MỚI */}
      <div className={`container-lg mt-3 ${styles['product-container']}`}>
      <div className={`${styles['product-category-bar']} ${styles['newsproduct-category-bar']}`}>
          <span className="text-white fw-bold">SẢN PHẨM MỚI</span>
          <div className={styles['product-category-links']}>
            <Link to="#">HOT</Link>
            <Link to="#">FLASH SALE</Link>
            <Link to="#">TRENDING</Link>
            <Link to="#" className={styles['product-more']}>
              Nhiều hơn <i className="fa-solid fa-angle-double-right"></i>
            </Link>
          </div>
        </div>
        <div className={`mt-3 ${styles['product-wrapper']} ${styles['newsproduct-wrapper']}`}>
          {Array.isArray(newProducts) && newProducts.map(renderProduct)}
        </div>
      </div>

      {/* ĐIỆN THOẠI */}
      <div className={`container-lg mt-3 ${styles['product-container']}`}>
        <div className={styles['product-category-bar']}>
          <span className="text-white fw-bold">ĐIỆN THOẠI</span>
          <div className={styles['product-category-links']}>
            <Link to="#">NOKIA</Link>
            <Link to="#">IPHONE</Link>
            <Link to="#">SAMSUNG</Link>
            <Link to="#" className={styles['product-more']}>
              Nhiều hơn <i className="fa-solid fa-angle-double-right"></i>
            </Link>
          </div>
        </div>
        <div className={`mt-3 ${styles['product-wrapper']}`}>
          {Array.isArray(phoneProducts) && phoneProducts.map(renderProduct)}
        </div>
      </div>

      {/* LAPTOP */}
      <div className={`container-lg mt-3 ${styles['product-container']}`}>
        <div className={styles['product-category-bar']}>
          <span className="text-white fw-bold">LAPTOP</span>
          <div className={styles['product-category-links']}>
            <Link to="#">DELL</Link>
            <Link to="#">HP</Link>
            <Link to="#">MACBOOK</Link>
            <Link to="#" className={styles['product-more']}>
              Nhiều hơn <i className="fa-solid fa-angle-double-right"></i>
            </Link>
          </div>
        </div>
        <div className={`mt-3 ${styles['product-wrapper']}`}>
          {Array.isArray(laptopProducts) && laptopProducts.map(renderProduct)}
        </div>
      </div>

      {/* MÁY TÍNH BẢNG */}
      <div className={`container-lg mt-3 ${styles['product-container']}`}>
        <div className={styles['product-category-bar']}>
          <span className="text-white fw-bold">MÁY TÍNH BẢNG</span>
          <div className={styles['product-category-links']}>
            <Link to="#">XIAOMI</Link>
            <Link to="#">SAMSUNG</Link>
            <Link to="#">IPAD</Link>
            <Link to="#" className={styles['product-more']}>
              Nhiều hơn <i className="fa-solid fa-angle-double-right"></i>
            </Link>
          </div>
        </div>
        <div className={`mt-3 ${styles['product-wrapper']}`}>
          {Array.isArray(tabletProducts) && tabletProducts.map(renderProduct)}
        </div>
      </div>
    </>
  );
};

export default ProductDisplay;