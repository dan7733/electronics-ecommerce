import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../login/context';
import ReviewForm from './ReviewForm';
import styles from '../css/detailuser/detailorder.module.css';

const OrderDetail = () => {
  const { orderid } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const [order, setOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState({});

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchOrderDetails = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orderdetail/${orderid}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt')}`,
        },
        withCredentials: true,
      });

      if (response.data.errCode === 0) {
        setOrder(response.data.data.order);
        setOrderDetails(response.data.data.orderDetails);

        const reviewPromises = response.data.data.orderDetails.map(async (detail) => {
          const reviewResponse = await axios.get(`${API_URL}/api/v1/user-review`, {
            params: { order_id: orderid, product_id: detail.product_id, username: user.username },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('jwt')}`,
            },
            withCredentials: true,
          });
          return { product_id: detail.product_id, review: reviewResponse.data.data };
        });

        const reviewResults = await Promise.all(reviewPromises);
        const reviewsMap = reviewResults.reduce((acc, { product_id, review }) => {
          acc[product_id] = review;
          return acc;
        }, {});
        setReviews(reviewsMap);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi lấy chi tiết đơn hàng.');
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [orderid, navigate, user, API_URL]);

  useEffect(() => {
    if (!user || !user.username || !user.auth) {
      navigate('/login');
    } else {
      fetchOrderDetails();
    }
  }, [user, navigate, fetchOrderDetails]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProductImageUrl = (imagePath) => {
    return `${API_URL}/images/products/${imagePath}`;
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'confirmed':
        return 'Đã xác nhận';
      case 'shipped':
        return 'Đang giao';
      case 'delivered':
        return 'Đã giao';
      case 'cancelled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header đơn hàng */}
      <div className={styles.headerRow}>
        <h4 className={styles.pageTitle}>
          <i className="fa-solid fa-file-invoice me-2"></i> Chi tiết đơn hàng #{orderid}
        </h4>
        <Link to={`/account/orderlist/${user?.username || ''}`} className={styles.backBtn}>
          <i className="fa-solid fa-arrow-left"></i> Quay lại danh sách đơn hàng
        </Link>
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải chi tiết đơn hàng...</p>
        </div>
      )}

      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && order && (
        <>
          {/* Khối thông tin đơn hàng & giao hàng */}
          <div className={styles.orderInfoGrid}>
            <div className={styles.infoCard}>
              <h6 className={styles.cardTitle}>
                <i className="fa-solid fa-circle-info me-2"></i> Thông tin đơn hàng
              </h6>
              <div className={styles.infoRow}>
                <span>Ngày tạo:</span>
                <strong>{formatDate(order.created_at)}</strong>
              </div>
              <div className={styles.infoRow}>
                <span>Trạng thái đơn:</span>
                <span className={`${styles.statusBadge} ${styles[`status-${order.status}`]}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span>Thanh toán:</span>
                <span
                  className={`${styles.paymentBadge} ${
                    order.status_payment === 'paid' ? styles.paid : styles.unpaid
                  }`}
                >
                  {order.status_payment === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </span>
              </div>
              <div className={styles.infoRowTotal}>
                <span>Tổng tiền thanh toán:</span>
                <strong className={styles.totalPrice}>
                  {order.total_price.toLocaleString('vi-VN')}₫
                </strong>
              </div>
            </div>

            {/* Thẻ Thông tin giao hàng đã fix layout */}
            <div className={styles.infoCard}>
              <h6 className={styles.cardTitle}>
                <i className="fa-solid fa-truck-ramp-box me-2"></i> Thông tin giao hàng
              </h6>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryLabel}>Số điện thoại:</span>
                <strong className={styles.deliveryValue}>{order.phone}</strong>
              </div>
              <div className={styles.deliveryRow}>
                <span className={styles.deliveryLabel}>Địa chỉ giao hàng:</span>
                <span className={styles.deliveryValue}>{order.address}</span>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          {orderDetails.length > 0 && (
            <div className={styles.sectionCard}>
              <h6 className={styles.cardTitle}>
                <i className="fa-solid fa-boxes-packing me-2"></i> Danh sách sản phẩm
              </h6>

              {/* Bảng cho Desktop */}
              <div className={styles.desktopTableWrapper}>
                <table className={styles.orderTable}>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-end">Đơn giá</th>
                      <th className="text-end">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.map((detail) => {
                      const itemPrice = detail.price || detail.discount_price || 0;
                      return (
                        <tr key={detail.order_detail_id}>
                          <td>
                            <div className={styles.productCell}>
                              <img
                                src={getProductImageUrl(detail.Product?.product_img || 'placeholder.jpg')}
                                alt={detail.Product?.name || 'Sản phẩm'}
                                className={styles.productImg}
                              />
                              <span className={styles.productName}>
                                {detail.Product?.name || 'Sản phẩm không xác định'}
                              </span>
                            </div>
                          </td>
                          <td className="text-center fw-bold">x{detail.quantity}</td>
                          <td className="text-end">{itemPrice.toLocaleString('vi-VN')}₫</td>
                          <td className="text-end fw-bold text-teal">
                            {(itemPrice * detail.quantity).toLocaleString('vi-VN')}₫
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Card List cho Mobile */}
              <div className={styles.mobileProductList}>
                {orderDetails.map((detail) => {
                  const itemPrice = detail.price || detail.discount_price || 0;
                  return (
                    <div key={detail.order_detail_id} className={styles.mobileProductCard}>
                      <img
                        src={getProductImageUrl(detail.Product?.product_img || 'placeholder.jpg')}
                        alt={detail.Product?.name || 'Sản phẩm'}
                        className={styles.productImgMobile}
                      />
                      <div className={styles.mobileProductDetails}>
                        <div className={styles.productName}>
                          {detail.Product?.name || 'Sản phẩm không xác định'}
                        </div>
                        <div className={styles.mobilePriceRow}>
                          <span>Số lượng: x{detail.quantity}</span>
                          <strong className={styles.mobilePrice}>
                            {(itemPrice * detail.quantity).toLocaleString('vi-VN')}₫
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Đánh giá sản phẩm */}
          {orderDetails.length > 0 && (
            <div className={styles.sectionCard}>
              <h6 className={styles.cardTitle}>
                <i className="fa-solid fa-star me-2"></i> Đánh giá sản phẩm
              </h6>
              <div className={styles.reviewList}>
                {orderDetails.map((detail) => (
                  <div key={detail.order_detail_id} className={styles.reviewItem}>
                    <div className={styles.reviewProductHeader}>
                      <img
                        src={getProductImageUrl(detail.Product?.product_img || 'placeholder.jpg')}
                        alt={detail.Product?.name || 'Sản phẩm'}
                        className={styles.reviewProductImg}
                      />
                      <span className={styles.reviewProductName}>
                        {detail.Product?.name || 'Sản phẩm không xác định'}
                      </span>
                    </div>

                    <div className={styles.reviewBody}>
                      {order?.status === 'delivered' && order?.status_payment === 'paid' ? (
                        <ReviewForm
                          orderId={orderid}
                          productId={detail.product_id}
                          productName={detail.Product?.name || 'Sản phẩm không xác định'}
                          existingReview={reviews[detail.product_id] || null}
                          onReviewSubmitted={fetchOrderDetails}
                        />
                      ) : (
                        <div className={styles.reviewDisabledNotice}>
                          <i className="fa-solid fa-circle-info me-2"></i>
                          Sản phẩm chỉ có thể đánh giá sau khi đơn hàng giao thành công và hoàn tất thanh toán.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderDetail;