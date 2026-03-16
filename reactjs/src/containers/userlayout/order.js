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

    // Lấy URL trực tiếp từ biến môi trường .env
    const API_URL = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        if (!user || !user.username || !user.auth) {
            navigate('/login');
        }
    }, [user, navigate]);

    const fetchOrders = useCallback(async (status, page = 1, sort = 'default') => {
        try {
            // Thay thế localhost bằng API_URL cho API danh sách đơn hàng
            const response = await axios.get(`${API_URL}/api/v1/listorder`, {
                params: {
                    username,
                    status: status || null,
                    page,
                    sort
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`
                },
                withCredentials: true
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
    }, [username, navigate, API_URL]); // Thêm API_URL vào dependencies

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
            minute: '2-digit'
        });
    };

    return (
        <div className={styles.container}>
            <h5 className="text-dark mb-4">Truy cập đơn hàng</h5>
            <div className={styles['progress-step']}>
                <div className={styles['progress-bar-bg']}></div>
                <div
                    className={styles['progress-bar-fill']}
                    style={{ width: `${selectedStatus === 'pending' ? 0 : selectedStatus === 'confirmed' ? 33.33 : selectedStatus === 'shipped' ? 66.66 : 100}%` }}
                ></div>
                <div
                    className={`${styles.step} ${selectedStatus === 'pending' ? styles.active : ''}`}
                    onClick={() => handleStepClick('pending')}
                >
                    <i className="fas fa-shopping-cart"></i>
                    <span>Đặt hàng</span>
                </div>
                <div
                    className={`${styles.step} ${selectedStatus === 'confirmed' ? styles.active : ''}`}
                    onClick={() => handleStepClick('confirmed')}
                >
                    <i className="fas fa-file-alt"></i>
                    <span>Chờ xác nhận</span>
                </div>
                <div
                    className={`${styles.step} ${selectedStatus === 'shipped' ? styles.active : ''}`}
                    onClick={() => handleStepClick('shipped')}
                >
                    <i className="fas fa-truck"></i>
                    <span>Chờ giao hàng</span>
                </div>
                <div
                    className={`${styles.step} ${selectedStatus === 'delivered' ? styles.active : ''}`}
                    onClick={() => handleStepClick('delivered')}
                >
                    <i className="fas fa-star"></i>
                    <span>Đánh giá</span>
                </div>
            </div>

            <div className={styles['filter-bar']}>
                <div className={styles['sort-wrapper']}>
                    <i className={`fas fa-sort ${styles['sort-icon']}`}></i>
                    <select
                        value={sortOption}
                        onChange={handleSortChange}
                        className={styles['sort-select']}
                    >
                        <option value="default">Mặc định (ID giảm dần)</option>
                        <option value="created_at_asc">Ngày tạo (tăng dần)</option>
                        <option value="created_at_desc">Ngày tạo (giảm dần)</option>
                    </select>
                </div>
            </div>

            {orders.length > 0 ? (
                <div className={styles['order-table-wrapper']}>
                    <table className={styles['order-table']}>
                        <thead>
                            <tr>
                                <th>Mã đơn hàng</th>
                                <th>Ngày tạo</th>
                                <th>Tổng tiền</th>
                                <th>Số điện thoại</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.order_id}>
                                    <td>#{order.order_id}</td>
                                    <td>{formatDate(order.created_at)}</td>
                                    <td>{order.total_price.toLocaleString('vi-VN')}₫</td>
                                    <td>{order.phone}</td>
                                    <td>
                                        <span className={`${styles.status} ${styles[`status-${order.status}`]}`}>
                                            {order.status === 'pending' ? 'Đang chờ' :
                                             order.status === 'confirmed' ? 'Đã xác nhận' :
                                             order.status === 'shipped' ? 'Đang giao' :
                                             order.status === 'delivered' ? 'Đã giao' :
                                             'Đã hủy'}
                                        </span>
                                    </td>
                                    <td>
                                        <Link
                                            to={`/account/detailorder/${order.order_id}`}
                                            className={styles['view-details-btn']}
                                        >
                                            Xem chi tiết
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className={styles['no-orders']}>Không có đơn hàng nào trong trạng thái này.</p>
            )}

            {totalPages > 1 && (
                <div className={styles['custom-pagination']}>
                    <Link
                        to={`?page=${currentPage - 1}`}
                        className={`${styles['custom-pagination-button']} ${styles.arrow} ${
                            currentPage === 1 ? styles.disabled : ''
                        }`}
                        onClick={(e) => {
                            if (currentPage === 1) e.preventDefault();
                            else handlePageChange(currentPage - 1);
                        }}
                    >
                        <i className={`fas fa-chevron-left ${styles['page-icon']}`}></i>
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
                        className={`${styles['custom-pagination-button']} ${styles.arrow} ${
                            currentPage === totalPages ? styles.disabled : ''
                        }`}
                        onClick={(e) => {
                            if (currentPage === totalPages) e.preventDefault();
                            else handlePageChange(currentPage + 1);
                        }}
                    >
                        <i className={`fas fa-chevron-right ${styles['page-icon']}`}></i>
                    </Link>
                </div>
            )}
        </div>
    );
};

export default OrderList;