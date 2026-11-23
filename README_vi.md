# 📦 WEBSITE KINH DOANH THIẾT BỊ ĐIỆN TỬ

**Electronics E-commerce Website**

[English](README.md) | **Tiếng Việt**

-   **Kiến trúc:** Client -- Server (RESTful API)
-   **Mô hình:** Fullstack (React + Node.js + MySQL)

------------------------------------------------------------------------

## 1. Tổng quan dự án

Website được xây dựng nhằm tối ưu hóa quy trình kinh doanh thiết bị điện tử trực tuyến. Hệ thống cho phép quản trị viên quản lý kho hàng, sản phẩm và thuộc tính danh mục hiệu quả, đồng thời mang lại trải nghiệm mua sắm thuận tiện với giao diện hiện đại cho khách hàng.

Các tính năng nổi bật:
-   Tìm kiếm sản phẩm thông minh với Debounce
-   Lọc sản phẩm nâng cao theo thuộc tính linh hoạt
-   Giao diện hỗ trợ Chế độ tối (Dark Mode)
-   Thanh toán trực tuyến (ZaloPay, Chuyển khoản, COD)
-   Tích hợp bản đồ tính phí giao hàng theo khoảng cách
-   Xác thực người dùng qua Google OAuth

Toàn bộ hệ thống đã được Dockerize để triển khai nhanh chóng trên mọi môi trường.

------------------------------------------------------------------------

## 2. Kiến trúc hệ thống

```text
React (Client Frontend)
      ↓ REST API
Node.js + Express (Backend API)
      ↓
MySQL Database (Relational Data)
      ↓
Redis (Session / Cache)
```

------------------------------------------------------------------------

## 3. Chức năng chính

### Admin Portal
-   Quản lý sản phẩm chi tiết & kho hàng (CRUD)
-   Quản lý danh mục, thuộc tính động & thương hiệu
-   Quản lý thông tin cửa hàng (tọa độ chi nhánh)
-   Quản lý tin tức & bài viết (CMS)

### Customer UI
-   Tìm kiếm sản phẩm tức thì với Debounce
-   Lọc theo giá, danh mục, thuộc tính và thương hiệu
-   Chế độ tối/sáng (Dark/Light Mode) tùy chỉnh
-   Đăng ký / Đăng nhập / Google OAuth
-   Giỏ hàng & Quản lý đơn hàng
-   Danh sách yêu thích (Wishlist) & Reading list tin tức
-   Đánh giá & Bình luận sản phẩm

### Thanh toán & Vận chuyển
-   Thanh toán khi nhận hàng (COD)
-   Chuyển khoản ngân hàng
-   Cổng thanh toán ZaloPay (xác thực chữ ký HMAC-SHA256)
-   Tính phí giao hàng tự động theo km bằng Leaflet + OpenRouteService

------------------------------------------------------------------------

## 4. Công nghệ sử dụng

### Backend
-   Node.js & Express.js
-   MySQL & Sequelize ORM
-   JWT Authentication
-   Passport.js (Google OAuth)
-   Redis Session Store

### Frontend
-   **Customer UI:** React.js, Context API, Axios, Tailwind CSS / Custom Dark Mode
-   **Admin UI:** EJS Templating, Bootstrap 5, jQuery

### DevOps & Tools
-   Docker & Docker Compose
-   Nodemailer (Email Service)
-   Leaflet & OpenRouteService API

------------------------------------------------------------------------

## 5. Cài đặt dự án

### Backend `.env` (`./backend/.env`)
```env
PORT=3000
JWT_SECRET=keyboard_cat
Ad_Session_Secret=your_session_secret

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

DB_NAME=electronics_ecommerce
DB_USER=root
DB_PASSWORD=root
DB_HOST=mysql
DB_DIALECT=mysql

REDIS_HOST=redis
REDIS_PORT=6379

FRONTEND_URL=http://localhost:8080
```

### Frontend `.env` (`./frontend/.env`)
```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-id.apps.googleusercontent.com
REACT_APP_ORS_API_KEY=your-openrouteservice-api-key
REACT_APP_BACKEND_URL=http://localhost:3000
```

------------------------------------------------------------------------

## 6. Chạy dự án bằng Docker

```bash
docker compose up -d --build
```

*Lưu ý: Lần chạy đầu tiên MySQL sẽ mất khoảng 1 phút để khởi tạo dữ liệu.*

------------------------------------------------------------------------

## 7. Truy cập hệ thống

-   **Admin Portal:** `http://localhost:3000`
-   **Customer UI:** `http://localhost:8080`
-   **API Base URL:** `http://localhost:3000/api/v1`

------------------------------------------------------------------------

## 8. Lệnh Docker thường dùng

-   **Khởi chạy hệ thống:** `docker compose up -d --build`
-   **Dừng hệ thống:** `docker compose down`
-   **Xem log Backend:** `docker compose logs -f backend`
-   **Restart dịch vụ Backend:** `docker compose restart backend`