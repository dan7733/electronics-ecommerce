import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import debounce from 'lodash.debounce';
import styles from '../css/listnews/listnews.module.css';

const ListNews = () => {
  const [news, setNews] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Sử dụng trực tiếp biến môi trường từ .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      // Thay thế localhost bằng API_URL
      const response = await axios.get(`${API_URL}/api/v1/listnews`, {
        params: { page, search, sort }
      });
      if (response.data.errCode === 0) {
        setNews(response.data.products.rows);
        setTotalPages(response.data.products.totalPages);
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

  // Debounce hàm setSearch
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
      setPage(1); // Reset về trang 1 khi tìm kiếm
    }, 500),
    [] 
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value);
  };

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1); // Reset về trang 1 khi đổi sắp xếp
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
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

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className={styles['listnews-container']}>
      <div className={styles['filter-bar']}>
        <div className={styles['search-wrapper']}>
          <i className={`fas fa-search ${styles['search-icon']}`}></i>
          <input
            type="text"
            placeholder="Tìm kiếm tin tức..."
            onChange={handleSearchChange}
            className={styles['search-input']}
          />
        </div>
        <div className={styles['sort-wrapper']}>
          <i className={`fas fa-sort ${styles['sort-icon']}`}></i>
          <select value={sort} onChange={handleSortChange} className={styles['sort-select']}>
            <option value="default">Mặc định</option>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>
      {loading ? (
        <p className={styles['loading']}>Đang tải...</p>
      ) : (
        <div className={styles['news-list']}>
          {news.length > 0 ? (
            news.map((newsItem) => (
              <Link
                to={`/detailnews/${newsItem.news_id}`}
                key={newsItem.news_id}
                className={styles['news-card']}
              >
                <img
                  // Thay thế localhost bằng API_URL cho ảnh tin tức
                  src={`${API_URL}/images/news/${newsItem.image}`}
                  alt={newsItem.title}
                  className={styles['news-image']}
                />
                <div className={styles['news-content']}>
                  <h5>
                    <i className={`fas fa-newspaper ${styles['news-icon']}`}></i>
                    {newsItem.title}
                  </h5>
                  <p>{newsItem.summary}</p>
                </div>
              </Link>
            ))
          ) : (
            <p className={styles['no-results']}>Không tìm thấy tin tức.</p>
          )}
        </div>
      )}
      {totalPages > 1 && (
        <div className={styles['custom-pagination']}>
          <Link
            to={`?page=${page - 1}`}
            className={`${styles['custom-pagination-button']} ${styles['arrow']} ${
              page === 1 ? styles['disabled'] : ''
            }`}
            onClick={(e) => {
              if (page === 1) e.preventDefault();
              else handlePageChange(page - 1);
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
                  page === pageItem ? styles['active'] : ''
                }`}
                onClick={() => handlePageChange(pageItem)}
              >
                {pageItem}
              </Link>
            )
          )}

          <Link
            to={`?page=${page + 1}`}
            className={`${styles['custom-pagination-button']} ${styles['arrow']} ${
              page === totalPages ? styles['disabled'] : ''
            }`}
            onClick={(e) => {
              if (page === totalPages) e.preventDefault();
              else handlePageChange(page + 1);
            }}
          >
            <i className={`fas fa-chevron-right ${styles['page-icon']}`}></i>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ListNews;