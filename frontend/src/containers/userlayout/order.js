import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Context } from '../login/context';
import styles from '../css/detailuser/order.module.css';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [sortOption, setSortOption] = useState('default');
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(Context);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user || !user.username || !user.auth) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchOrders = useCallback(
    async (status, page = 1, sort = 'default') => {
      try {
        // Đã xóa Authorization thủ công
        const response = await axios.get(`${API_URL}/api/v1/listorder`, {
          params: {
            username,
            status: status || null,
            page,
            sort,
          },
          withCredentials: true,
        });

        if (response.data.errCode === 0) {
          setOrders(response.data.data.orders);
          setCurrentPage(response.data.data.currentPage);
          setTotalPages(response.data.data.totalPages);
        } else {
          console.error(response.data.message);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate('/login');
        }
      }
    },
    [username, navigate, API_URL]
  );

  useEffect(() => {
    fetchOrders(selectedStatus, currentPage, sortOption);
  }, [selectedStatus, currentPage, sortOption, fetchOrders]);

  const handleStepClick = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const halfMaxPages = Math.floor(maxPagesToShow / 2);
      if (currentPage <= halfMaxPages) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + halfMaxPages >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - halfMaxPages;
        endPage = currentPage + halfMaxPages;
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  };

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
      <div className={styles['header-wrapper']}>
        <h4 className={styles['page-title']}>
          <i className="fa-solid fa-receipt me-2"></i>Quản lý đơn hàng
        </h4>

        <div className={styles['sort-wrapper']}>
          <i className={`fas fa-sort ${styles['sort-icon']}`}></i>
          <select
            value={sortOption}
            onChange={handleSortChange}
            className={styles['sort-select']}
          >
            <option value="default">Mặc định (Mới nhất)</option>
            <option value="created_at_asc">Ngày tạo (Cũ nhất)</option>
            <option value="created_at_desc">Ngày tạo (Mới nhất)</option>
          </select>
        </div>
      </div>

      <div className={styles['status-tabs']}>
        <button
          className={`${styles['tab-item']} ${
            selectedStatus === 'pending' ? styles.active : ''
          }`}
          onClick={() => handleStepClick('pending')}
        >
          <i className="fas fa-shopping-cart"></i>
          <span>Đặt hàng</span>
        </button>

        <button
          className={`${styles['tab-item']} ${
            selectedStatus === 'confirmed' ? styles.active : ''
          }`}
          onClick={() => handleStepClick('confirmed')}
        >
          <i className="fas fa-file-invoice"></i>
          <span>Xác nhận</span>
        </button>

        <button
          className={`${styles['tab-item']} ${
            selectedStatus === 'shipped' ? styles.active : ''
          }`}
          onClick={() => handleStepClick('shipped')}
        >
          <i className="fas fa-truck"></i>
          <span>Giao hàng</span>
        </button>

        <button
          className={`${styles['tab-item']} ${
            selectedStatus === 'delivered' ? styles.active : ''
          }`}
          onClick={() => handleStepClick('delivered')}
        >
          <i className="fas fa-check-circle"></i>
          <span>Hoàn tất</span>
        </button>
      </div>

      {orders.length > 0 ? (
        <>
          <div className={styles['desktop-table-wrapper']}>
            <table className={styles['order-table']}>
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Ngày tạo</th>
                  <th>Số điện thoại</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td>
                      <span className={styles['order-id']}>
                        #{order.order_id}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                    <td>{order.phone}</td>
                    <td>
                      <strong className={styles['order-price']}>
                        {order.total_price.toLocaleString('vi-VN')}₫
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          styles[`status-${order.status}`]
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="text-center">
                      <Link
                        to={`/account/detailorder/${order.order_id}`}
                        className={styles['view-details-btn']}
                      >
                        Chi tiết <i className="fa-solid fa-chevron-right ms-1"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles['mobile-card-list']}>
            {orders.map((order) => (
              <div key={order.order_id} className={styles['order-card']}>
                <div className={styles['card-header']}>
                  <span className={styles['order-id']}>#{order.order_id}</span>
                  <span
                    className={`${styles.status} ${
                      styles[`status-${order.status}`]
                    }`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className={styles['card-body']}>
                  <div className={styles['card-row']}>
                    <span className={styles['card-label']}>Ngày đặt:</span>
                    <span className={styles['card-value']}>
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <div className={styles['card-row']}>
                    <span className={styles['card-label']}>Số điện thoại:</span>
                    <span className={styles['card-value']}>{order.phone}</span>
                  </div>

                  <div className={styles['card-row']}>
                    <span className={styles['card-label']}>Tổng thanh toán:</span>
                    <strong className={styles['order-price']}>
                      {order.total_price.toLocaleString('vi-VN')}₫
                    </strong>
                  </div>
                </div>

                <div className={styles['card-footer']}>
                  <Link
                    to={`/account/detailorder/${order.order_id}`}
                    className={styles['view-details-btn']}
                  >
                    Xem chi tiết <i className="fa-solid fa-arrow-right ms-1"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles['empty-state']}>
          <i className="fa-solid fa-box-open"></i>
          <p>Không có đơn hàng nào trong trạng thái này.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles['custom-pagination']}>
          <Link
            to={`?page=${currentPage - 1}`}
            className={`${styles['custom-pagination-button']} ${
              styles.arrow
            } ${currentPage === 1 ? styles.disabled : ''}`}
            onClick={(e) => {
              if (currentPage === 1) e.preventDefault();
              else handlePageChange(currentPage - 1);
            }}
          >
            <i className="fas fa-chevron-left"></i>
          </Link>

          {renderPagination().map((pageItem, index) =>
            pageItem === '...' ? (
              <span
                key={`ellipsis-${index}`}
                className={styles['custom-pagination-button']}
                style={{ cursor: 'default', border: 'none' }}
              >
                ...
              </span>
            ) : (
              <Link
                key={pageItem}
                to={`?page=${pageItem}`}
                className={`${styles['custom-pagination-button']} ${
                  currentPage === pageItem ? styles.active : ''
                }`}
                onClick={() => handlePageChange(pageItem)}
              >
                {pageItem}
              </Link>
            )
          )}

          <Link
            to={`?page=${currentPage + 1}`}
            className={`${styles['custom-pagination-button']} ${
              styles.arrow
            } ${currentPage === totalPages ? styles.disabled : ''}`}
            onClick={(e) => {
              if (currentPage === totalPages) e.preventDefault();
              else handlePageChange(currentPage + 1);
            }}
          >
            <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrderList;