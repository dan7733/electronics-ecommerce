import express from 'express'
import getHomePage from '../controller/HomeController.js'
import ProductController from '../controller/ProductController.js';
import ADMiddleware from '../controller/adminMiddlewareController.js';
import CategoryController from '../controller/CategoryController.js';
import BrandController from '../controller/BrandController.js';
import upload from '../configs/upload.js';
import VoucherController from '../controller/VoucherController.js';
import StoreController from '../controller/StoreController.js';
import StockController from '../controller/StockController.js';
import ProductdetailsController from '../controller/ProductdetailsController.js';
import UserController from '../controller/UserController.js';
import NewsController from '../controller/NewsController.js';
import orderController from '../controller/OrderController.js';
import ReviewController from '../controller/ReviewController.js';
const router = express.Router()
const initWebRouter = (app) => {

    // Xử lý login admin

    // kiểm tra hợp lệ(đã login thì cho vào) không thì gọi adminMiddleware trả về trang đăng nhập
    router.get('/', ADMiddleware.adminMiddleware, getHomePage)
    // lấy trang đăng nhập
    router.get('/login', ADMiddleware.getLoginPage)
    router.post('/login', ADMiddleware.adminLogin)
    // xử lý đăng xuất admin
    router.get('/logout', ADMiddleware.adminLogout)



    // xử lý sản phẩm
    router.get('/addproduct', ADMiddleware.adminMiddleware, ProductController.createProduct)
    router.post('/addproduct', ADMiddleware.adminMiddleware, upload('products').single('product_image'), ProductController.addProduct)
    // lấy danh sách sản phẩm
    router.get('/listproduct', ADMiddleware.adminMiddleware, ProductController.listProduct)
    // xóa sản phẩm
    router.post('/deleteproduct', ADMiddleware.adminMiddleware, ProductController.deleteProduct)
    // cập nhật sản phẩm
    router.get('/editproduct/:productid', ADMiddleware.adminMiddleware, ProductController.editProduct)
    router.post('/updateproduct', ADMiddleware.adminMiddleware, upload('products').single('product_image'), ProductController.updateProduct)




    // xử lý loại 
    // thêm loại
    router.get('/addcategory', ADMiddleware.adminMiddleware, CategoryController.createCategory)
    router.post('/addcategory', ADMiddleware.adminMiddleware, CategoryController.addCategory)
    // lấy danh sách loại
    router.get('/listcategory', ADMiddleware.adminMiddleware, CategoryController.listCategory)
    // xóa loại
    router.post('/deletecategory', ADMiddleware.adminMiddleware, CategoryController.deleteCategory)
    // cập nhật loại
    router.get('/editcategory/:categoryid', ADMiddleware.adminMiddleware, CategoryController.editCategory)
    router.post('/updatecategory/', ADMiddleware.adminMiddleware, CategoryController.updateCategory)


    // xử lý hãng
    // thêm hãng
    router.get('/addbrand', ADMiddleware.adminMiddleware, BrandController.createBrand)
    router.post('/addbrand', ADMiddleware.adminMiddleware, upload('brands').single('addbrand_logo'), BrandController.addBrand)
    // lấy danh sách 
    router.get('/listbrand', ADMiddleware.adminMiddleware, BrandController.listBrand)
    // xóa hãng
    router.post('/deletebrand', ADMiddleware.adminMiddleware, BrandController.deleteBrand)
    // cập  nhật hãng
    router.get('/editbrand/:brandid', ADMiddleware.adminMiddleware, BrandController.editBrand)
    router.post('/updatebrand/', ADMiddleware.adminMiddleware, upload('brands').single('updatebrand_logo'), BrandController.updateBrand)



    // Xử lý voucher
    router.get('/addvoucher', ADMiddleware.adminMiddleware, VoucherController.createVoucher)
    router.post('/addvoucher', ADMiddleware.adminMiddleware, VoucherController.addVoucher)

    // Lấy danh sách voucher
    router.get('/listvoucher', ADMiddleware.adminMiddleware, VoucherController.listVoucher);

    // Xóa thương hiệu
    router.post('/deletevoucher', ADMiddleware.adminMiddleware, VoucherController.deleteVoucher);

    // Cập nhật thương hiệu
    router.get('/editvoucher/:id', ADMiddleware.adminMiddleware, VoucherController.editVoucher);
    router.post('/updatevoucher/', ADMiddleware.adminMiddleware, VoucherController.updateVoucher);

    // vị trí của hàng
    // thêm vị trí của hàng
    router.get('/addstore', ADMiddleware.adminMiddleware, StoreController.createStore)
    router.post('/addStore', ADMiddleware.adminMiddleware, StoreController.addStore)
    // lấy danh sách cửa hàng
    router.get('/liststore', ADMiddleware.adminMiddleware, StoreController.listStore)
    // xóa cửa hàng
    router.get('/deletestore/:storeid', ADMiddleware.adminMiddleware, StoreController.deleteStore)
    //sửa cửa hàng
    router.get('/editstore/:storeid', ADMiddleware.adminMiddleware, StoreController.editStore)
    router.post('/updatestore', ADMiddleware.adminMiddleware, StoreController.updateStore)

    // Sản phẩm trong kho
    router.get('/liststock', ADMiddleware.adminMiddleware, StockController.listStock);
    router.get('/editstock/:productid', ADMiddleware.adminMiddleware, StockController.editStock);
    router.post('/updatestock', ADMiddleware.adminMiddleware, StockController.updateStock);
    router.get('/stockhistory', ADMiddleware.adminMiddleware, StockController.listStockHistory); // Route mới cho lịch sử
    router.get('/stockhistory/export-pdf', ADMiddleware.adminMiddleware, StockController.exportStockHistoryPDF); // Route mới cho xuất PDF




    // chi tiet sản phẩm  
    router.get('/listproductdetail', ADMiddleware.adminMiddleware, ProductdetailsController.listProductDetails)
    router.get('/editproductdetail/:productid', ADMiddleware.adminMiddleware, ProductdetailsController.editProductDetails)
    router.post('/updateproductdetail', ADMiddleware.adminMiddleware, ProductdetailsController.updateProductDetails)

    // tạo người dùng
    router.get('/adduser', ADMiddleware.adminMiddleware, UserController.createUser)
    router.post('/adduser', ADMiddleware.adminMiddleware, upload('useravatar').single('avatar'), UserController.addUser)
    // lấy danh sách người dùng
    router.get('/listuser', ADMiddleware.adminMiddleware, UserController.listUser)
    // xóa người dùng
    router.post('/deleteuser', ADMiddleware.adminMiddleware, UserController.deleteUser)
    // cập nhật người dùng
    router.get('/edituser/:userid', ADMiddleware.adminMiddleware, UserController.editUser)
    router.post('/updateuser', ADMiddleware.adminMiddleware, upload('useravatar').single('avatar'), UserController.updateUser)


    //thêm tin tức
    router.get('/addnews', ADMiddleware.adminMiddleware, NewsController.createNews)
    router.post('/addnews', ADMiddleware.adminMiddleware, upload('news').single('news_image'), NewsController.addNews)
    // lấy danh sách tin tức
    router.get('/listnews', ADMiddleware.adminMiddleware, NewsController.listNews)
    // xóa tin tức
    router.post('/deletenews', ADMiddleware.adminMiddleware, NewsController.deleteNews)
    // cập nhật tin tức
    router.get('/editnews/:newsid', ADMiddleware.adminMiddleware, NewsController.editNews)
    router.post('/updatenews', ADMiddleware.adminMiddleware, upload('news').single('news_image'), NewsController.updateNews)


    // danh sách đơn hàng
    router.get('/listorder', ADMiddleware.adminMiddleware, orderController.listOrder)
    router.get('/editorder/:orderid', ADMiddleware.adminMiddleware, orderController.editOrder)
    router.post('/updateorder', ADMiddleware.adminMiddleware, orderController.updateOrder)
    // tải pdf
    router.get('/downloadOrderPDF/:orderid', orderController.downloadOrderPDF);
    // get 404 Not Found
    // router.get("*", ADMiddleware.adminNotFound)


    // Xử lý đánh giá
    router.get('/listreviews', ADMiddleware.adminMiddleware, ReviewController.listReviews);
    router.post('/deletereview', ADMiddleware.adminMiddleware, ReviewController.deleteReview);
    router.get('/statstopratedproducts', ADMiddleware.adminMiddleware, ReviewController.statsTopRatedProducts);
    router.get('/searchreviewproducts', ADMiddleware.adminMiddleware, ReviewController.searchReviewProducts);



    app.use(ADMiddleware.adminSessionMiddleware);
    return app.use('/', router)
}
export default initWebRouter


