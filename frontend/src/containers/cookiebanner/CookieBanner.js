import React, { useState, useEffect } from 'react';

/**
 * ============================================================================
 * COMPONENT: CookieBanner (Thông báo Cookie)
 * ----------------------------------------------------------------------------
 * GHI CHÚ PHÁT TRIỂN (DEVELOPMENT NOTE):
 * - Đây là tính năng UI mô phỏng (Mockup / Hình thức dành cho Demo giao diện).
 * - Hiện tại CHƯA KÍCH HOẠT logic chặn/quản lý Cookie thực tế từ trình duyệt/backend.
 * - Hành động nhấn "Đồng ý" hoặc "Không" chỉ đơn thuần lưu trạng thái vào LocalStorage
 *   để ẩn Popup, phục vụ cho trải nghiệm người dùng (UX).
 * ============================================================================
 */
const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // TẠM THỜI: Chỉ kiểm tra trạng thái ẩn/hiện popup dựa trên lựa chọn cũ trong LocalStorage.
    // (Chưa kết nối với hệ thống quản lý cookie thực tế)
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleConsent = (choice) => {
    // TẠM THỜI: Lưu vết lựa chọn người dùng ('accepted' hoặc 'declined') để đóng Banner.
    // LƯU Ý: Nút nhấn chưa có tác dụng bật/tắt cookie hệ thống, chỉ mang tính chất hình thức demo.
    localStorage.setItem('cookieConsent', choice);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      maxWidth: '400px',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '18px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <i className="fas fa-cookie-bite" style={{ fontSize: '22px', color: '#218282' }}></i>
        <h6 style={{ margin: 0, fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
          Thông báo Cookie
        </h6>
      </div>

      <p style={{ margin: 0, fontSize: '0.86rem', color: '#64748b', lineHeight: '1.5' }}>
        Website sử dụng cookie để cải thiện trải nghiệm người dùng và hỗ trợ mua sắm tốt hơn. Bạn có đồng ý cho phép sử dụng cookie không?
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
        <button
          onClick={() => handleConsent('declined')}
          style={{
            padding: '7px 16px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            backgroundColor: '#ffffff',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          Không
        </button>

        <button
          onClick={() => handleConsent('accepted')}
          style={{
            padding: '7px 18px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#218282',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
        >
          Đồng ý
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;