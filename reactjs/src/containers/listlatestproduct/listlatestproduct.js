import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/listlatestproduct/listlatestproduct.module.css';
import dfproduct from '../../img/dfproduct/dfimgproduct.png';

const ListLastestProduct = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const limit = 4; // Fetch 4 products per page

  // Lấy URL trực tiếp từ biến môi trường
  const BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // API endpoint sử dụng biến môi trường
  const API_ENDPOINT = `${BASE_URL}/api/v1/listlatestproduct`;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(API_ENDPOINT, {
          params: { page, limit }
        });

        // Expecting response structure: { errCode, message, listProduct, hasMore }
        const newProducts = response.data.listProduct || [];
        setProducts(prev => [...prev, ...newProducts]);
        setHasMore(response.data.hasMore || newProducts.length === limit);
      } catch (err) {
        setError('Không thể tải sản phẩm. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, API_ENDPOINT]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const renderProduct = (product) => (
    <Link
      key={product.product_id}
      className={`${styles['product-card']} ${styles['product-card--animate']}`}
      to={`/detailproduct/${product.product_id}`}
      aria-label={`Xem chi tiết ${product.name}, giá ${(product.discount_price > 0 ? product.discount_price : product.price).toLocaleString()} VND`}
    >
      <div className={styles['image-wrapper']}>
        <img
          // Thay thế localhost bằng BASE_URL cho ảnh sản phẩm
          src={product.product_img ? `${BASE_URL}/images/products/${product.product_img}` : dfproduct}
          alt={`Hình ảnh ${product.name}`}
          onError={(e) => (e.target.src = dfproduct)}
        />
        {product.discount_price > 0 && <span className={styles['discount-ribbon']}>Sale</span>}
      </div>
      <h5 className={styles['product-title']}>{product.name}</h5>
      {product.discount_price > 0 ? (
        <>
          <p className={styles['product-old-price']}>
            {product.price.toLocaleString()} Đ
          </p>
          <p className={styles['product-new-price']}>
            {product.discount_price.toLocaleString()} Đ
          </p>
        </>
      ) : (
        <p className={styles['product-new-price']}>
          {product.price.toLocaleString()} Đ
        </p>
      )}
    </Link>
  );

  return (
    <div className={`container-lg mt-3 ${styles['product-container']}`}>
      <div className={styles['category-banner']}>
        <h2 className={styles['category-title']}>SẢN PHẨM MỚI NHẤT</h2>
        <div className={styles['category-underline']}></div>
      </div>
      <div className={`mt-3 ${styles['product-wrapper']}`}>
        {products.length > 0 ? (
          products.map(renderProduct)
        ) : !loading && !error ? (
          <p>Không có sản phẩm nào để hiển thị.</p>
        ) : null}
      </div>
      {loading && <div className="text-center my-3">Đang tải...</div>}
      {error && <div className="text-danger text-center my-3">{error}</div>}
      {hasMore && !loading && !error && (
        <div className="text-center my-3">
          <button
            className={styles['load-more-btn']}
            onClick={handleLoadMore}
            aria-label="Tải thêm sản phẩm"
          >
            Xem thêm
          </button>
        </div>
      )}
    </div>
  );
};

export default ListLastestProduct;