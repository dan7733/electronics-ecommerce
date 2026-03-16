# 📦 WEBSITE KINH DOANH THIẾT BỊ ĐIỆN TỬ

**Electronics E-commerce Website**

> Đồ án chuyên ngành -- Ngành Kỹ thuật Phần mềm

-   Sinh viên thực hiện: Đặng Chương Hậu
-   Kiến trúc: Client -- Server (RESTful API)
-   Mô hình: Fullstack (React + Node.js + MySQL)

------------------------------------------------------------------------

# 1. Tổng quan dự án

Website được xây dựng nhằm tối ưu hóa quy trình kinh doanh thiết bị điện
tử trực tuyến. Hệ thống cho phép quản trị viên quản lý kho hàng, sản
phẩm và đơn hàng hiệu quả, đồng thời mang lại trải nghiệm mua sắm thuận
tiện cho khách hàng.

Các tính năng nổi bật:

-   Tìm kiếm sản phẩm thông minh
-   Lọc sản phẩm nâng cao
-   Thanh toán trực tuyến
-   Tích hợp bản đồ tính phí giao hàng
-   Xác thực Google OAuth

Toàn bộ hệ thống đã được Dockerize để triển khai nhanh chóng trên mọi
môi trường.

------------------------------------------------------------------------

# 2. Kiến trúc hệ thống

React (Client)\
↓ REST API\
Node.js + Express\
↓\
MySQL Database\
↓\
Redis (Session / Cache)

------------------------------------------------------------------------

# 3. Chức năng chính

## Admin Portal

-   Quản lý sản phẩm (CRUD)
-   Quản lý danh mục & thương hiệu
-   Quản lý cửa hàng (tọa độ chi nhánh)
-   Quản lý tin tức (CMS đơn giản)

## Customer UI

-   Tìm kiếm sản phẩm với Debounce
-   Lọc theo giá, danh mục, thương hiệu
-   Đăng ký / đăng nhập / Google OAuth
-   Giỏ hàng
-   Wishlist
-   Reading list tin tức
-   Đánh giá sản phẩm

## Thanh toán & Vận chuyển

-   COD
-   Chuyển khoản
-   ZaloPay
-   Tính phí giao hàng theo km bằng Leaflet + OpenRouteService

------------------------------------------------------------------------

# 4. Công nghệ sử dụng

## Backend

-   Node.js
-   Express.js
-   MySQL
-   Sequelize ORM
-   JWT Authentication
-   Passport.js (Google OAuth)
-   Redis Session Store

## Frontend

Customer UI: - React.js - Context API - Axios

Admin UI: - EJS - Bootstrap 5 - jQuery

## DevOps

-   Docker
-   Docker Compose
-   Nginx (production)
-   Nodemailer (Email service)

------------------------------------------------------------------------

# 5. Cài đặt dự án

## Backend .env

PORT=3000 JWT_SECRET=keyboard cat Ad_Session_Secret=yourdawg

EMAIL_USER=your-email@gmail.com EMAIL_PASS=your-app-password

DB_NAME=doan4 DB_USER=root DB_PASSWORD=root DB_HOST=mysql
DB_DIALECT=mysql

REDIS_HOST=redis REDIS_PORT=6379

FRONTEND_URL=http://localhost:8080

## Frontend .env

REACT_APP_GOOGLE_CLIENT_ID=your-google-id.apps.googleusercontent.com
REACT_APP_ORS_API_KEY=your-openrouteservice-api-key
REACT_APP_BACKEND_URL=http://localhost:3000

------------------------------------------------------------------------

# 6. Chạy dự án bằng Docker

docker compose up -d --build

Lần chạy đầu tiên MySQL sẽ mất khoảng 1 phút để khởi tạo.

------------------------------------------------------------------------

# 7. Truy cập hệ thống

Admin: http://localhost:3000\
Customer: http://localhost:8080\
API: http://localhost:3000/api/v1

------------------------------------------------------------------------

# 8. Docker commands

Chạy hệ thống: docker compose up -d --build

Dừng hệ thống: docker compose down

Xem log backend: docker compose logs -f web

Restart backend: docker compose restart web

------------------------------------------------------------------------

# Tác giả

Đặng Chương Hậu\
Sinh viên Kỹ thuật Phần mềm
