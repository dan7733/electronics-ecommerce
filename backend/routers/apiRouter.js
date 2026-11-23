import express from 'express';
import ProductController from '../controllers/ProductController.js';
import CategoryController from '../controllers/CategoryController.js';
import BrandController from '../controllers/BrandController.js';
import userMiddlewareController from '../controllers/userMiddlewareController.js';
import orderController from '../controllers/OrderController.js';
import VoucherController from '../controllers/VoucherController.js';
import StoreController from '../controllers/StoreController.js';
import NewsController from '../controllers/NewsController.js';
import upload from '../configs/upload.js';
import ReviewController from '../controllers/ReviewController.js';
import { getCollaborativeRecommendationsController, getProductBasedRecommendationsController, getPopularityBasedRecommendationsController } from '../controllers/RecommendController.js';

const router = express.Router();

const initAPIRoute = (app) => {

    // Lấy sản phẩm hiển thị trang chủ (4 sản phẩm mới nhất)
    router.get('/latestproducts/:id', ProductController.getLatestProductsAPI);
    router.get('/latestproducts', ProductController.getLatestProductsAPI);
    router.get('/listlatestproduct', ProductController.listLatestProductAPI);

    // Lấy chi tiết sản phẩm theo ID (Bao gồm Stock + Brand + Category + Dynamic Technical Details)
    router.get('/productdetail/:id', ProductController.getProductDetailAPI);
    
    // Lấy danh sách loại sản phẩm & hãng
    router.get('/listcategory', CategoryController.getAllCategoryAPI);
    router.get('/listbrand', BrandController.getAllBrandAPI);
    
    // Danh sách sản phẩm (Có phân trang, bộ lọc)
    router.get('/listproduct', ProductController.listProductAPI);

    // Đăng nhập, Đăng xuất, Refresh Token
    router.post('/login', userMiddlewareController.userLoginAPI);
    router.get('/refresh-token', userMiddlewareController.refreshTokenAPI);
    router.get('/logout', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.userLogoutAPI);
    router.get('/account', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.getAccountAPI);
    router.get('/detailuserbyusername/:username', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.getdetailUserbyUsernameAPI);

    // Đơn hàng & ZaloPay
    router.post('/addorder', userMiddlewareController.userMiddlewareAPI, orderController.addOrderAPI);
    router.post('/zalopay-callback', orderController.zalopayCallback);
    router.get('/query-zalopay/:app_trans_id', orderController.queryOrderStatus);
    router.get('/listorder/', userMiddlewareController.userMiddlewareAPI, orderController.listOrderAPI);
    router.get('/orderdetail/:orderid', userMiddlewareController.userMiddlewareAPI, orderController.getDetailOrderbyIdAPI);

    // Voucher
    router.post('/applyvoucher', VoucherController.applyVoucherAPI);

    // Vị trí cửa hàng
    router.get('/liststore', StoreController.getAllStoresAPI);

    // Đăng ký & Xác thực Email
    router.post('/register/', userMiddlewareController.addUserAPI);
    router.get('/verifyemail', userMiddlewareController.getEmailVerifyUserAPI);

    // Đăng nhập Google
    router.post('/google', userMiddlewareController.addGoogleUserAPI);

    // Tin tức
    router.get('/latestnews', NewsController.getLatestNewsAPI);
    router.get('/listnews', NewsController.listNewsAPI);
    router.get('/detailnews/:newsid', NewsController.getNewsByIdAPI);

    // Cập nhật người dùng & Quên mật khẩu
    router.patch('/updateuser', userMiddlewareController.userMiddlewareAPI, upload('useravatar').single('avatar'), userMiddlewareController.updateUserAPI);
    router.post('/change-password', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.changePasswordAPI);
    router.post('/request-password-reset', userMiddlewareController.requestPasswordResetAPI);
    router.get('/reset-password', userMiddlewareController.getResetPasswordAPI);
    router.post('/reset-password', userMiddlewareController.resetPasswordAPI);

    // Gợi ý sản phẩm (AI / Recommendation)
    router.get('/recommend/collaborative/:username?', getCollaborativeRecommendationsController);
    router.get('/recommend/product-based/:productId', getProductBasedRecommendationsController);
    router.get('/recommend/popularity-based', getPopularityBasedRecommendationsController);

    // Đánh giá sản phẩm (Reviews)
    router.post('/review', userMiddlewareController.userMiddlewareAPI, ReviewController.addReviewAPI);
    router.put('/review', userMiddlewareController.userMiddlewareAPI, ReviewController.updateReviewAPI);
    router.get('/reviews/:product_id', ReviewController.getReviewsByProductAPI);
    router.get('/user-review', userMiddlewareController.userMiddlewareAPI, ReviewController.getUserReviewAPI);
    router.get('/latestreviews', ReviewController.getLatestReviewsAPI);

    // Gắn router vào ứng dụng Express
    return app.use('/api/v1', router);
};

export default initAPIRoute;