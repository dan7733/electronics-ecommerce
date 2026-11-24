import express from "express";
import categoryAttributeModel from "../models/categoryAttributeModel.js";
import productModel from "../models/productModel.js";
import brandModel from "../models/brandModel.js";
import categoryModel from "../models/categoryModel.js";
import notificationModel from "../models/notificationModel.js"; // 🔔 Import Model Thông báo
import logger from "../configs/logger.js";

const listProductDetails = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;

        const searchKeyword = req.query.search || '';
        const sortOption = req.query.sort || 'default';
        const brandFilter = req.query.brand || '';
        const categoryFilter = req.query.category || '';

        // Lấy danh sách Thương hiệu và Danh mục để render ra dropdown
        const categories = await categoryModel.getAllCategory();
        const brands = await brandModel.getAllBrand();

        // Đếm tổng số sản phẩm thỏa mãn điều kiện lọc
        const totalProducts = await productModel.countProduct(searchKeyword, brandFilter, categoryFilter);
        const totalPages = Math.ceil(totalProducts / limit);
        const message = req.query.message || '';

        // Lấy danh sách sản phẩm theo bộ lọc
        const listProducts = await productModel.listProduct(
            offset, 
            limit, 
            searchKeyword, 
            sortOption, 
            brandFilter, 
            categoryFilter
        );

        res.render('home', {
            data: {
                title: 'Danh sách chi tiết sản phẩm',
                page: 'listProductdetail',
                rows: listProducts,
                currentPage: page,
                totalPages: totalPages,
                message: message,
                search: searchKeyword,
                sort: sortOption,
                brands: brands,
                categories: categories,
                selectedBrand: brandFilter,
                selectedCategory: categoryFilter
            }
        });
    } catch (error) {
        logger.error('Lỗi khi tải danh sách chi tiết sản phẩm', { error: error.message, stack: error.stack, query: req.query });
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

const editProductDetails = async (req, res) => {
    const { productid } = req.params;
    try {
        const product = await productModel.getProductById(productid);
        if (!product) {
            return res.redirect('/listproductdetail?message=' + encodeURIComponent('Sản phẩm không tồn tại'));
        }

        const attributes = await categoryAttributeModel.getProductAttributesByProductId(productid);
        const message = req.query.message || '';

        res.render('home', {
            data: {
                title: 'Cập nhật chi tiết sản phẩm',
                page: 'updateProductdetail',
                product: product,
                attributes: attributes,
                message: message
            }
        });
    } catch (error) {
        logger.error('Lỗi khi tải trang cập nhật chi tiết sản phẩm', { error: error.message, stack: error.stack, productid });
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

// CẬP NHẬT THUỘC TÍNH CHI TIẾT SẢN PHẨM (GỬI THÔNG BÁO CHO ADMIN)
const updateProductDetails = async (req, res) => {
    const { product_id, attributes } = req.body;

    try {
        if (!product_id) {
            logger.warn('Cập nhật chi tiết sản phẩm thất bại: Thiếu product_id');
            return res.redirect('/listproductdetail?message=' + encodeURIComponent('Thiếu thông tin ID sản phẩm'));
        }

        if (attributes && typeof attributes === 'object') {
            await categoryAttributeModel.saveProductAttributeValues(product_id, attributes);
        }

        // 🔔 THÔNG BÁO HỆ THỐNG: Ghi nhật ký dành riêng cho Admin
        try {
            await notificationModel.createNotification({
                user_id: null, // null = Thông báo hệ thống gửi cho Admin
                title: 'Cập nhật chi tiết kỹ thuật sản phẩm',
                message: `Admin đã cập nhật các thông số/thuộc tính kỹ thuật cho sản phẩm (ID: #${product_id}).`,
                type: 'system',
                created_by: 'admin',
                link: `/editproductdetail/${product_id}`
            });
        } catch (notiErr) {
            logger.error('Lỗi khi gửi thông báo cập nhật chi tiết sản phẩm cho Admin', { error: notiErr.message, product_id });
        }

        logger.info("Cập nhật chi tiết sản phẩm thành công", { product_id });
        res.redirect(`/editproductdetail/${product_id}?message=${encodeURIComponent('Cập nhật chi tiết sản phẩm thành công!')}`);
    } catch (error) {
        logger.error('Lỗi khi cập nhật chi tiết sản phẩm', { error: error.message, stack: error.stack, body: req.body });
        res.status(500).send("Lỗi khi cập nhật dữ liệu.");
    }
};

export default {
    listProductDetails,
    editProductDetails,
    updateProductDetails
};