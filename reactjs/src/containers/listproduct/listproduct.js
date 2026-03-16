import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/listproduct/listproduct.module.css';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('searchkeyword') || ''; // Lấy từ khóa từ URL
  const [products, setProducts] = useState([]);
  const [minPrice, setMinPrice] = useState(''); // Giá tối thiểu nhập
  const [maxPrice, setMaxPrice] = useState(''); // Giá tối đa nhập
  const [filterMinPrice, setFilterMinPrice] = useState(0); // Giá tối thiểu gửi API
  const [filterMaxPrice, setFilterMaxPrice] = useState(0); // Giá tối đa gửi API
  const [rangeMaxPrice, setRangeMaxPrice] = useState(0); // Giá tối đa từ API
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState('default');
  const [category, setCategory] = useState([]);
  const [brand, setBrand] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // Khai báo biến môi trường cho API
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const categoryId = searchParams.get('categoryId');
  const brandId = searchParams.get('brandId');

  // Reset trạng thái khi categoryId hoặc brandId thay đổi
  useEffect(() => {
    setMinPrice('');
    setMaxPrice('');
    setFilterMinPrice(0);
    setFilterMaxPrice(0);
    setRangeMaxPrice(0);
    setCurrentPage(1);
    setShowAllCategories(false);
    setShowAllBrands(false);
  }, [categoryId, brandId]);

  // Fetch dữ liệu sản phẩm
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = {};
        if (currentPage) params.page = currentPage;
        if (keyword) params.search = keyword;
        if (categoryId) params.category = categoryId;
        if (brandId) params.brand = brandId;
        if (filterMinPrice > 0) params.minPrice = filterMinPrice;
        if (filterMaxPrice > 0) params.maxPrice = filterMaxPrice;
        if (sortOption) params.sort = sortOption;

        console.log('Fetching with params:', params); // Debug

        // Thay thế localhost bằng API_URL
        const response = await axios.get(`${API_URL}/api/v1/listproduct`, { params });
        const productList = response.data.listProduct || [];
        const categoryList = response.data.categories || [];
        const brandList = response.data.brands || [];

        setProducts(productList);
        setCategory(categoryList);
        setBrand(brandList);
        setTotalPages(response.data.totalPages || 1);

        // Tính giá cao nhất từ danh sách sản phẩm
        const highestPrice = productList.reduce((max, product) => {
          const price = product.discount_price > 0 ? product.discount_price : product.price;
          return price > max ? price : max;
        }, 0);

        setRangeMaxPrice(highestPrice);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [categoryId, brandId, keyword, currentPage, filterMinPrice, filterMaxPrice, sortOption, API_URL]);

  // Xử lý áp dụng bộ lọc giá
  const handleApplyPrice = () => {
    const min = minPrice ? parseFloat(minPrice.replace(/[^0-9]/g, '')) : 0;
    const max = maxPrice ? parseFloat(maxPrice.replace(/[^0-9]/g, '')) : 0;

    if (isNaN(min) || isNaN(max)) {
      alert('Vui lòng nhập giá hợp lệ.');
      return;
    }

    if (min > max && max > 0) {
      alert('Giá tối thiểu không thể lớn hơn giá tối đa.');
      return;
    }

    setFilterMinPrice(min);
    setFilterMaxPrice(max);
    setCurrentPage(1);
  };

  // Xử lý thay đổi giá tối thiểu
  const handleMinPriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Chỉ cho phép số
    if (value) {
      setMinPrice(Number(value).toLocaleString('vi-VN')); // Format giá
    } else {
      setMinPrice('');
    }
  };

  // Xử lý thay đổi giá tối đa
  const handleMaxPriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Chỉ cho phép số
    if (value) {
      setMaxPrice(Number(value).toLocaleString('vi-VN')); // Format giá
    } else {
      setMaxPrice('');
    }
  };

  // Xử lý thay đổi tìm kiếm
  const handleSearchChange = (e) => {
    const value = e.target.value;
    searchParams.set('searchkeyword', value);
    setSearchParams(searchParams);
    setCurrentPage(1);
  };

  // Toggle ẩn/hiện tag filter ở mobile
  useEffect(() => {
    const toggles = document.querySelectorAll(`.${styles['dropdown-toggle']}`);
    const containers = document.querySelectorAll(`.${styles['tags-container']}`);
    const handleClick = (index) => () => {
      containers[index].classList.toggle('active');
    };
    toggles.forEach((toggle, index) => {
      toggle.addEventListener('click', handleClick(index));
    });
    return () => {
      toggles.forEach((toggle, index) => {
        toggle.removeEventListener('click', handleClick(index));
      });
    };
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Update URL with new page
      const params = new URLSearchParams(searchParams);
      params.set('page', page);
      setSearchParams(params);
    }
  };

  const handleSortChange = (e) => setSortOption(e.target.value);

  // Hàm xây dựng URL cho phân trang
  const buildPageUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    return `?${params.toString()}`;
  };

  // Pagination Logic
  const renderPagination = () => {
    const pages = [];

    // Always show the first page
    pages.push(1);

    // Add ellipsis if current page is greater than 4
    if (currentPage > 4) {
      pages.push('...');
    }

    // Calculate the range of nearby pages (2 pages before and after)
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    // Add nearby pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Add ellipsis if current page is far from the last page
    if (currentPage < totalPages - 3) {
      pages.push('...');
    }

    // Always show the last page if there are at least 2 pages
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className={`col-md-3 px-4 ${styles.sidebar_product}`}>
          <div className={`${styles.title} breadcrumb mb-3`}>
            TRANG CHỦ / <span className="text-success">LAPTOP</span>
          </div>

          {/* Tìm kiếm */}
          <div className="mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={keyword}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm"
              />
              <span className="input-group-text" style={{ backgroundColor: '#218282' }}>
                <i className="fas fa-search text-white"></i>
              </span>
            </div>
          </div>

          {/* Bộ lọc giá */}
          <div className="mb-4">
            <label className="form-label">Giá</label>
            <div className="row g-2">
              <div className="col-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Giá tối thiểu (đ)"
                  value={minPrice}
                  onChange={handleMinPriceChange}
                />
              </div>
              <div className="col-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Giá tối đa (đ)"
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                />
              </div>
            </div>
            <button
              className="btn btn-primary mt-2 w-100"
              style={{ backgroundColor: '#218282', borderColor: '#218282' }}
              onClick={handleApplyPrice}
            >
              Áp dụng
            </button>
            {rangeMaxPrice > 0 && (
              <div className="mt-2 text-muted">
                Giá tối đa: {Number(rangeMaxPrice).toLocaleString('vi-VN')} đ
              </div>
            )}
          </div>

          {/* Danh mục sản phẩm */}
          <div className={styles['filter-title']} style={{ color: '#218282' }}>
            DANH MỤC SẢN PHẨM
          </div>

          <div className={styles['filter-title']}>Danh mục sản phẩm</div>
          <div className={styles['product-tags']}>
            <div className={styles['dropdown-toggle']}>THẺ SẢN PHẨM</div>
            <div className={styles['tags-container']}>
              {category.length > 0 ? (
                (showAllCategories ? category : category.slice(0, 10)).map((cat) => (
                  <Link
                    key={cat.category_id}
                    to={`?categoryId=${cat.category_id}${brandId ? `&brandId=${brandId}` : ''}${
                      keyword ? `&searchkeyword=${keyword}` : ''
                    }`}
                    className={`${styles['tag']} ${
                      categoryId === String(cat.category_id) ? styles['tag-active'] : ''
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))
              ) : (
                <span className={styles['tag']}>Không có danh mục</span>
              )}
              {category.length > 10 && (
                <button
                  className={styles['toggle-btn']}
                  onClick={() => setShowAllCategories(!showAllCategories)}
                >
                  {showAllCategories ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </div>
          </div>

          {/* Nhãn hàng sản phẩm */}
          <div className={styles['filter-title']}>Nhãn hàng sản phẩm</div>
          <div className={styles['product-tags']}>
            <div className={styles['dropdown-toggle']}>THẺ SẢN PHẨM</div>
            <div className={styles['tags-container']}>
              {brand.length > 0 ? (
                (showAllBrands ? brand : brand.slice(0, 10)).map((brd) => (
                  <Link
                    key={brd.brand_id}
                    to={`?brandId=${brd.brand_id}${categoryId ? `&categoryId=${categoryId}` : ''}${
                      keyword ? `&searchkeyword=${keyword}` : ''
                    }`}
                    className={`${styles['tag']} ${
                      brandId === String(brd.brand_id) ? styles['tag-active'] : ''
                    }`}
                  >
                    {brd.name}
                  </Link>
                ))
              ) : (
                <span className={styles['tag']}>Không có nhãn hàng</span>
              )}
              {brand.length > 10 && (
                <button
                  className={styles['toggle-btn']}
                  onClick={() => setShowAllBrands(!showAllBrands)}
                >
                  {showAllBrands ? 'Thu gọn' : 'Xem thêm'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="col-md-9">
          <select
            className={`${styles['form-select']} ${styles['dropdown-sort']}`}
            style={{ width: '200px', color: '#218282' }}
            value={sortOption}
            onChange={handleSortChange}
          >
            <option value="default">Thứ tự mặc định</option>
            <option value="price_asc">Giá: Thấp đến cao</option>
            <option value="price_desc">Giá: Cao đến thấp</option>
          </select>

          <div className="row g-3 my-5">
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product) => (
                <div className="col-6 col-md-3" key={product.product_id}>
                  <Link to={`/detailproduct/${product.product_id}`} className={`${styles['product-link']}`}>
                    <div className={`${styles['product-card']} text-center`}>
                      <img
                        // Thay thế localhost bằng API_URL cho ảnh sản phẩm
                        src={`${API_URL}/images/products/${product.product_img}`}
                        className={`${styles['product-image']} img-fluid`}
                        alt={product.name}
                      />
                      <p className="mb-1 text-muted">{product.Category?.name}</p>
                      <p className="mb-1">{product.name}</p>
                      {product.discount_price > 0 ? (
                        <>
                          <div className={styles['old-price']}>
                            {Number(product.price).toLocaleString('vi-VN')}₫
                          </div>
                          <div className={styles['new-price']}>
                            {Number(product.discount_price).toLocaleString('vi-VN')}₫
                          </div>
                        </>
                      ) : (
                        <div className={styles['new-price']}>
                          {Number(product.price).toLocaleString('vi-VN')}₫
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <p>Không có sản phẩm nào để hiển thị.</p>
            )}
          </div>

          {/* Custom Smart Pagination with Links */}
          {totalPages > 1 && (
            <div className={styles['custom-pagination']}>
              {/* Previous Page Link */}
              <Link
                to={buildPageUrl(currentPage - 1)}
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

              {/* Pagination Pages */}
              {renderPagination().map((page, index) =>
                page === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={styles['custom-pagination-button']}
                    style={{ cursor: 'default', border: 'none' }}
                  >
                    ...
                  </span>
                ) : (
                  <Link
                    key={page}
                    to={buildPageUrl(page)}
                    className={`${styles['custom-pagination-button']} ${
                      currentPage === page ? styles['active'] : ''
                    }`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Link>
                )
              )}

              {/* Next Page Link */}
              <Link
                to={buildPageUrl(currentPage + 1)}
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

export default ProductList;