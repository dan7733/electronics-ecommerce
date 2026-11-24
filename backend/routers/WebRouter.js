import express from 'express';
import getHomePage from '../controllers/HomeController.js';
import ProductController from '../controllers/ProductController.js';
import ADMiddleware from '../controllers/adminMiddlewareController.js';
import CategoryController from '../controllers/CategoryController.js';
import BrandController from '../controllers/BrandController.js';
import upload from '../configs/upload.js';
import VoucherController from '../controllers/VoucherController.js';
import StoreController from '../controllers/StoreController.js';
import StockController from '../controllers/StockController.js';
import ProductdetailsController from '../controllers/ProductdetailsController.js';
import CategoryAttributeController from '../controllers/CategoryAttributeController.js';
import UserController from '../controllers/UserController.js';
import NewsController from '../controllers/NewsController.js';
import orderController from '../controllers/OrderController.js';
import ReviewController from '../controllers/ReviewController.js';
import LogController from '../controllers/LogController.js';
import NotificationController from '../controllers/NotificationController.js';

const router = express.Router();

const initWebRouter = (app) => {

    // Login Admin & Authentication
    router.get('/', ADMiddleware.adminMiddleware, getHomePage);
    router.get('/login', ADMiddleware.getLoginPage);
    router.post('/login', ADMiddleware.adminLogin);
    router.get('/logout', ADMiddleware.adminLogout);

    // Sản phẩm
    router.get('/addproduct', ADMiddleware.adminMiddleware, ProductController.createProduct);
    router.post('/addproduct', ADMiddleware.adminMiddleware, upload('products').single('product_image'), ProductController.addProduct);
    router.get('/listproduct', ADMiddleware.adminMiddleware, ProductController.listProduct);
    router.post('/deleteproduct', ADMiddleware.adminMiddleware, ProductController.deleteProduct);
    router.get('/editproduct/:productid', ADMiddleware.adminMiddleware, ProductController.editProduct);
    router.post('/updateproduct', ADMiddleware.adminMiddleware, upload('products').single('product_image'), ProductController.updateProduct);

    // Loại sản phẩm
    router.get('/addcategory', ADMiddleware.adminMiddleware, CategoryController.createCategory);
    router.post('/addcategory', ADMiddleware.adminMiddleware, CategoryController.addCategory);
    router.get('/listcategory', ADMiddleware.adminMiddleware, CategoryController.listCategory);
    router.post('/deletecategory', ADMiddleware.adminMiddleware, CategoryController.deleteCategory);
    router.get('/editcategory/:categoryid', ADMiddleware.adminMiddleware, CategoryController.editCategory);
    router.post('/updatecategory/', ADMiddleware.adminMiddleware, CategoryController.updateCategory);

    // QUẢN LÝ THUỘC TÍNH DANH MỤC
    router.get('/category-attributes', ADMiddleware.adminMiddleware, CategoryAttributeController.listCategoryAttributes);
    router.post('/add-category-attribute', ADMiddleware.adminMiddleware, CategoryAttributeController.addCategoryAttribute);
    router.post('/delete-category-attribute', ADMiddleware.adminMiddleware, CategoryAttributeController.deleteCategoryAttribute);

    // Hãng sản phẩm
    router.get('/addbrand', ADMiddleware.adminMiddleware, BrandController.createBrand);
    router.post('/addbrand', ADMiddleware.adminMiddleware, upload('brands').single('addbrand_logo'), BrandController.addBrand);
    router.get('/listbrand', ADMiddleware.adminMiddleware, BrandController.listBrand);
    router.post('/deletebrand', ADMiddleware.adminMiddleware, BrandController.deleteBrand);
    router.get('/editbrand/:brandid', ADMiddleware.adminMiddleware, BrandController.editBrand);
    router.post('/updatebrand/', ADMiddleware.adminMiddleware, upload('brands').single('updatebrand_logo'), BrandController.updateBrand);

    // Voucher
    router.get('/addvoucher', ADMiddleware.adminMiddleware, VoucherController.createVoucher);
    router.post('/addvoucher', ADMiddleware.adminMiddleware, VoucherController.addVoucher);
    router.get('/listvoucher', ADMiddleware.adminMiddleware, VoucherController.listVoucher);
    router.post('/deletevoucher', ADMiddleware.adminMiddleware, VoucherController.deleteVoucher);
    router.get('/editvoucher/:id', ADMiddleware.adminMiddleware, VoucherController.editVoucher);
    router.post('/updatevoucher/', ADMiddleware.adminMiddleware, VoucherController.updateVoucher);

    // Cửa hàng
    router.get('/addstore', ADMiddleware.adminMiddleware, StoreController.createStore);
    router.post('/addStore', ADMiddleware.adminMiddleware, StoreController.addStore);
    router.get('/liststore', ADMiddleware.adminMiddleware, StoreController.listStore);
    router.get('/deletestore/:storeid', ADMiddleware.adminMiddleware, StoreController.deleteStore);
    router.get('/editstore/:storeid', ADMiddleware.adminMiddleware, StoreController.editStore);
    router.post('/updatestore', ADMiddleware.adminMiddleware, StoreController.updateStore);

    // Kho hàng
    router.get('/liststock', ADMiddleware.adminMiddleware, StockController.listStock);
    router.get('/editstock/:productid', ADMiddleware.adminMiddleware, StockController.editStock);
    router.post('/updatestock', ADMiddleware.adminMiddleware, StockController.updateStock);
    router.get('/stockhistory', ADMiddleware.adminMiddleware, StockController.listStockHistory);
    router.get('/stockhistory/export-pdf', ADMiddleware.adminMiddleware, StockController.exportStockHistoryPDF);

    // Chi tiết sản phẩm
    router.get('/listproductdetail', ADMiddleware.adminMiddleware, ProductdetailsController.listProductDetails);
    router.get('/editproductdetail/:productid', ADMiddleware.adminMiddleware, ProductdetailsController.editProductDetails);
    router.post('/updateproductdetail', ADMiddleware.adminMiddleware, ProductdetailsController.updateProductDetails);

    // Tài khoản
    router.get('/adduser', ADMiddleware.adminMiddleware, UserController.createUser);
    router.post('/adduser', ADMiddleware.adminMiddleware, upload('useravatar').single('avatar'), UserController.addUser);
    router.get('/listuser', ADMiddleware.adminMiddleware, UserController.listUser);
    router.post('/deleteuser', ADMiddleware.adminMiddleware, UserController.deleteUser);
    router.get('/edituser/:userid', ADMiddleware.adminMiddleware, UserController.editUser);
    router.post('/updateuser', ADMiddleware.adminMiddleware, upload('useravatar').single('avatar'), UserController.updateUser);

    // Tin tức
    router.get('/addnews', ADMiddleware.adminMiddleware, NewsController.createNews);
    router.post('/addnews', ADMiddleware.adminMiddleware, upload('news').single('news_image'), NewsController.addNews);
    router.get('/listnews', ADMiddleware.adminMiddleware, NewsController.listNews);
    router.post('/deletenews', ADMiddleware.adminMiddleware, NewsController.deleteNews);
    router.get('/editnews/:newsid', ADMiddleware.adminMiddleware, NewsController.editNews);
    router.post('/updatenews', ADMiddleware.adminMiddleware, upload('news').single('news_image'), NewsController.updateNews);

    // Đơn hàng
    router.get('/listorder', ADMiddleware.adminMiddleware, orderController.listOrder);
    router.get('/editorder/:orderid', ADMiddleware.adminMiddleware, orderController.editOrder);
    router.post('/updateorder', ADMiddleware.adminMiddleware, orderController.updateOrder);
    router.get('/downloadOrderPDF/:orderid', orderController.downloadOrderPDF);

    // Đánh giá
    router.get('/listreviews', ADMiddleware.adminMiddleware, ReviewController.listReviews);
    router.post('/deletereview', ADMiddleware.adminMiddleware, ReviewController.deleteReview);
    router.get('/statstopratedproducts', ADMiddleware.adminMiddleware, ReviewController.statsTopRatedProducts);
    router.get('/searchreviewproducts', ADMiddleware.adminMiddleware, ReviewController.searchReviewProducts);

    // Logs
    router.get('/log', ADMiddleware.adminMiddleware, LogController.getLogPage);
    router.get('/api/v1/logs/files', ADMiddleware.adminMiddleware, LogController.getLogFilesAPI);
    router.get('/api/v1/logs/:filename', ADMiddleware.adminMiddleware, LogController.getLogContentAPI);

    // Quản lý Thông báo
    router.get('/addnotification', ADMiddleware.adminMiddleware, NotificationController.createNotification);
    router.post('/addnotification', ADMiddleware.adminMiddleware, NotificationController.addNotification);
    router.get('/listnotification', ADMiddleware.adminMiddleware, NotificationController.listNotification);
    router.post('/deletenotification', ADMiddleware.adminMiddleware, NotificationController.deleteNotification);
    // ⚡ Route Đánh dấu tất cả thông báo hệ thống đã đọc cho Admin Dashboard
    router.get('/mark-all-read-notification', ADMiddleware.adminMiddleware, NotificationController.markAllAdminRead);
    // API lấy chi tiết thông báo cho Modal Popup
    router.get('/api/v1/notifications/:id', ADMiddleware.adminMiddleware, NotificationController.getNotificationDetailAPI);
    // Route API Live Search người dùng cho trang thông báo
    router.get('/api/v1/users/search', ADMiddleware.adminMiddleware, NotificationController.searchUsersAPI);

    app.use(ADMiddleware.adminSessionMiddleware);
    return app.use('/', router);
};

export default initWebRouter;