import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Context } from '../../containers/login/context';
import styles from '../css/recommendProduct/recommendproduct.module.css';
import dfproduct from '../../img/dfproduct/dfimgproduct.png';

const RecommendProduct = () => {
  const { user } = useContext(Context);
  const { id: productId } = useParams();
  const [collaborativeProducts, setCollaborativeProducts] = useState([]);
  const [productBasedProducts, setProductBasedProducts] = useState([]);

  // Lấy URL trực tiếp từ biến môi trường
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  // Fetch collaborative recommendations
  useEffect(() => {
    const fetchCollaborativeRecommendations = async () => {
      try {
        const username = user?.username;
        // Sử dụng API_URL thay thế cho localhost
        const url = username
          ? `${API_URL}/api/v1/recommend/collaborative/${username}`
          : `${API_URL}/api/v1/recommend/collaborative`;
        const response = await axios.get(url);
        if (response.data.errCode === 0) {
          setCollaborativeProducts(response.data.product);
        }
      } catch (error) {
        console.error('Error fetching collaborative recommendations:', error);
      }
    };

    fetchCollaborativeRecommendations();
  }, [user, API_URL]);

  // Fetch product-based recommendations
  useEffect(() => {
    const fetchProductBasedRecommendations = async () => {
      try {
        // Sử dụng API_URL cho API gợi ý theo sản phẩm
        const response = await axios.get(
          `${API_URL}/api/v1/recommend/product-based/${productId}`
        );
        if (response.data.errCode === 0) {
          setProductBasedProducts(response.data.product);
        }
      } catch (error) {
        console.error('Error fetching product-based recommendations:', error);
      }
    };

    if (productId) {
      fetchProductBasedRecommendations();
    }
  }, [productId, API_URL]);

  return (
    <div className="container mt-5">
      <div className={`row g-2 ${styles['detailproduct-contain-three']}`}>
        {/* Product-Based Recommendations */}
        <div
          className={`col-lg-6 col-md-6 col-12 ${styles['detailproduct-product-buy']}`}
        >
          <div className={styles['detailproduct-buy']}>
            <h2 className={styles['detailproduct-buy-title']}>
              Sản phẩm liên quan
            </h2>
          </div>
          <div className={styles['detailproduct-option']}>
            <div className={styles['detailproduct-contain-img']}>
              {productBasedProducts.length > 0 ? (
                productBasedProducts.map((product, index) => (
                  <Link
                    key={product.product_id}
                    to={`/detailproduct/${product.product_id}`}
                    className={`${styles['detailproduct-contain-item']} ${styles['fade-in']}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <img
                      className={styles['detailproduct-img']}
                      src={
                        product.product_img
                          ? `${API_URL}/images/products/${product.product_img}`
                          : dfproduct
                      }
                      alt={product.name}
                    />
                    <p className={styles['detailproduct-as']}>{product.name}</p>
                    <p className={styles['detailproduct-price']}>
                      {(product.discount_price || product.price).toLocaleString()} đ
                    </p>
                  </Link>
                ))
              ) : (
                <p className={styles['no-products']}>Không có sản phẩm phù hợp.</p>
              )}
            </div>
          </div>
        </div>

        {/* Collaborative Recommendations */}
        <div
          className={`col-lg-6 col-md-6 col-12 ${styles['detailproduct-container-box']}`}
        >
          <h2 className={styles['detailproduct-title-header']}>
            Sản phẩm gợi ý cho bạn
          </h2>
          <div className={styles['detailproduct-contain-box']}>
            {collaborativeProducts.length > 0 ? (
              collaborativeProducts.map((product, index) => (
                <Link
                  key={product.product_id}
                  to={`/detailproduct/${product.product_id}`}
                  className={`${styles['detailproduct-product-item']} ${styles['fade-in']}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <img
                    src={
                      product.product_img
                        ? `${API_URL}/images/products/${product.product_img}`
                        : dfproduct
                    }
                    alt={product.name}
                  />
                  <div className={styles['detailproduct-product-details']}>
                    <div>{product.name}</div>
                    <div className={styles['detailproduct-sale-price']}>
                      {(product.discount_price || product.price).toLocaleString()} đ
                    </div>
                    <div className={styles['detailproduct-old-price']}>
                      {product.price.toLocaleString()} đ
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className={styles['no-products']}>Không có sản phẩm gợi ý.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendProduct;