# 📦 WEBSITE KINH DOANH THIẾT BỊ ĐIỆN TỬ  
**Electronics E-commerce Website**

> **Đồ án chuyên ngành** – Ngành Kỹ thuật Phần mềm  

- **Sinh viên thực hiện:** Đặng Chương Hậu  
- **Loại ứng dụng:** Website bán hàng – Thiết bị điện tử  

---

## 📌 1. Tổng quan dự án

Website được xây dựng nhằm hỗ trợ kinh doanh thiết bị điện tử trực tuyến, cho phép khách hàng **tìm kiếm, lọc sản phẩm, đặt hàng**, đồng thời quản lý các tính năng **người dùng, thông báo email, đăng nhập Google** và các chức năng hỗ trợ trải nghiệm mua sắm.  

Hệ thống hướng tới việc **quản lý sản phẩm, loại sản phẩm, vị trí cửa hàng**, đồng thời cung cấp công cụ cho khách hàng dễ dàng **tìm kiếm, lọc, theo dõi đơn hàng, quên mật khẩu và nhận thông báo qua email**.

---

## ⚙️ 2. Chức năng chính

### 🗃️ Quản lý Sản phẩm & Danh mục
- Quản lý **Loại sản phẩm (Category)** và **Sản phẩm (Product)**: thêm, sửa, xóa, xem chi tiết  
- **Tìm kiếm & lọc sản phẩm** theo tên, loại, thương hiệu, giá  
- **Quản lý vị trí cửa hàng (Store Location)**: thông tin chi nhánh và bản đồ  

### 🛒 Quản lý Người dùng & Đơn hàng
- **Đăng nhập/Đăng ký**: email/password, Google OAuth  
- **Quên mật khẩu**: email xác nhận & reset  
- **Quản lý đơn hàng**: xem trạng thái, lịch sử mua hàng  

### 📣 Marketing & Thông báo
- **Email thông báo**: đơn hàng, reset mật khẩu  
- **Voucher & khuyến mãi**  
- **Tin tức & đánh giá sản phẩm**  

### 🔍 Tìm kiếm & trải nghiệm người dùng
- Lọc sản phẩm theo giá, loại, thương hiệu  
- Xem chi tiết sản phẩm, hình ảnh, đánh giá  
- Giỏ hàng & thanh toán cơ bản  

---

## 🛠️ 3. Công nghệ sử dụng (Tech Stack)

### 🔙 Backend
- **Runtime:** Node.js  
- **Framework:** Express.js  
- **ORM / Query:** Sequelize và MySQL  
- **Authentication:** JWT, Session  

### 🎨 Frontend
- **View Engine:** EJS  
- **CSS Framework:** Bootstrap 5  
- **JavaScript:** jQuery  
- **Chart & Editor:** Chart.js, CKEditor  
- **Map & Routing:** Leaflet.js, OpenRouteService  

### 🗄️ Database & Cache
- **Database:** MySQL  
- **Cache / Session:** Redis  

### 🚀 DevOps
- **Containerization:** Docker  
- **Orchestration:** Docker Compose  

---

---

## 🐳 4. Hướng dẫn cài đặt & chạy dự án (Docker)

### 🔹 Bước 1: Cấu hình biến môi trường Backend

Tạo file `.env` tại thư mục gốc:

```ini
PORT=3000
JWT_SECRET=keyboard cat
Ad_Session_Secret=yourdawg

# Email Config (Gmail App Password)
EMAIL_USER=
EMAIL_PASS=

# Database Config (Docker)
DB_NAME=doan4
DB_USER=root
DB_PASSWORD=root
DB_HOST=mysql
DB_DIALECT=mysql

# Redis Config (Docker)
REDIS_HOST=redis
REDIS_PORT=6379
```

### 🔹 Bước 2: Cấu hình biến môi trường Frontend

Tạo file `.env.frontend` trong thư mục frontend React:

```ini
REACT_APP_GOOGLE_CLIENT_ID=<Google Client ID>
REACT_APP_ORS_API_KEY=<OpenRouteService API Key>
REACT_APP_BACKEND_URL=http://localhost:3000
```

---

### 🔹 Bước 3: Khởi chạy hệ thống

```bash
docker compose up -d --build
```

⏳ **Lưu ý:** lần đầu chạy, MySQL cần **1–2 phút** để khởi tạo database và dữ liệu ban đầu.

---

### 🔹 Bước 4: Truy cập ứng dụng

🌐 **Website:**  
- **Admin:** `http://localhost:3000`  
- **Người dùng:** `http://localhost:3001`  

---

## 🧪 5. Các câu lệnh Docker thường dùng

| Hành động | Câu lệnh |
|---------|---------|
| Chạy dự án | `docker compose up -d --build` |
| Dừng dự án | `docker compose down` |
| Xem log | `docker compose logs -f` |
| Restart server | `docker compose restart web` |
| Vào MySQL | `docker exec -it inventory_mysql mysql -u root -p` |

---

## 👨‍💻 Tác giả

**Đặng Chương Hậu**  
Sinh viên Kỹ thuật Phần mềm

