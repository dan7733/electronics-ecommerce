import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import styles from '../css/cart/cart.module.css';
import axios from 'axios';

const Cart = () => {
  const [selectAll, setSelectAll] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartItems(storedCart.map(item => ({ ...item, selected: false })));

    const fetchStockStatus = async () => {
      const outOfStockSet = new Set();
      for (const item of storedCart) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/v1/productdetail/${item.product_id}`
          );
          const product = response.data.product;
          if (product.stock.quantity <= 0) {
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
  }, [API_BASE_URL]);

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    const updatedCart = cartItems.map(item => ({
      ...item,
      selected: !selectAll,
    }));
    setCartItems(updatedCart);
  };

  const handleSelectItem = (index) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const updatedCart = [...cartItems];
    updatedCart[globalIndex].selected = !updatedCart[globalIndex].selected;
    setCartItems(updatedCart);
    setSelectAll(updatedCart.every(item => item.selected));
  };

  const handleRemoveItem = (index) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const updatedCart = cartItems.filter((_, i) => i !== globalIndex);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    const removedItem = cartItems[globalIndex];
    if (outOfStockItems.has(removedItem.product_id)) {
      const newOutOfStock = new Set(outOfStockItems);
      newOutOfStock.delete(removedItem.product_id);
      setOutOfStockItems(newOutOfStock);
    }
  };

  const handleRemoveSelected = () => {
    const updatedCart = cartItems.filter(item => !item.selected);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    setSelectAll(false);
    
    const selectedProductIds = cartItems
      .filter(item => item.selected)
      .map(item => item.product_id);
    const newOutOfStock = new Set(outOfStockItems);
    selectedProductIds.forEach(id => newOutOfStock.delete(id));
    setOutOfStockItems(newOutOfStock);
  };

  const handleQuantityChange = (index, delta) => {
    const globalIndex = (currentPage - 1) * itemsPerPage + index;
    const updatedCart = [...cartItems];
    const newQuantity = updatedCart[globalIndex].quantity + delta;
    if (newQuantity > 0) {
      updatedCart[globalIndex].quantity = newQuantity;
      setCartItems(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
    }
  };

  const handleCheckout = () => {
    const selectedItems = cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }
    navigate('/payment', { state: { products: selectedItems } });
  };

  const hasOutOfStockSelected = cartItems.some(
    item => item.selected && outOfStockItems.has(item.product_id)
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
      if (i > 1 && i < totalPages) pages.push(i); // Tránh trùng lặp trang 1 và trang cuối
    }
    if (currentPage < totalPages - 3) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return [...new Set(pages)]; // Loại bỏ các số trùng nhau nếu có
  };

  return (
    <div className={`${styles['container-cart']} container mt-4`}>
      <div className="row">
        <div className="col-lg-10 offset-lg-1">
          
          {/* Checkout Button */}
          <div className={styles['checkout-bar']}>
            <button
              className={styles['checkout-btn']}
              onClick={handleCheckout}
              disabled={!cartItems.some(item => item.selected) || hasOutOfStockSelected}
            >
              Thanh toán
            </button>
          </div>

          {/* Select All Section */}
          <div className={styles['select-all-card']}>
            <input
              className={`${styles['detailproduct-checks']} me-3`}
              type="checkbox"
              id="selectAll"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            <label className="form-check-label fw-bold mb-0" htmlFor="selectAll" style={{ fontSize: '16px' }}>
              Chọn tất cả ({cartItems.length} sản phẩm)
            </label>
            <button
              className={`${styles['btn-trash']} ms-auto`}
              onClick={handleRemoveSelected}
              disabled={!cartItems.some(item => item.selected)}
              title="Xóa các sản phẩm đã chọn"
            >
              <i className="fa fa-trash"></i>
            </button>
          </div>

          {/* Product List */}
          <div id="product-list">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, index) => (
                <div key={`${item.product_id}-${item.storage}-${item.color}`} className={styles['product-card']}>
                  
                  {/* ZONE 1: Checkbox + Hình ảnh */}
                  <div className={styles['item-left']}>
                    <input
                      className={styles['detailproduct-checks']}
                      type="checkbox"
                      checked={item.selected || false}
                      onChange={() => handleSelectItem(index)}
                    />
                    <img
                      src={`${API_BASE_URL}/images/products/${item.product_img}`}
                      alt={item.name}
                      className={styles['product-img']}
                    />
                  </div>

                  {/* ZONE 2: Thông tin sản phẩm */}
                  <div className={styles['item-center']}>
                    <h6 className={styles['product-name']}>{item.name}</h6>
                    <p className={styles['product-variants']}>
                      Phân loại: {item.storage && item.color ? `${item.storage}, ${item.color}` : 'Mặc định'}
                    </p>
                    {outOfStockItems.has(item.product_id) && (
                      <p className={`${styles['out-of-stock']} text-danger`}>
                        <i className="fa-solid fa-circle-exclamation me-1"></i> Hết hàng
                      </p>
                    )}
                  </div>

                  {/* ZONE 3: Giá + Số lượng + Hành động */}
                  <div className={styles['item-right']}>
                    
                    {/* Cụm Giá */}
                    <div className={styles['price-group']}>
                      {item.discount_price ? (
                        <>
                          <div className={styles['price-new']}>{item.discount_price.toLocaleString()}₫</div>
                          <div className={styles['price-old']}>{item.price.toLocaleString()}₫</div>
                        </>
                      ) : (
                        <div className={styles['price-new']}>{item.price.toLocaleString()}₫</div>
                      )}
                    </div>

                    {/* Cụm Số lượng */}
                    <div className={styles['quantity-wrapper']}>
                      <button
                        className={styles['btn-quantity']}
                        onClick={() => handleQuantityChange(index, -1)}
                      >
                        -
                      </button>
                      <span className={styles['quantity-number']}>{item.quantity}</span>
                      <button
                        className={styles['btn-quantity']}
                        onClick={() => handleQuantityChange(index, 1)}
                      >
                        +
                      </button>
                    </div>

                    {/* Nút Xóa */}
                    <button
                      className={styles['btn-trash']}
                      onClick={() => handleRemoveItem(index)}
                      title="Xóa sản phẩm"
                    >
                      <i className="fa fa-trash"></i>
                    </button>

                  </div>
                </div>
              ))
            ) : (
              <div className="text-center mt-5 text-muted">
                <img src="/empty-cart.png" alt="Empty Cart" style={{ width: '150px', opacity: 0.5 }} onError={(e) => e.target.style.display = 'none'} />
                <h5 className="mt-3">Giỏ hàng của bạn đang trống</h5>
                <Link to="/" className="btn btn-outline-secondary mt-2" style={{ color: '#218282', borderColor: '#218282' }}>Tiếp tục mua sắm</Link>
              </div>
            )}
          </div>

          {/* Custom Smart Pagination */}
          {totalPages > 1 && (
            <div className={styles['custom-pagination']}>
              <Link
                to={`/cart?page=${currentPage - 1}`}
                className={`${styles['custom-pagination-button']} ${styles['arrow']} ${
                  currentPage === 1 ? styles['disabled'] : ''
                }`}
                onClick={(e) => {
                  if (currentPage === 1) e.preventDefault();
                  else handlePageChange(currentPage - 1);
                }}
              >
                &lt;
              </Link>

              {renderPagination().map((page, index) =>
                page === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={styles['custom-pagination-button']}
                    style={{ cursor: 'default', border: 'none', backgroundColor: 'transparent' }}
                  >
                    ...
                  </span>
                ) : (
                  <Link
                    key={page}
                    to={`/cart?page=${page}`}
                    className={`${styles['custom-pagination-button']} ${
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
                className={`${styles['custom-pagination-button']} ${styles['arrow']} ${
                  currentPage === totalPages ? styles['disabled'] : ''
                }`}
                onClick={(e) => {
                  if (currentPage === totalPages) e.preventDefault();
                  else handlePageChange(currentPage + 1);
                }}
              >
                &gt;
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Cart;