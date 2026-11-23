import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../css/listproduct/listproduct.module.css';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('searchkeyword') || '';
  const [products, setProducts] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState(0);
  const [filterMaxPrice, setFilterMaxPrice] = useState(0);
  const [rangeMaxPrice, setRangeMaxPrice] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState('default');
  const [category, setCategory] = useState([]);
  const [brand, setBrand] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  
  const [loading, setLoading] = useState(false); 

  // STATE: Quản lý Ô Nhảy Cóc Trang (Page Jump Input)
  const [isJumping, setIsJumping] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');

  // STATE: Toggle Sidebar bộ lọc trên Mobile
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isBrandOpen, setIsBrandOpen] = useState(true);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const categoryId = searchParams.get('categoryId');
  const brandId = searchParams.get('brandId');

  // Cuộn mượt lên đầu trang khi đổi trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // HÀM HELPER: Xử lý URL cho Danh mục
  const buildCategoryUrl = (catId) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId === String(catId)) {
      params.delete('categoryId');
    } else {
      params.set('categoryId', catId);
    }
    params.set('page', 1);
    return `?${params.toString()}`;
  };

  // HÀM HELPER: Xử lý URL cho Nhãn hàng
  const buildBrandUrl = (brdId) => {
    const params = new URLSearchParams(searchParams);
    if (brandId === String(brdId)) {
      params.delete('brandId'); 
    } else {
      params.set('brandId', brdId); 
    }
    params.set('page', 1);
    return `?${params.toString()}`;
  };

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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {};
        if (currentPage) params.page = currentPage;
        if (keyword) params.search = keyword;
        if (categoryId) params.category = categoryId;
        if (brandId) params.brand = brandId;
        if (filterMinPrice > 0) params.minPrice = filterMinPrice;
        if (filterMaxPrice > 0) params.maxPrice = filterMaxPrice;
        if (sortOption) params.sort = sortOption;

        const response = await axios.get(`${API_URL}/api/v1/listproduct`, { params });
        const productList = response.data.listProduct || [];
        const categoryList = response.data.categories || [];
        const brandList = response.data.brands || [];

        setProducts(productList);
        setCategory(categoryList);
        setBrand(brandList);
        setTotalPages(response.data.totalPages || 1);

        const highestPrice = productList.reduce((max, product) => {
          const price = product.discount_price > 0 ? product.discount_price : product.price;
          return price > max ? price : max;
        }, 0);

        setRangeMaxPrice(highestPrice);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, brandId, keyword, currentPage, filterMinPrice, filterMaxPrice, sortOption, API_URL]);

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

  const handleMinPriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setMinPrice(value ? Number(value).toLocaleString('vi-VN') : '');
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setMaxPrice(value ? Number(value).toLocaleString('vi-VN') : '');
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    searchParams.set('searchkeyword', value);
    setSearchParams(searchParams);
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setSearchParams({});
    setMinPrice('');
    setMaxPrice('');
    setFilterMinPrice(0);
    setFilterMaxPrice(0);
    setCurrentPage(1);
    setSortOption('default');
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const params = new URLSearchParams(searchParams);
      params.set('page', page);
      setSearchParams(params);
    }
  };

  // HÀM XỬ LÝ NHẢY CÓC TRANG KHI NHẬP Ô BẤM ENTER HOẶC BLUR
  const handleJumpPageSubmit = () => {
    if (!jumpPageInput) {
      setIsJumping(false);
      return;
    }

    let targetPage = parseInt(jumpPageInput, 10);
    if (isNaN(targetPage)) {
      setIsJumping(false);
      setJumpPageInput('');
      return;
    }

    // Kiểm tra & xử lý nếu vượt số trang
    if (targetPage < 1) {
      targetPage = 1;
    } else if (targetPage > totalPages) {
      targetPage = totalPages;
    }

    handlePageChange(targetPage);
    setIsJumping(false);
    setJumpPageInput('');
  };

  const handleSortChange = (e) => setSortOption(e.target.value);

  const buildPageUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    return `?${params.toString()}`;
  };

  const renderPagination = () => {
    const pages = [];
    pages.push(1);
    if (currentPage > 4) {
      pages.push('...');
    }
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    for (let i = startPage; i <= endPage; i++) {
      if (i > 1 && i < totalPages) pages.push(i);
    }
    if (currentPage < totalPages - 3) {
      pages.push('...');
    }
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    return [...new Set(pages)];
  };

  const hasActiveFilters = Boolean(
    keyword || categoryId || brandId || filterMinPrice > 0 || filterMaxPrice > 0
  );

  const activeCategoryObj = category.find(c => String(c.category_id) === String(categoryId));
  const activeBrandObj = brand.find(b => String(b.brand_id) === String(brandId));

  return (
    <div className="container-fluid py-3 px-lg-4">
      {/* Breadcrumb */}
      <div className={`${styles.breadcrumbNav} mb-3`}>
        <Link to="/" className={styles.breadcrumbLink}>TRANG CHỦ</Link>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbActive}>SẢN PHẨM</span>
      </div>

      {/* Nút bật/tắt bộ lọc trên di động */}
      <div className="d-md-none mb-3">
        <button 
          className={styles.mobileFilterToggleBtn}
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <i className="fas fa-filter me-2"></i>
          {isMobileSidebarOpen ? 'Ẩn bộ lọc sản phẩm' : 'Bộ lọc & Tìm kiếm'}
        </button>
      </div>

      <div className="row g-4">
        {/* Sidebar Bộ lọc (Đã tối ưu layout cho col-md-4 col-lg-3 trên iPad Mini) */}
        <div className={`col-md-4 col-lg-3 ${styles.sidebar_product} ${isMobileSidebarOpen ? styles.mobileSidebarOpen : ''}`}>
          <div className={styles.filterCardContainer}>
            
            {/* Header Sidebar */}
            <div className={styles.sidebarHeader}>
              <h5 className={styles.sidebarTitle}>
                <i className="fas fa-sliders-h me-2"></i>Bộ lọc tìm kiếm
              </h5>
              {hasActiveFilters && (
                <button className={styles.resetFilterBtn} onClick={handleClearAllFilters}>
                  Xóa lọc
                </button>
              )}
            </div>

            {/* Ô tìm kiếm */}
            <div className="mb-4">
              <label className={styles.filterLabel}>Từ khóa</label>
              <div className={styles.searchBoxWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={keyword}
                  onChange={handleSearchChange}
                  placeholder="Nhập tên sản phẩm..."
                />
                <button className={styles.searchBtn} aria-label="Tìm kiếm">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>

            {/* Khung lọc theo giá */}
            <div className="mb-4">
              <label className={styles.filterLabel}>Khoảng giá (đ)</label>
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <input
                    type="text"
                    className={styles.priceInput}
                    placeholder="Từ"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                  />
                </div>
                <div className="col-6">
                  <input
                    type="text"
                    className={styles.priceInput}
                    placeholder="Đến"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                  />
                </div>
              </div>
              <button className={styles.applyPriceBtn} onClick={handleApplyPrice}>
                Áp dụng giá
              </button>
              {rangeMaxPrice > 0 && (
                <div className={styles.maxPriceHint}>
                  <i className="fas fa-info-circle me-1"></i>
                  Cao nhất: {Number(rangeMaxPrice).toLocaleString('vi-VN')}đ
                </div>
              )}
            </div>

            {/* Danh mục sản phẩm */}
            <div className={styles.filterSection}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
              >
                <span>DANH MỤC</span>
                <i className={`fas fa-chevron-${isCategoryOpen ? 'up' : 'down'}`}></i>
              </div>

              {isCategoryOpen && (
                <div className={styles.tagsContainer}>
                  {category.length > 0 ? (
                    (showAllCategories ? category : category.slice(0, 8)).map((cat, index) => {
                      const isActive = categoryId === String(cat.category_id);
                      return (
                        <Link
                          key={`${cat.category_id}-${index}`}
                          to={buildCategoryUrl(cat.category_id)}
                          className={`${styles.tag} ${isActive ? styles.tagActive : ''}`}
                        >
                          {isActive && <i className="fas fa-check me-1"></i>}
                          {cat.name}
                        </Link>
                      );
                    })
                  ) : (
                    <span className={styles.emptyTagText}>Không có danh mục</span>
                  )}

                  {category.length > 8 && (
                    <button
                      className={styles.toggleMoreBtn}
                      onClick={() => setShowAllCategories(!showAllCategories)}
                    >
                      {showAllCategories ? 'Thu gọn ▲' : `Xem thêm (${category.length - 8}) ▼`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Nhãn hàng sản phẩm */}
            <div className={styles.filterSection}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setIsBrandOpen(!isBrandOpen)}
              >
                <span>THƯƠNG HIỆU</span>
                <i className={`fas fa-chevron-${isBrandOpen ? 'up' : 'down'}`}></i>
              </div>

              {isBrandOpen && (
                <div className={styles.tagsContainer}>
                  {brand.length > 0 ? (
                    (showAllBrands ? brand : brand.slice(0, 8)).map((brd, index) => {
                      const isActive = brandId === String(brd.brand_id);
                      return (
                        <Link
                          key={`${brd.brand_id}-${index}`}
                          to={buildBrandUrl(brd.brand_id)}
                          className={`${styles.tag} ${isActive ? styles.tagActive : ''}`}
                        >
                          {isActive && <i className="fas fa-check me-1"></i>}
                          {brd.name}
                        </Link>
                      );
                    })
                  ) : (
                    <span className={styles.emptyTagText}>Không có nhãn hàng</span>
                  )}

                  {brand.length > 8 && (
                    <button
                      className={styles.toggleMoreBtn}
                      onClick={() => setShowAllBrands(!showAllBrands)}
                    >
                      {showAllBrands ? 'Thu gọn ▲' : `Xem thêm (${brand.length - 8}) ▼`}
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Cột hiển thị Danh sách sản phẩm (col-md-8 col-lg-9) */}
        <div className="col-md-8 col-lg-9 d-flex flex-column" style={{ minHeight: '80vh' }}>
          
          {/* Top Bar: Số lượng sản phẩm & Sắp xếp */}
          <div className={styles.topControlBar}>
            <div className={styles.resultCounter}>
              {loading ? (
                <span>Đang tìm kiếm...</span>
              ) : (
                <span>Tìm thấy <strong>{products.length}</strong> sản phẩm</span>
              )}
            </div>

            <div className={styles.sortWrapper}>
              <span className={styles.sortLabel}>Sắp xếp:</span>
              <select
                className={styles.dropdownSort}
                value={sortOption}
                onChange={handleSortChange}
              >
                <option value="default">Mặc định (Mới nhất)</option>
                <option value="price_asc">Giá: Thấp đến cao</option>
                <option value="price_desc">Giá: Cao đến thấp</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className={styles.activeFiltersBar}>
              <span className={styles.activeFilterTitle}>Đã chọn:</span>
              {keyword && (
                <span className={styles.filterChip}>
                  Từ khóa: "{keyword}"
                </span>
              )}
              {activeCategoryObj && (
                <Link to={buildCategoryUrl(activeCategoryObj.category_id)} className={styles.filterChip}>
                  Danh mục: {activeCategoryObj.name} <i className="fas fa-times ms-1"></i>
                </Link>
              )}
              {activeBrandObj && (
                <Link to={buildBrandUrl(activeBrandObj.brand_id)} className={styles.filterChip}>
                  Hãng: {activeBrandObj.name} <i className="fas fa-times ms-1"></i>
                </Link>
              )}
              {(filterMinPrice > 0 || filterMaxPrice > 0) && (
                <span className={styles.filterChip}>
                  Giá: {filterMinPrice ? `${filterMinPrice.toLocaleString('vi-VN')}đ` : '0đ'} - {filterMaxPrice ? `${filterMaxPrice.toLocaleString('vi-VN')}đ` : 'Tối đa'}
                </span>
              )}
              <button className={styles.clearChipBtn} onClick={handleClearAllFilters}>
                Bỏ tất cả
              </button>
            </div>
          )}

          {/* Grid hiển thị sản phẩm */}
          <div className="flex-grow-1">
            {loading ? (
              <div className={styles['loading-container']}>
                <div className={styles.spinner}></div>
                <span>Đang tải danh sách sản phẩm...</span>
              </div>
            ) : (
              <div className="row g-3 mb-4">
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((product, index) => {
                    const hasDiscount = product.discount_price > 0 && product.price > product.discount_price;
                    const discountPercent = hasDiscount 
                      ? Math.round(((product.price - product.discount_price) / product.price) * 100) 
                      : 0;

                    return (
                      <div className="col-6 col-md-6 col-lg-3" key={`${product.product_id}-${index}`}>
                        <Link to={`/detailproduct/${product.product_id}`} className={styles['product-link']}>
                          <div className={styles['product-card']}>
                            
                            {hasDiscount && (
                              <div className={styles.discountBadge}>
                                -{discountPercent}%
                              </div>
                            )}

                            <div className={styles['product-img-wrapper']}>
                              <img
                                src={`${API_URL}/images/products/${product.product_img}`}
                                className={styles['product-image']}
                                alt={product.name}
                                loading="lazy"
                              />
                            </div>
                            
                            <div className={styles['product-info']}>
                              <p className={styles['product-category']}>{product.Category?.name || 'Điện tử'}</p>
                              <h6 className={styles['product-name']} title={product.name}>{product.name}</h6>
                            </div>

                            <div className={styles['product-price-wrapper']}>
                              {hasDiscount ? (
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
                          </div>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.emptyProductState}>
                    <i className="fas fa-box-open"></i>
                    <h5>Không tìm thấy sản phẩm nào</h5>
                    <p>Hãy thử thay đổi từ khóa hoặc xóa bớt bộ lọc để tìm kiếm lại.</p>
                    <button className={styles.applyPriceBtn} onClick={handleClearAllFilters}>
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Phân trang Smart Pagination với tính năng Nhảy Cóc Trang */}
          {totalPages > 1 && !loading && (
            <div className={styles['custom-pagination']}>
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
                <i className="fas fa-chevron-left"></i>
              </Link>

              {renderPagination().map((page, index) =>
                page === '...' ? (
                  isJumping ? (
                    <input
                      key={`jump-input-${index}`}
                      type="number"
                      min="1"
                      max={totalPages}
                      className={styles.jumpInput}
                      placeholder="Trang"
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleJumpPageSubmit();
                        if (e.key === 'Escape') {
                          setIsJumping(false);
                          setJumpPageInput('');
                        }
                      }}
                      onBlur={handleJumpPageSubmit}
                      autoFocus
                    />
                  ) : (
                    <span
                      key={`ellipsis-${index}`}
                      className={`${styles['custom-pagination-button']} ${styles.ellipsisButton}`}
                      onClick={() => setIsJumping(true)}
                      title="Click để nhập số trang nhảy cóc"
                    >
                      ...
                    </span>
                  )
                ) : (
                  <Link
                    key={`page-${page}`}
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
                <i className="fas fa-chevron-right"></i>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;