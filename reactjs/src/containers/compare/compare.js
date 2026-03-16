import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../css/compare/compare.module.css';

const Compare = () => {
  const [compareProducts, setCompareProducts] = useState([]);

  // Lấy URL base từ biến môi trường
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Load comparison list from localStorage
    const storedCompare = JSON.parse(localStorage.getItem('compare')) || [];
    setCompareProducts(storedCompare);
  }, []);

  const handleRemoveProduct = (productId) => {
    // Filter out the product to be removed
    const updatedCompare = compareProducts.filter(
      (product) => product.product_id !== productId
    );
    // Update state and localStorage
    setCompareProducts(updatedCompare);
    localStorage.setItem('compare', JSON.stringify(updatedCompare));
  };

  const renderProduct = (product, index) => {
    if (!product) {
      return (
        <div className="col" key={index}>
          <div
            className={`${styles.productBox} d-flex justify-content-center align-items-center`}
          >
            <span className={styles.noProduct}>Chưa có sản phẩm</span>
          </div>
        </div>
      );
    }

    return (
      <div className="col" key={index}>
        <div className={styles.productBox}>
          <button
            className={styles.removeButton}
            onClick={() => handleRemoveProduct(product.product_id)}
            title="Xóa sản phẩm"
          >
            <i className="fa-solid fa-times"></i>
          </button>
          {/* Thay thế localhost bằng API_BASE_URL */}
          <img
            src={`${API_BASE_URL}/images/products/${product.product_img}`}
            alt={product.name}
            className="img-fluid mb-2"
          />
          <h6>{product.name}</h6>
          {product.discount_price ? (
            <>
              <div className={styles.oldPrice}>
                {product.price.toLocaleString()}₫
              </div>
              <div className={styles.newPrice}>
                {product.discount_price.toLocaleString()}₫
              </div>
            </>
          ) : (
            <div className={styles.newPrice}>
              {product.price.toLocaleString()}₫
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProductSpecs = (product, index) => {
    if (!product) {
      return (
        <div className="col" key={index}>
          <div
            className={`${styles.productBoxCompare} text-muted text-center`}
          >
            <p>Chưa có sản phẩm</p>
          </div>
        </div>
      );
    }

    return (
      <div className="col" key={index}>
        <div className={`${styles.productBoxCompare} text-start`}>
          {product.technical_details ? (
            Object.entries(product.technical_details)
              .slice(2)
              .map(([key, value], idx) => (
                <p key={idx}>
                  <strong>{key}:</strong> {value}
                </p>
              ))
          ) : (
            <p>Không có thông số kỹ thuật</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-3">
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link to="/" className={styles.breadcrumb1}>
          TRANG CHỦ
        </Link>{' '}
        / <span>So sánh sản phẩm</span>
      </nav>

      {/* Tiêu đề */}
      <h5 className="mb-3">So sánh sản phẩm</h5>

      {/* Dòng sản phẩm */}
      <div className="row g-3 mb-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3">
        {/* Mô tả */}
        <div className="col">
          <div className={`${styles.productBox} bg-light`}>
            <div className={styles.compareHeading}>So sánh sản phẩm</div>
            <p className="mb-0">Tên sản phẩm<br />& Giá</p>
          </div>
        </div>

        {/* Sản phẩm 1 */}
        {renderProduct(compareProducts[0], 0)}

        {/* Sản phẩm 2 */}
        {renderProduct(compareProducts[1], 1)}
      </div>

      {/* So sánh nhanh */}
      <h6 className="mt-4 mb-3">So sánh nhanh</h6>

      <div className="row g-3 mb-4 row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-3">
        {/* Tiêu đề thông số */}
        <div className="col">
          <div className={`${styles.productBox} bg-light`}>
            <h6 className={styles.specTitle}>Thông số kỹ thuật</h6>
          </div>
        </div>

        {/* Thông số sản phẩm 1 */}
        {renderProductSpecs(compareProducts[0], 0)}

        {/* Thông số sản phẩm 2 */}
        {renderProductSpecs(compareProducts[1], 1)}
      </div>
    </div>
  );
};

export default Compare;