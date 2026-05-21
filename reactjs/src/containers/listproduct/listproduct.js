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

  // STATE: Quản lý Đóng/Mở thẻ sản phẩm trên Mobile
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isBrandOpen, setIsBrandOpen] = useState(false);

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const categoryId = searchParams.get('categoryId');
  const brandId = searchParams.get('brandId');

  // HIỆU ỨNG CUỘN LÊN ĐẦU TRANG KHI ĐỔI TRANG
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // HÀM HELPER: Xử lý URL cho Danh mục (Ấn 1 lần chọn, ấn lại bỏ chọn)
  const buildCategoryUrl = (catId) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId === String(catId)) {
      params.delete('categoryId'); // Đã chọn rồi -> Ấn lại là Bỏ chọn
    } else {
      params.set('categoryId', catId); // Chưa chọn -> Chọn mới
    }
    params.set('page', 1); // Đổi bộ lọc thì quay về trang 1
    return `?${params.toString()}`;
  };

  // HÀM HELPER: Xử lý URL cho Nhãn hàng (Ấn 1 lần chọn, ấn lại bỏ chọn)
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
    if (value) {
      setMinPrice(Number(value).toLocaleString('vi-VN'));
    } else {
      setMinPrice('');
    }
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      setMaxPrice(Number(value).toLocaleString('vi-VN'));
    } else {
      setMaxPrice('');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    searchParams.set('searchkeyword', value);
    setSearchParams(searchParams);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      const params = new URLSearchParams(searchParams);
      params.set('page', page);
      setSearchParams(params);
    }
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

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        {/* Sidebar */}
        <div className={`col-md-3 px-4 ${styles.sidebar_product}`}>
          <div className={`${styles.title} breadcrumb mb-3`}>
            TRANG CHỦ / <span className="text-success">SẢN PHẨM</span>
          </div>

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
          <div className={styles['product-tags']}>
            <div 
              className={styles['dropdown-toggle']}
              onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            >
              <span>THẺ SẢN PHẨM</span>
              <i className={`fas fa-chevron-${isCategoryOpen ? 'up' : 'down'}`}></i>
            </div>
            <div className={`${styles['tags-container']} ${isCategoryOpen ? styles['mobile-open'] : ''}`}>
              {category.length > 0 ? (
                (showAllCategories ? category : category.slice(0, 10)).map((cat, index) => (
                  <Link
                    key={`${cat.category_id}-${index}`}
                    to={buildCategoryUrl(cat.category_id)}
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
          <div className={styles['filter-title']} style={{ marginTop: '20px', color: '#218282' }}>
            NHÃN HÀNG SẢN PHẨM
          </div>
          <div className={styles['product-tags']}>
            <div 
              className={styles['dropdown-toggle']}
              onClick={() => setIsBrandOpen(!isBrandOpen)}
            >
              <span>THẺ SẢN PHẨM</span>
              <i className={`fas fa-chevron-${isBrandOpen ? 'up' : 'down'}`}></i>
            </div>
            <div className={`${styles['tags-container']} ${isBrandOpen ? styles['mobile-open'] : ''}`}>
              {brand.length > 0 ? (
                (showAllBrands ? brand : brand.slice(0, 10)).map((brd, index) => (
                  <Link
                    key={`${brd.brand_id}-${index}`}
                    to={buildBrandUrl(brd.brand_id)}
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
        <div className="col-md-9 d-flex flex-column" style={{ minHeight: '80vh' }}>
          
          <div className="d-flex justify-content-end mb-3">
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
          </div>

          <div className="flex-grow-1">
            {loading ? (
              <div className={styles['loading-container']}>
                <div className={styles.spinner}></div>
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className="row g-3 mb-4">
                {Array.isArray(products) && products.length > 0 ? (
                  products.map((product, index) => (
                    <div className="col-6 col-md-3" key={`${product.product_id}-${index}`}>
                      <Link to={`/detailproduct/${product.product_id}`} className={`${styles['product-link']}`}>
                        
                        {/* BỌC LẠI KHUNG CARD ĐỂ CHỐNG TRÀN CHỮ */}
                        <div className={styles['product-card']}>
                          <div className={styles['product-img-wrapper']}>
                            <img
                              src={`${API_URL}/images/products/${product.product_img}`}
                              className={styles['product-image']}
                              alt={product.name}
                            />
                          </div>
                          
                          <div className={styles['product-info']}>
                            <p className={styles['product-category']}>{product.Category?.name}</p>
                            <p className={styles['product-name']}>{product.name}</p>
                          </div>

                          <div className={styles['product-price-wrapper']}>
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
                        </div>

                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-center w-100 mt-5">Không có sản phẩm nào để hiển thị.</p>
                )}
              </div>
            )}
          </div>

          {/* Custom Smart Pagination */}
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
                &lt;
              </Link>

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