// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../css/footer/footer.module.css';

const Footer = () => {
  return (
    <footer className={`text-white ${styles.footerBg}`}>
      <div className="container py-5">
        <div className="row text-start">

          {/* Cột 1 */}
          <div className="col-12 col-sm-6 col-md-3 mb-4">
            <h6 className="fw-bold">KẾT NỐI VỚI ESHOP</h6>
            <div className="mb-3">
              <Link to="#" className="text-white me-2"><i className="bi bi-facebook fs-5"></i></Link>
              <Link to="#" className="text-white me-2"><i className="bi bi-messenger fs-5"></i></Link>
              <Link to="#" className="text-white me-2"><i className="bi bi-youtube fs-5"></i></Link>
              <Link to="#" className="text-white"><i className="bi bi-tiktok fs-5"></i></Link>
            </div>
            <p className="fw-bold mb-1">TỔNG ĐÀI MIỄN PHÍ</p>
            <ul className="list-unstyled small">
              <li>Tư vấn mua hàng:<br /><strong>0123456789</strong> (8h00 - 22h00)</li>
              <li>Bảo hành:<br /><strong>0987654321</strong> (8h00 - 22h00)</li>
              <li>Hỗ trợ kỹ thuật:<br /><strong>0456123789</strong> (8h00 - 22h00)</li>
              <li>Gặp chuyên gia ngay!</li>
            </ul>
          </div>

          {/* Cột 2 */}
          <div className="col-12 col-sm-6 col-md-3 mb-4">
            <h6 className="fw-bold">VỀ CHÚNG TÔI</h6>
            <ul className="list-unstyled small">
              <li><Link to="/aboutus" className="text-white">Giới thiệu về công ty</Link></li>
              <li><Link to="/quy-che" className="text-white">Quy chế hoạt động</Link></li>
              <li><Link to="/khuyen-mai" className="text-white">Tìm kiếm khuyến mãi</Link></li>
              <li><Link to="/doi-tra" className="text-white">Giới thiệu mua đổi trả</Link></li>
              <li><Link to="/huong-dan-mua-hang" className="text-white">Hướng dẫn mua hàng</Link></li>
              <li><Link to="/thanh-toan-online" className="text-white">Hướng dẫn thanh toán online</Link></li>
              <li><Link to="/hoa-don" className="text-white">Tra cứu hóa đơn điện tử</Link></li>
              <li><Link to="/bao-hanh" className="text-white">Tra cứu bảo hành</Link></li>
            </ul>
          </div>

          {/* Cột 3 */}
          <div className="col-12 col-sm-6 col-md-3 mb-4">
            <h6 className="fw-bold">CHÍNH SÁCH</h6>
            <ul className="list-unstyled small">
              <li><Link to="/chinh-sach-bao-hanh" className="text-white">Chính sách bảo hành</Link></li>
              <li><Link to="/chinh-sach-doi-tra" className="text-white">Chính sách đổi trả</Link></li>
              <li><Link to="/chinh-sach-bao-mat" className="text-white">Chính sách bảo mật</Link></li>
              <li><Link to="/chinh-sach-tra-gop" className="text-white">Chính sách trả góp</Link></li>
              <li><Link to="/chinh-sach-khui-hop" className="text-white">Chính sách khui hộp sản phẩm</Link></li>
              <li><Link to="/chinh-sach-giao-hang" className="text-white">Chính sách giao hàng</Link></li>
              <li><Link to="/chinh-sach-lap-dat" className="text-white">Chính sách lắp đặt</Link></li>
              <li><Link to="/chinh-sach-thu-thap" className="text-white">Chính sách thu thập</Link></li>
            </ul>
          </div>

          {/* Cột 4 */}
          <div className="col-12 col-sm-6 col-md-3 mb-4">
            <h6 className="fw-bold">EMAIL LIÊN HỆ</h6>
            <ul className="list-unstyled small">
              <li>Hỗ trợ khách hàng:<a href="mailto:cskh@eshop.vn"> cskh@eshop.vn</a></li>
              <li>Liên hệ báo giá:<a href="mailto:baogia@eshop.vn"> baogia@eshop.vn</a></li>
              <li>Hợp tác phát triển:<a href="mailto:hoptac@eshop.vn"> hoptac@eshop.vn</a></li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
