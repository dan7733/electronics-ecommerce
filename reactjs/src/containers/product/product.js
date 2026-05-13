import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/product/product.module.css';

const ProductDisplay = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [phoneProducts, setPhoneProducts] = useState([]);
  const [laptopProducts, setLaptopProducts] = useState([]);
  const [tabletProducts, setTabletProducts] = useState([]);

  // Thêm 4 state loading cho 4 khu vực độc lập
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingPhone, setLoadingPhone] = useState(true);
  const [loadingLaptop, setLoadingLaptop] = useState(true);
  const [loadingTablet, setLoadingTablet] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Tải Sản Phẩm Mới
    axios.get(`${API_URL}/api/v1/latestproducts`)
      .then(response => setNewProducts(response.data.products))
      .catch(error => console.error('Error fetching new products:', error))
      .finally(() => setLoadingNew(false));

    // Tải Điện thoại
    axios.get(`${API_URL}/api/v1/latestproducts/1`)
      .then(response => setPhoneProducts(response.data.products))
      .catch(error => console.error('Error fetching phone products:', error))
      .finally(() => setLoadingPhone(false));

    // Tải Laptop
    axios.get(`${API_URL}/api/v1/latestproducts/2`)
      .then(response => setLaptopProducts(response.data.products))
      .catch(error => console.error('Error fetching laptop products:', error))
      .finally(() => setLoadingLaptop(false));

    // Tải Máy tính bảng
    axios.get(`${API_URL}/api/v1/latestproducts/9`)
      .then(response => setTabletProducts(response.data.products))
      .catch(error => console.error('Error fetching tablet products:', error))
      .finally(() => setLoadingTablet(false));
  }, [API_URL]);

  const renderProduct = (product) => (
    <Link key={product.product_id} className={styles['product-card']} to={`/detailproduct/${product.product_id}`}>
      
      <img
        src={`${API_URL}/images/products/${product.product_img}`}
        alt={product.name}
      />
      
      {/* Khối Info tự co giãn để gióng thẳng các dòng bên dưới */}
      <div className={styles['product-info']}>
        <h5 className={styles['product-title']}>{product.name}</h5>
        <p className={styles['product-promo']}>Giá quá rẻ</p>
      </div>

      {/* Khối Giá tiền */}
      <div className={styles['product-pricing']}>
        <p className={styles['product-old-price']}>
          {/* Dùng \u00A0 để tạo khoảng trống tàng hình thay vì dấu "-" */}
          {product.discount_price > 0 ? `${product.price.toLocaleString()} Đ` : '\u00A0'}
        </p>
        <p className={styles['product-new-price']}>
          {(product.discount_price > 0 ? product.discount_price : product.price).toLocaleString()} Đ
        </p>
      </div>
      
    </Link>
  );

  return (
    <>
      {/* ================= SẢN PHẨM MỚI ================= */}
      <div className={`container-lg mt-4 ${styles['product-container']}`}>
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
          {loadingNew ? (
            <div className={styles['loading-container']}>
              <div className={`${styles['spinner']} ${styles['spinner-red']}`}></div>
              <span className={styles['text-red']}>Đang tải...</span>
            </div>
          ) : Array.isArray(newProducts) && newProducts.length > 0 ? (
            newProducts.map(renderProduct)
          ) : (
            <p className={styles['no-product']}>Không có sản phẩm nào.</p>
          )}
        </div>
      </div>

      {/* ================= ĐIỆN THOẠI ================= */}
      <div className={`container-lg mt-4 ${styles['product-container']}`}>
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
          {loadingPhone ? (
            <div className={styles['loading-container']}>
              <div className={styles['spinner']}></div>
              <span>Đang tải...</span>
            </div>
          ) : Array.isArray(phoneProducts) && phoneProducts.length > 0 ? (
            phoneProducts.map(renderProduct)
          ) : (
            <p className={styles['no-product']}>Không có sản phẩm nào.</p>
          )}
        </div>
      </div>

      {/* ================= LAPTOP ================= */}
      <div className={`container-lg mt-4 ${styles['product-container']}`}>
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
          {loadingLaptop ? (
            <div className={styles['loading-container']}>
              <div className={styles['spinner']}></div>
              <span>Đang tải...</span>
            </div>
          ) : Array.isArray(laptopProducts) && laptopProducts.length > 0 ? (
            laptopProducts.map(renderProduct)
          ) : (
            <p className={styles['no-product']}>Không có sản phẩm nào.</p>
          )}
        </div>
      </div>

      {/* ================= MÁY TÍNH BẢNG ================= */}
      <div className={`container-lg mt-4 ${styles['product-container']}`}>
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
          {loadingTablet ? (
            <div className={styles['loading-container']}>
              <div className={styles['spinner']}></div>
              <span>Đang tải...</span>
            </div>
          ) : Array.isArray(tabletProducts) && tabletProducts.length > 0 ? (
            tabletProducts.map(renderProduct)
          ) : (
            <p className={styles['no-product']}>Không có sản phẩm nào.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDisplay;