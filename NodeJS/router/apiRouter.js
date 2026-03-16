import express from 'express';
import ProductController from '../controller/ProductController.js';
import CategoryController from '../controller/CategoryController.js';
import BrandController from '../controller/BrandController.js';
import userMiddlewareController from '../controller/userMiddlewareController.js';
import orderController from '../controller/OrderController.js';
import VoucherController from '../controller/VoucherController.js';
import StoreController from '../controller/StoreController.js';
import NewsController from '../controller/NewsController.js';
import upload from '../configs/upload.js';
import ReviewController from '../controller/ReviewController.js';
import { getCollaborativeRecommendationsController, getProductBasedRecommendationsController, getPopularityBasedRecommendationsController } from '../controller/RecommendController.js';
const router = express.Router();

const initAPIRoute = (app) => {

    // lấy sản phẩm hiển thị bên trang chủ (4 sản phẩm mới nhất)
    router.get('/latestproducts/:id', ProductController.getLatestProductsAPI);
    router.get('/latestproducts', ProductController.getLatestProductsAPI);
    router.get('/listlatestproduct', ProductController.listLatestProductAPI);

    // lấy chi tiết sản phẩm theo id
    router.get('/productdetail/:id', ProductController.getProductDetailAPI);
    // lấy danh sách loại sản phẩm
    router.get('/listcategory', CategoryController.getAllCategoryAPI);
    // lấy danh sách hãng
    router.get('/listbrand', BrandController.getAllBrandAPI);
    // danh sách sản phẩm
    router.get('/listproduct', ProductController.listProductAPI)


    // đăng nhập và đăng xuất
    router.post('/login', userMiddlewareController.userLoginAPI)
    router.get('/refresh-token', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.refreshTokenAPI)
    router.get('/logout', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.userLogoutAPI)
    router.get('/account', userMiddlewareController.getAccountAPI)

    router.get('/detailuserbyusername/:username', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.getdetailUserbyUsernameAPI)
    // đơn hàng
    router.post('/addorder', userMiddlewareController.userMiddlewareAPI, orderController.addOrderAPI);
    router.post('/zalopay-callback', orderController.zalopayCallback);
    router.get('/query-zalopay/:app_trans_id', orderController.queryOrderStatus); // Thêm route mới
    router.get('/listorder/', userMiddlewareController.userMiddlewareAPI, orderController.listOrderAPI);
    router.get('/orderdetail/:orderid', userMiddlewareController.userMiddlewareAPI, orderController.getDetailOrderbyIdAPI)

    //Voucher
    router.post('/applyvoucher', VoucherController.applyVoucherAPI)

    // vị trí cửa hàng
    router.get('/liststore', StoreController.getAllStoresAPI)

    // đăng ký người dùng
    router.post('/register/', userMiddlewareController.addUserAPI)
    router.get('/verifyemail', userMiddlewareController.getEmailVerifyUserAPI)


    //google login
    router.post('/google', userMiddlewareController.addGoogleUserAPI)


    // news
    router.get('/latestnews', NewsController.getLatestNewsAPI);
    router.get('/listnews', NewsController.listNewsAPI);
    router.get('/detailnews/:newsid', NewsController.getNewsByIdAPI)

    // cập nhật người dùng 
    router.patch('/updateuser', userMiddlewareController.userMiddlewareAPI, upload('useravatar').single('avatar'), userMiddlewareController.updateUserAPI)
    router.post('/change-password', userMiddlewareController.userMiddlewareAPI, userMiddlewareController.changePasswordAPI);


    // quênt mật khẩu
    router.post('/request-password-reset', userMiddlewareController.requestPasswordResetAPI);
    router.get('/reset-password', userMiddlewareController.getResetPasswordAPI);
    router.post('/reset-password', userMiddlewareController.resetPasswordAPI);
    
    // gợi ý sản phẩm
    router.get('/recommend/collaborative/:username?', getCollaborativeRecommendationsController); // Optional username
    router.get('/recommend/product-based/:productId', getProductBasedRecommendationsController); // New product-based route
    router.get('/recommend/popularity-based', getPopularityBasedRecommendationsController); // New popularity-based route
    // đánh giá sản phẩm ReviewController
    router.post('/review', userMiddlewareController.userMiddlewareAPI, ReviewController.addReviewAPI);
    router.put('/review', userMiddlewareController.userMiddlewareAPI, ReviewController.updateReviewAPI); // New route for updating reviews
    router.get('/reviews/:product_id', ReviewController.getReviewsByProductAPI);
    router.get('/user-review', userMiddlewareController.userMiddlewareAPI, ReviewController.getUserReviewAPI); // New route for fetching user review
    router.get('/latestreviews', ReviewController.getLatestReviewsAPI); // New route

    
    // Gắn router vào ứng dụng Express
    return app.use('/api/v1', router);
};

export default initAPIRoute;