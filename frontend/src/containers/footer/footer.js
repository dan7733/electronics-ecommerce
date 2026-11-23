// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../css/footer/footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footerBg}>
      <div className="container py-5">
        <div className="row g-4 text-start">

          {/* Cột 1: Kết nối với EShop / Tổng đài miễn phí */}
          <div className={`col-12 col-sm-6 col-md-3 ${styles.footerColumn}`}>
            <h6 className={styles.footerTitle}>KẾT NỐI VỚI ESHOP</h6>
            
            <div className={styles.hotlineSection}>
              <p className={styles.subTitle}>TỔNG ĐÀI MIỄN PHÍ</p>
              <ul className={`list-unstyled ${styles.hotlineList}`}>
                <li>
                  <i className="bi bi-telephone-outbound me-2 text-white"></i>
                  <div>
                    <span>Tư vấn mua hàng:</span>
                    <a href="tel:0123456789" className={styles.hotlineNumber}>0123456789</a>
                    <small className={styles.timeText}>(8h00 - 22h00)</small>
                  </div>
                </li>
                <li>
                  <i className="bi bi-shield-check me-2 text-white"></i>
                  <div>
                    <span>Bảo hành:</span>
                    <a href="tel:0987654321" className={styles.hotlineNumber}>0987654321</a>
                    <small className={styles.timeText}>(8h00 - 22h00)</small>
                  </div>
                </li>
                <li>
                  <i className="bi bi-headset me-2 text-white"></i>
                  <div>
                    <span>Hỗ trợ kỹ thuật:</span>
                    <a href="tel:0456123789" className={styles.hotlineNumber}>0456123789</a>
                    <small className={styles.timeText}>(8h00 - 22h00)</small>
                  </div>
                </li>
              </ul>
              
              <div className="mt-3">
                <a href="tel:0123456789" className={styles.expertBtn}>
                  <i className="bi bi-chat-dots-fill me-2"></i>Gặp chuyên gia ngay!
                </a>
              </div>
            </div>
          </div>

          {/* Cột 2: Về chúng tôi */}
          <div className={`col-12 col-sm-6 col-md-3 ${styles.footerColumn}`}>
            <h6 className={styles.footerTitle}>VỀ CHÚNG TÔI</h6>
            <ul className={`list-unstyled ${styles.footerNav}`}>
              <li><Link to="/aboutus" className={styles.footerLink}>Giới thiệu về công ty</Link></li>
              <li><Link to="/" className={styles.footerLink}>Quy chế hoạt động</Link></li>
              <li><Link to="/" className={styles.footerLink}>Tìm kiếm khuyến mãi</Link></li>
              <li><Link to="/" className={styles.footerLink}>Giới thiệu mua đổi trả</Link></li>
              <li><Link to="/" className={styles.footerLink}>Hướng dẫn mua hàng</Link></li>
              <li><Link to="/" className={styles.footerLink}>Hướng dẫn thanh toán online</Link></li>
              <li><Link to="/" className={styles.footerLink}>Tra cứu hóa đơn điện tử</Link></li>
              <li><Link to="/" className={styles.footerLink}>Tra cứu bảo hành</Link></li>
            </ul>
          </div>

          {/* Cột 3: Chính sách */}
          <div className={`col-12 col-sm-6 col-md-3 ${styles.footerColumn}`}>
            <h6 className={styles.footerTitle}>CHÍNH SÁCH</h6>
            <ul className={`list-unstyled ${styles.footerNav}`}>
              <li><Link to="/" className={styles.footerLink}>Chính sách bảo hành</Link></li>
              <li><Link to="/" className={styles.footerLink}>Chính sách đổi trả</Link></li>
              <li><Link to="/" className={styles.footerLink}>Chính sách bảo mật</Link></li>
              <li><Link to="/" className={styles.footerLink}>Chính sách trả góp</Link></li>
              <li><Link to="/" className={styles.footerLink}>Chính sách khui hộp sản phẩm</Link></li>
              <li><Link to="/" className={styles.footerLink}>Chính sách giao hàng</Link></li>
              <li><Link to="/" className={styles.footerLink}>Chính sách lắp đặt</Link></li>
              <li><Link to="/" className={styles.footerLink}>Chính sách thu thập dữ liệu</Link></li>
            </ul>
          </div>

          {/* Cột 4: Email liên hệ */}
          <div className={`col-12 col-sm-6 col-md-3 ${styles.footerColumn}`}>
            <h6 className={styles.footerTitle}>EMAIL LIÊN HỆ</h6>
            <div className={styles.emailContainer}>
              <div className={styles.emailCard}>
                <i className="bi bi-envelope-paper text-white fs-5"></i>
                <div>
                  <span className={styles.emailLabel}>Hỗ trợ khách hàng</span>
                  <a href="mailto:cskh@eshop.vn" className={styles.emailLink}>cskh@eshop.vn</a>
                </div>
              </div>

              <div className={styles.emailCard}>
                <i className="bi bi-file-earmark-text text-white fs-5"></i>
                <div>
                  <span className={styles.emailLabel}>Liên hệ báo giá</span>
                  <a href="mailto:baogia@eshop.vn" className={styles.emailLink}>baogia@eshop.vn</a>
                </div>
              </div>

              <div className={styles.emailCard}>
                <i className="bi bi-handbag text-white fs-5"></i>
                <div>
                  <span className={styles.emailLabel}>Hợp tác phát triển</span>
                  <a href="mailto:hoptac@eshop.vn" className={styles.emailLink}>hoptac@eshop.vn</a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Thanh Copyright dưới chân trang */}
      <div className={styles.copyrightBar}>
        <div className="container py-3 d-flex flex-column flex-sm-row justify-content-between align-items-center text-center gap-2">
          <p className="mb-0 small opacity-75">
            © {new Date().getFullYear()} ESHOP Electronics. Tất cả các quyền được bảo lưu.
          </p>
          <div className="d-flex gap-3 fs-5 opacity-75">
            <i className="bi bi-credit-card-2-front" title="Thanh toán Thẻ"></i>
            <i className="bi bi-qr-code-scan" title="Thanh toán QR-Code"></i>
            <i className="bi bi-wallet2" title="Ví điện tử"></i>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;