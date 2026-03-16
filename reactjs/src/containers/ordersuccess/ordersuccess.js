import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../css/ordersuccess/ordersuccess.module.css';
import confetti from 'canvas-confetti';

const OrderSuccess = () => {
  useEffect(() => {
    const duration = 5000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <div className={styles.successSection}>
      <i className={`fa-solid fa-circle-check ${styles.successIcon}`}></i>
      <div className={styles.successTitle}>Đặt hàng thành công!</div>
      <div className={styles.successMessage}>
        Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi. Đơn hàng của bạn đang được xử lý và sẽ sớm được giao!
      </div>

      <Link to="/" className={styles.btnCustom}>
        <i className="fa-solid fa-house"></i> Quay lại trang chủ
      </Link>
    </div>
  );
};

export default OrderSuccess;
