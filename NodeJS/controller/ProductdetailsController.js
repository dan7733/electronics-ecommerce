import express from "express";
import productdetailsModel from "../models/productdetailsModel.js";

const listProductDetails = async (req, res) => {
    try {
        // Lấy trang hiện tại từ query string, mặc định là 1
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Số lượng sản phẩm trên mỗi trang
        const offset = (page - 1) * limit; // Vị trí bắt đầu lấy sản phẩm

        // Lấy từ khóa tìm kiếm từ query string, mặc định là rỗng
        const searchKeyword = req.query.search || '';

        // Lấy tùy chọn sắp xếp từ query string, mặc định là 'default'
        const sortOption = req.query.sort || 'default';

        // Lấy tổng số sản phẩm chi tiết
        const totalDetails = await productdetailsModel.countProductDetails(searchKeyword);

        // Tính tổng số trang
        const totalPages = Math.ceil(totalDetails / limit);

        // Nhận message từ URL nếu có
        const message = req.query.message || '';

        // Lấy danh sách chi tiết sản phẩm
        const listDetails = await productdetailsModel.listProductDetails(offset, limit, searchKeyword, sortOption);

        // Render kết quả lên trang
        res.render('home', {
            data: {
                title: 'List Product Details',
                page: 'listProductdetail',
                rows: listDetails, // Danh sách chi tiết sản phẩm
                currentPage: page,
                totalPages: totalPages,
                message: message,
                search: searchKeyword,
                sort: sortOption
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

// tải trang thêm chi tiết sản phẩm
const editProductDetails = async (req, res) => {
    try {
        const { productid } = req.params;
        const result = await productdetailsModel.getProductDetailById(productid);
        const message = req.query.message || '';
        res.render('home', {
            data: {
                title: 'Cập nhật chi tiết sản phẩm',
                page: 'updateProductdetail',
                productdetail: result,
                message: message,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

// cập nhật chi tiết sản phẩm
const updateProductDetails = async (req, res) => {
    try {
        const {
            product_id,
            operating_system,
            storage,
            ram,
            processor,
            release_year
        } = req.body;

        await productdetailsModel.updateProductDetail(
            product_id,
            operating_system,
            storage,
            ram,
            processor,
            release_year
        );
        console.log("Cập nhật chi tiết sản phẩm thành công! ".product_id);
        res.redirect(`/editproductdetail/${product_id}?message=Cập nhật chi tiết sản phẩm thành công!`);
    } catch (error) {
        console.error('Lỗi khi cập nhật chi tiết sản phẩm:', error);
        res.status(500).send("Lỗi khi cập nhật dữ liệu.");
    }
};




export default {
    listProductDetails, // Xuất phương thức với tên mới
    editProductDetails,
    updateProductDetails
};

