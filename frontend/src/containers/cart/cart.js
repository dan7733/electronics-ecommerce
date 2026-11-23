import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import styles from '../css/cart/cart.module.css';
import axios from 'axios';
import { Context } from '../login/context';

const Cart = () => {
  const { user } = useContext(Context);
  const [selectAll, setSelectAll] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  const getCartKey = () => {
    if (user && user.auth && (user.user_id || user.username)) {
      return `cart_${user.user_id || user.username}`;
    }
    return 'cart_guest';
  };

  useEffect(() => {
    const currentKey = getCartKey();

    const legacyCart = localStorage.getItem('cart');
    if (legacyCart && currentKey === 'cart_guest') {
      localStorage.setItem('cart_guest', legacyCart);
      localStorage.removeItem('cart');
    }

    if (user && user.auth && (user.user_id || user.username)) {
      const guestCart = JSON.parse(localStorage.getItem('cart_guest')) || [];
      const userCart = JSON.parse(localStorage.getItem(currentKey)) || [];

      if (guestCart.length > 0) {
        const mergedCart = [...userCart];
        guestCart.forEach((gItem) => {
          const existingIndex = mergedCart.findIndex(
            (uItem) =>
              uItem.product_id === gItem.product_id &&
              uItem.storage === gItem.storage &&
              uItem.color === gItem.color
          );
          if (existingIndex >= 0) {
            mergedCart[existingIndex].quantity += gItem.quantity;
          } else {
            mergedCart.push(gItem);
          }
        });
        localStorage.setItem(currentKey, JSON.stringify(mergedCart));
        localStorage.removeItem('cart_guest');
      }
    }

    const storedCart = JSON.parse(localStorage.getItem(currentKey)) || [];
    setCartItems(storedCart.map((item) => ({ ...item, selected: item.selected || false })));

    const fetchStockStatus = async () => {
      const outOfStockSet = new Set();
      for (const item of storedCart) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/v1/productdetail/${item.product_id}`
          );
          const product = response.data.product;
          if (!product || !product.stock || product.stock.quantity <= 0) {
            outOfStockSet.add(item.product_id);
          }
        } catch (error) {
          console.error(`Error fetching stock for product ${item.product_id}:`, error);
          outOfStockSet.add(item.product_id);
        }
      }
      setOutOfStockItems(outOfStockSet);
    };

    fetchStockStatus();
  }, [user, API_BASE_URL]);

  const updateLocalStorage = (newCart) => {
    const key = getCartKey();
    localStorage.setItem(key, JSON.stringify(newCart));
  };

  const handleSelectAll = () => {
    const nextSelectAll = !selectAll;
    setSelectAll(nextSelectAll);
    const updatedCart = cartItems.map((item) => ({
      ...item,
      selected: outOfStockItems.has(item.product_id) ? false : nextSelectAll,
    }));
    setCartItems(updatedCart);
    updateLocalStorage(updatedCart);
  };

  const handleSelectItem = (index) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const targetItem = cartItems[globalIndex];

    if (outOfStockItems.has(targetItem.product_id)) return;

    const updatedCart = [...cartItems];
    updatedCart[globalIndex].selected = !updatedCart[globalIndex].selected;
    setCartItems(updatedCart);
    updateLocalStorage(updatedCart);

    const validItems = updatedCart.filter((item) => !outOfStockItems.has(item.product_id));
    setSelectAll(validItems.length > 0 && validItems.every((item) => item.selected));
  };

  const handleRemoveItem = (index) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const updatedCart = cartItems.filter((_, i) => i !== globalIndex);
    setCartItems(updatedCart);
    updateLocalStorage(updatedCart);

    const removedItem = cartItems[globalIndex];
    if (outOfStockItems.has(removedItem.product_id)) {
      const newOutOfStock = new Set(outOfStockItems);
      newOutOfStock.delete(removedItem.product_id);
      setOutOfStockItems(newOutOfStock);
    }
  };

  const handleRemoveSelected = () => {
    const updatedCart = cartItems.filter((item) => !item.selected);
    setCartItems(updatedCart);
    updateLocalStorage(updatedCart);
    setSelectAll(false);

    const selectedProductIds = cartItems
      .filter((item) => item.selected)
      .map((item) => item.product_id);
    const newOutOfStock = new Set(outOfStockItems);
    selectedProductIds.forEach((id) => newOutOfStock.delete(id));
    setOutOfStockItems(newOutOfStock);
  };

  const handleQuantityChange = (index, delta) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const updatedCart = [...cartItems];
    const newQuantity = updatedCart[globalIndex].quantity + delta;

    if (newQuantity > 0) {
      updatedCart[globalIndex].quantity = newQuantity;
      setCartItems(updatedCart);
      updateLocalStorage(updatedCart);
    }
  };

  const handleCheckout = () => {
    const selectedItems = cartItems.filter((item) => item.selected);
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }
    navigate('/payment', { state: { products: selectedItems } });
  };

  const selectedItems = cartItems.filter((item) => item.selected);
  const totalSubtotal = selectedItems.reduce((sum, item) => {
    const price = item.discount_price > 0 ? item.discount_price : item.price;
    return sum + price * item.quantity;
  }, 0);

  const totalOriginal = selectedItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const totalDiscount = totalOriginal - totalSubtotal;

  const hasOutOfStockSelected = cartItems.some(
    (item) => item.selected && outOfStockItems.has(item.product_id)
  );

  const totalPages = Math.ceil(cartItems.length / itemsPerPage);
  const paginatedItems = cartItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setSearchParams({ page: page.toString() });
    }
  };

  const renderPagination = () => {
    const pages = [];
    pages.push(1);
    if (currentPage > 4) pages.push('...');
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) pages.push(i);
    }
    if (currentPage < totalPages - 3) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return [...new Set(pages)];
  };

  return (
    <div className={`${styles['container-cart']} container my-4`}>
      <div className={styles['cart-header-title']}>
        <h3>
          <i className="fa-solid fa-cart-shopping me-2"></i>Giỏ hàng của bạn
        </h3>
        <span className={styles['cart-count-badge']}>{cartItems.length} sản phẩm</span>
      </div>

      {cartItems.length > 0 ? (
        <div className="row g-4">
          {/* CỘT TRÁI */}
          <div className="col-lg-8 col-12">
            <div className={styles['select-all-card']}>
              <div className="d-flex align-items-center">
                <input
                  className={styles['custom-checkbox']}
                  type="checkbox"
                  id="selectAll"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                <label className="form-check-label fw-bold ms-2" htmlFor="selectAll">
                  Chọn tất cả ({cartItems.length})
                </label>
              </div>

              <button
                className={styles['btn-trash-selected']}
                onClick={handleRemoveSelected}
                disabled={!cartItems.some((item) => item.selected)}
                title="Xóa các sản phẩm đã chọn"
              >
                <i className="fa-regular fa-trash-can me-1"></i> Xóa đã chọn
              </button>
            </div>

            <div className={styles['product-list']}>
              {paginatedItems.map((item, index) => {
                const isOutOfStock = outOfStockItems.has(item.product_id);
                return (
                  <div
                    key={`${item.product_id}-${item.storage || ''}-${item.color || ''}`}
                    className={`${styles['product-card']} ${
                      isOutOfStock ? styles['card-disabled'] : ''
                    }`}
                  >
                    {/* Zone 1: Checkbox + Ảnh */}
                    <div className={styles['item-left']}>
                      <input
                        className={styles['custom-checkbox']}
                        type="checkbox"
                        checked={item.selected || false}
                        disabled={isOutOfStock}
                        onChange={() => handleSelectItem(index)}
                      />
                      <div className={styles['img-wrapper']}>
                        <img
                          src={`${API_BASE_URL}/images/products/${item.product_img}`}
                          alt={item.name}
                          className={styles['product-img']}
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                      </div>
                    </div>

                    {/* Zone 2: Tên + Thông tin */}
                    <div className={styles['item-center']}>
                      <h6 className={styles['product-name']}>{item.name}</h6>
                      <div className={styles['product-variants']}>
                        {item.storage && <span className="me-2">PB: {item.storage}</span>}
                        {item.color && <span>Màu: {item.color}</span>}
                        {!item.storage && !item.color && <span>Mặc định</span>}
                      </div>

                      {isOutOfStock ? (
                        <div className={styles['out-of-stock-badge']}>
                          <i className="fa-solid fa-circle-exclamation me-1"></i> Tạm hết hàng
                        </div>
                      ) : (
                        <div className={styles['in-stock-badge']}>
                          <i className="fa-solid fa-circle-check me-1"></i> Còn hàng
                        </div>
                      )}
                    </div>

                    {/* Zone 3: Giá + Nhóm Nút bấm */}
                    <div className={styles['item-right']}>
                      <div className={styles['price-group']}>
                        {item.discount_price > 0 ? (
                          <>
                            <div className={styles['price-new']}>
                              {(item.discount_price * item.quantity).toLocaleString()}₫
                            </div>
                            <div className={styles['price-old']}>
                              {(item.price * item.quantity).toLocaleString()}₫
                            </div>
                          </>
                        ) : (
                          <div className={styles['price-new']}>
                            {(item.price * item.quantity).toLocaleString()}₫
                          </div>
                        )}
                      </div>

                      {/* Flex gom nhóm Số lượng & Xóa */}
                      <div className="d-flex align-items-center gap-2">
                        <div className={styles['quantity-wrapper']}>
                          <button
                            className={styles['btn-quantity']}
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={item.quantity <= 1 || isOutOfStock}
                          >
                            -
                          </button>
                          <span className={styles['quantity-number']}>{item.quantity}</span>
                          <button
                            className={styles['btn-quantity']}
                            onClick={() => handleQuantityChange(index, 1)}
                            disabled={isOutOfStock}
                          >
                            +
                          </button>
                        </div>

                        <button
                          className={styles['btn-trash-single']}
                          onClick={() => handleRemoveItem(index)}
                          title="Xóa sản phẩm"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className={styles['custom-pagination']}>
                <Link
                  to={`/cart?page=${currentPage - 1}`}
                  className={`${styles['pagination-btn']} ${
                    currentPage === 1 ? styles['disabled'] : ''
                  }`}
                  onClick={(e) => {
                    if (currentPage === 1) e.preventDefault();
                    else handlePageChange(currentPage - 1);
                  }}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </Link>

                {renderPagination().map((page, idx) =>
                  page === '...' ? (
                    <span key={`ellipsis-${idx}`} className={styles['pagination-ellipsis']}>
                      ...
                    </span>
                  ) : (
                    <Link
                      key={page}
                      to={`/cart?page=${page}`}
                      className={`${styles['pagination-btn']} ${
                        currentPage === page ? styles['active'] : ''
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Link>
                  )
                )}

                <Link
                  to={`/cart?page=${currentPage + 1}`}
                  className={`${styles['pagination-btn']} ${
                    currentPage === totalPages ? styles['disabled'] : ''
                  }`}
                  onClick={(e) => {
                    if (currentPage === totalPages) e.preventDefault();
                    else handlePageChange(currentPage + 1);
                  }}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </Link>
              </div>
            )}
          </div>

          {/* CỘT PHẢI */}
          <div className="col-lg-4 col-12">
            <div className={styles['summary-sticky-card']}>
              <h5 className={styles['summary-title']}>Tóm tắt đơn hàng</h5>

              <div className={styles['summary-row']}>
                <span>Sản phẩm đã chọn:</span>
                <strong>{selectedItems.length} sản phẩm</strong>
              </div>

              <div className={styles['summary-row']}>
                <span>Tạm tính:</span>
                <strong>{totalSubtotal.toLocaleString()}₫</strong>
              </div>

              {totalDiscount > 0 && (
                <div className={`${styles['summary-row']} text-success`}>
                  <span>Tiết kiệm được:</span>
                  <strong>-{totalDiscount.toLocaleString()}₫</strong>
                </div>
              )}

              <div className={styles['summary-row']}>
                <span>Phí vận chuyển:</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  Tính tại trang thanh toán
                </span>
              </div>

              <hr className={styles['summary-divider']} />

              <div className={styles['summary-total-row']}>
                <span>Tổng thanh toán:</span>
                <span className={styles['total-price']}>{totalSubtotal.toLocaleString()}₫</span>
              </div>

              <button
                className={styles['checkout-btn']}
                onClick={handleCheckout}
                disabled={selectedItems.length === 0 || hasOutOfStockSelected}
              >
                TIẾN HÀNH THANH TOÁN ({selectedItems.length})
              </button>

              {hasOutOfStockSelected && (
                <p className={styles['checkout-warning']}>
                  <i className="fa-solid fa-triangle-exclamation me-1"></i> Vui lòng bỏ chọn các sản
                  phẩm hết hàng trước khi thanh toán.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className={styles['empty-cart-card']}>
          <div className={styles['empty-cart-icon']}>
            <i className="fa-solid fa-basket-shopping"></i>
          </div>
          <h4>Giỏ hàng của bạn đang trống</h4>
          <p>Hãy khám phá thêm hàng ngàn sản phẩm chất lượng tại ESHOP nhé!</p>
          <Link to="/" className={styles['btn-continue-shopping']}>
            <i className="fa-solid fa-arrow-left me-2"></i> Tiếp tục mua sắm
          </Link>
        </div>
      )}
    </div>
  );
};

export default Cart;