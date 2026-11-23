import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce';
import styles from '../css/listnews/listnews.module.css';

const ListNews = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const pageFromUrl = parseInt(searchParams.get('page') || '1', 10);

  const [news, setNews] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(pageFromUrl);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [isJumping, setIsJumping] = useState(false);
  const [jumpPageInput, setJumpPageInput] = useState('');

  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const p = parseInt(searchParams.get('page') || '1', 10);
    setPage(p);
  }, [searchParams]);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/listnews`, {
        params: { page, search, sort },
      });
      if (response.data.errCode === 0) {
        const rows =
          response.data.products?.rows ||
          response.data.news?.rows ||
          response.data.rows ||
          [];
        const total =
          response.data.products?.totalPages ||
          response.data.totalPages ||
          1;

        setNews(rows);
        setTotalPages(total);
      } else {
        console.error('API error:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
    setLoading(false);
  }, [page, search, sort, API_URL]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
      handlePageChange(1);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    handlePageChange(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage);
      setSearchParams(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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

    if (targetPage < 1) targetPage = 1;
    if (targetPage > totalPages) targetPage = totalPages;

    handlePageChange(targetPage);
    setIsJumping(false);
    setJumpPageInput('');
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
      if (page <= halfMaxPages) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (page + halfMaxPages >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = page - halfMaxPages;
        endPage = page + halfMaxPages;
      }
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const buildPageUrl = (targetPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', targetPage);
    return `/newslist?${params.toString()}`; // Đã đổi sang /newslist
  };

  return (
    <div className={styles['listnews-container']}>
      <div className={styles['header-section']}>
        <h4 className={styles['page-title']}>
          <i className="fas fa-newspaper me-2"></i>Tin Tức & Bài Viết
        </h4>
        <p className={styles['page-subtitle']}>
          Cập nhật những thông tin, xu hướng công nghệ và sản phẩm mới nhất
        </p>
      </div>

      <div className={styles['filter-bar']}>
        <div className={styles['search-wrapper']}>
          <i className={`fas fa-search ${styles['search-icon']}`}></i>
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            onChange={handleSearchChange}
            className={styles['search-input']}
          />
        </div>
        <div className={styles['sort-wrapper']}>
          <i className={`fas fa-sort-amount-down ${styles['sort-icon']}`}></i>
          <select value={sort} onChange={handleSortChange} className={styles['sort-select']}>
            <option value="default">Sắp xếp: Mặc định</option>
            <option value="newest">Bài viết mới nhất</option>
            <option value="oldest">Bài viết cũ nhất</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles['loading-container']}>
          <div className={styles.spinner}></div>
          <span>Đang tải bài viết...</span>
        </div>
      ) : (
        <div className={styles['news-list']}>
          {news.length > 0 ? (
            news.map((newsItem, index) => {
              const newsId = newsItem.news_id || newsItem.id;
              
              return (
                <Link
                  to={`/detailnews/${newsId}`}
                  state={{ fromPage: page }}
                  key={newsId || index}
                  className={styles['news-card']}
                >
                  <div className={styles['news-image-wrapper']}>
                    <img
                      src={`${API_URL}/images/news/${newsItem.image}`}
                      alt={newsItem.title || 'Tin tức'}
                      className={styles['news-image']}
                      loading="lazy"
                    />
                    <span className={styles['news-badge']}>Tin tức</span>
                  </div>
                  <div className={styles['news-content']}>
                    <div className={styles['news-meta']}>
                      <span>
                        <i className="far fa-calendar-alt me-1"></i>
                        {formatDate(newsItem.created_at || newsItem.updated_at) || 'Tin mới'}
                      </span>
                    </div>
                    <h5 className={styles['news-title']}>{newsItem.title}</h5>
                    <p className={styles['news-summary']}>{newsItem.summary}</p>
                    <div className={styles['read-more-link']}>
                      Đọc tiếp <i className="fas fa-arrow-right ms-1"></i>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className={styles['empty-state']}>
              <i className="fas fa-newspaper-o"></i>
              <p className={styles['no-results']}>Không tìm thấy bài viết tin tức nào.</p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && !loading && (
        <div className={styles['custom-pagination']}>
          <Link
            to={buildPageUrl(page - 1)}
            className={`${styles['custom-pagination-button']} ${styles['arrow']} ${
              page === 1 ? styles['disabled'] : ''
            }`}
            onClick={(e) => {
              if (page === 1) e.preventDefault();
              else handlePageChange(page - 1);
            }}
          >
            <i className="fas fa-chevron-left"></i>
          </Link>

          {renderPagination().map((pageItem, index) =>
            pageItem === '...' ? (
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
                key={pageItem}
                to={buildPageUrl(pageItem)}
                className={`${styles['custom-pagination-button']} ${
                  page === pageItem ? styles['active'] : ''
                }`}
                onClick={() => handlePageChange(pageItem)}
              >
                {pageItem}
              </Link>
            )
          )}

          <Link
            to={buildPageUrl(page + 1)}
            className={`${styles['custom-pagination-button']} ${styles['arrow']} ${
              page === totalPages ? styles['disabled'] : ''
            }`}
            onClick={(e) => {
              if (page === totalPages) e.preventDefault();
              else handlePageChange(page + 1);
            }}
          >
            <i className="fas fa-chevron-right"></i>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ListNews;