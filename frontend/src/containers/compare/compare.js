import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../css/compare/compare.module.css';

const Compare = () => {
  const [compareProducts, setCompareProducts] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    // Tải danh sách sản phẩm so sánh từ localStorage
    const storedCompare = JSON.parse(localStorage.getItem('compare')) || [];
    setCompareProducts(storedCompare);
  }, []);

  const handleRemoveProduct = (productId) => {
    const updatedCompare = compareProducts.filter(
      (product) => product.product_id !== productId
    );
    setCompareProducts(updatedCompare);
    localStorage.setItem('compare', JSON.stringify(updatedCompare));
  };

  const product1 = compareProducts[0] || null;
  const product2 = compareProducts[1] || null;

  // Lấy toàn bộ danh sách các key thông số kỹ thuật độc nhất từ cả 2 sản phẩm
  const getAllSpecKeys = () => {
    const specs1 = product1?.technical_details || {};
    const specs2 = product2?.technical_details || {};
    const keys1 = Object.keys(specs1);
    const keys2 = Object.keys(specs2);

    return Array.from(new Set([...keys1, ...keys2]));
  };

  const specKeys = getAllSpecKeys();

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumbNav}>
        <Link to="/" className={styles.breadcrumbLink}>
          TRANG CHỦ
        </Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>So sánh sản phẩm</span>
      </nav>

      {/* Header */}
      <div className={styles.headerWrapper}>
        <h4 className={styles.pageTitle}>
          <i className="fa-solid fa-scale-balanced me-2"></i>So sánh sản phẩm
        </h4>
      </div>

      {compareProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <i className="fa-solid fa-scale-unbalanced"></i>
          <p>Danh sách so sánh hiện đang trống.</p>
          <Link to="/" className={styles.shopNowBtn}>
            <i className="fa-solid fa-cart-shopping me-2"></i>Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <>
          {/* Hàng thẻ sản phẩm so sánh */}
          <div className={styles.productGrid}>
            <div className={styles.labelCard}>
              <div className={styles.labelTitle}>So sánh sản phẩm</div>
              <p className={styles.labelSub}>Tên sản phẩm & Giá bán</p>
            </div>

            {/* Sản phẩm 1 */}
            <div className={styles.productCard}>
              {product1 ? (
                <>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveProduct(product1.product_id)}
                    title="Xóa sản phẩm"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <div className={styles.imgWrapper}>
                    <img
                      src={`${API_BASE_URL}/images/products/${product1.product_img}`}
                      alt={product1.name}
                      className={styles.productImg}
                    />
                  </div>
                  <h6 className={styles.productName}>{product1.name}</h6>
                  <div className={styles.priceContainer}>
                    {product1.discount_price ? (
                      <>
                        <span className={styles.oldPrice}>
                          {product1.price.toLocaleString()}₫
                        </span>
                        <span className={styles.newPrice}>
                          {product1.discount_price.toLocaleString()}₫
                        </span>
                      </>
                    ) : (
                      <span className={styles.newPrice}>
                        {product1.price.toLocaleString()}₫
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.noProductSlot}>
                  <i className="fa-solid fa-plus-circle"></i>
                  <span>Chưa có sản phẩm 1</span>
                </div>
              )}
            </div>

            {/* Sản phẩm 2 */}
            <div className={styles.productCard}>
              {product2 ? (
                <>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveProduct(product2.product_id)}
                    title="Xóa sản phẩm"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                  <div className={styles.imgWrapper}>
                    <img
                      src={`${API_BASE_URL}/images/products/${product2.product_img}`}
                      alt={product2.name}
                      className={styles.productImg}
                    />
                  </div>
                  <h6 className={styles.productName}>{product2.name}</h6>
                  <div className={styles.priceContainer}>
                    {product2.discount_price ? (
                      <>
                        <span className={styles.oldPrice}>
                          {product2.price.toLocaleString()}₫
                        </span>
                        <span className={styles.newPrice}>
                          {product2.discount_price.toLocaleString()}₫
                        </span>
                      </>
                    ) : (
                      <span className={styles.newPrice}>
                        {product2.price.toLocaleString()}₫
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.noProductSlot}>
                  <i className="fa-solid fa-plus-circle"></i>
                  <span>Chưa có sản phẩm 2</span>
                </div>
              )}
            </div>
          </div>

          {/* Bảng so sánh thông số kỹ thuật nằm ngang hàng */}
          <div className={styles.specsSection}>
            <h6 className={styles.specsHeaderTitle}>
              <i className="fa-solid fa-sliders me-2"></i>So sánh thông số kỹ thuật chi tiết
            </h6>

            <div className={styles.tableResponsive}>
              <table className={styles.specTable}>
                <thead>
                  <tr>
                    <th className={styles.thLabel}>Thông số kỹ thuật</th>
                    <th className={styles.thProduct}>{product1 ? product1.name : 'Sản phẩm 1'}</th>
                    <th className={styles.thProduct}>{product2 ? product2.name : 'Sản phẩm 2'}</th>
                  </tr>
                </thead>
                <tbody>
                  {specKeys.length > 0 ? (
                    specKeys.map((key, index) => {
                      const val1 = product1?.technical_details?.[key];
                      const val2 = product2?.technical_details?.[key];

                      const hasVal1 =
                        val1 !== undefined && val1 !== null && String(val1).trim() !== '';
                      const hasVal2 =
                        val2 !== undefined && val2 !== null && String(val2).trim() !== '';

                      return (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? styles.rowEven : styles.rowOdd}
                        >
                          <td className={styles.specKeyCell}>{key}</td>
                          <td
                            className={`${styles.specValueCell} ${
                              !hasVal1 ? styles.missingValue : ''
                            }`}
                          >
                            {hasVal1 ? val1 : 'Đang cập nhật'}
                          </td>
                          <td
                            className={`${styles.specValueCell} ${
                              !hasVal2 ? styles.missingValue : ''
                            }`}
                          >
                            {hasVal2 ? val2 : 'Đang cập nhật'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className={styles.noSpecsText}>
                        Không có dữ liệu thông số kỹ thuật để so sánh.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Compare;