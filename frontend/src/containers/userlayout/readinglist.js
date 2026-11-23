import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../css/detailuser/readinglist.module.css';
import { Context } from '../login/context';

const ReadingList = () => {
  const [readingList, setReadingList] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const { user } = useContext(Context);
  const navigate = useNavigate();

  // Lấy URL trực tiếp từ biến môi trường .env
  const API_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (!user || !user.auth) {
      navigate('/login');
      return;
    }

    const existingReadingList = JSON.parse(localStorage.getItem('readingList')) || [];
    setReadingList(existingReadingList);
  }, [user, navigate]);

  const showTemporaryNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);
  };

  const handleRemoveFromReadingList = (news_id) => {
    const updatedReadingList = readingList.filter((item) => item.news_id !== news_id);
    localStorage.setItem('readingList', JSON.stringify(updatedReadingList));
    setReadingList(updatedReadingList);
    showTemporaryNotification('Đã xóa tin tức khỏi danh sách đọc!');
  };

  if (!readingList.length) {
    return (
      <div className={styles['readinglist-container']}>
        <h2 className={styles['readinglist-title']}>Danh Sách Đọc</h2>
        <p className={styles['readinglist-empty']}>
          Danh sách đọc của bạn đang trống. Hãy thêm tin tức để theo dõi!
        </p>
      </div>
    );
  }

  return (
    <div className={styles['readinglist-container']}>
      <h2 className={styles['readinglist-title']}>Danh Sách Đọc</h2>
      <div className={styles['readinglist-grid']}>
        {readingList.map((item) => (
          <div key={item.news_id} className={styles['readinglist-item']}>
            <Link to={`/detailnews/${item.news_id}`}>
              <img
                /* Thay thế localhost bằng API_URL cho đường dẫn ảnh tin tức */
                src={`${API_URL}/images/news/${item.image}`}
                alt={item.title}
                className={styles['readinglist-item-img']}
              />
            </Link>
            <div className={styles['readinglist-item-info']}>
              <h3 className={styles['readinglist-item-title']}>
                <Link to={`/detailnews/${item.news_id}`}>{item.title}</Link>
              </h3>
              <p className={styles['readinglist-item-summary']}>{item.summary}</p>
              <div className={styles['readinglist-item-actions']}>
                <button
                  className={styles['button-remove']}
                  onClick={() => handleRemoveFromReadingList(item.news_id)}
                >
                  <i className="fa-solid fa-trash"></i> Xóa
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notification.show && (
        <div className={styles['notification']}>
          <div className={styles['notification-content']}>
            <i className="fa-solid fa-check-circle"></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingList;