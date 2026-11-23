# 📦 ELECTRONICS E-COMMERCE PLATFORM

**Electronics E-commerce Website**

**English** | [Tiếng Việt](README_vi.md)

-   **Architecture:** Client -- Server (RESTful API)
-   **Tech Stack:** Fullstack (React + Node.js + MySQL)

------------------------------------------------------------------------

## 1. Overview

An end-to-end e-commerce system built for electronics retail. The platform provides administrators with robust tools for managing products, inventory, and dynamic category attributes, while delivering a responsive, feature-rich shopping experience for customers.

Key Features:
-   Smart real-time search with input debouncing
-   Advanced product filtering by dynamic category attributes
-   Full Dark Mode UI support
-   Multiple payment gateways (ZaloPay, Bank Transfer, COD)
-   Map integration for real-time shipping cost calculation based on distance
-   Google OAuth authentication integration

The entire platform is fully Dockerized for effortless deployment across development and production environments.

------------------------------------------------------------------------

## 2. System Architecture

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

## 3. Core Features

### Admin Portal
-   Comprehensive product & inventory management (CRUD)
-   Dynamic category attributes and brand management
-   Store branch location & coordinate management
-   News & Content Management System (CMS)

### Customer UI
-   Instant product search with debouncing
-   Multi-criteria filtering (price, category, attributes, brand)
-   Customizable Dark / Light Mode theme
-   User Authentication / Registration / Google OAuth
-   Shopping Cart & Order Management
-   Wishlist & Saved Articles list
-   Product Ratings & Reviews

### Payment & Shipping
-   Cash on Delivery (COD)
-   Direct Bank Transfer
-   ZaloPay Gateway (HMAC-SHA256 signature verification)
-   Distance-based shipping fee calculation using Leaflet + OpenRouteService API

------------------------------------------------------------------------

## 4. Tech Stack

### Backend
-   Node.js & Express.js
-   MySQL & Sequelize ORM
-   JWT Authentication
-   Passport.js (Google OAuth)
-   Redis Session Store

### Frontend
-   **Customer UI:** React.js, Context API, Axios, Tailwind CSS / Dark Mode
-   **Admin UI:** EJS Templating, Bootstrap 5, jQuery

### DevOps & Services
-   Docker & Docker Compose
-   Nodemailer (Email Notification)
-   Leaflet & OpenRouteService API

------------------------------------------------------------------------

## 5. Environment Setup

### Backend Environment (`./backend/.env`)
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

### Frontend Environment (`./frontend/.env`)
```env
REACT_APP_GOOGLE_CLIENT_ID=your-google-id.apps.googleusercontent.com
REACT_APP_ORS_API_KEY=your-openrouteservice-api-key
REACT_APP_BACKEND_URL=http://localhost:3000
```

------------------------------------------------------------------------

## 6. Running with Docker

```bash
docker compose up -d --build
```

*Note: Initializing MySQL container on first startup may take up to 1 minute.*

------------------------------------------------------------------------

## 7. System Access

-   **Admin Portal:** `http://localhost:3000`
-   **Customer UI:** `http://localhost:8080`
-   **API Endpoint Base:** `http://localhost:3000/api/v1`

------------------------------------------------------------------------

## 8. Useful Docker Commands

-   **Start System:** `docker compose up -d --build`
-   **Stop System:** `docker compose down`
-   **Backend Logs:** `docker compose logs -f backend`
-   **Restart Backend:** `docker compose restart backend`