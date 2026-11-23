import express from "express";
import fs from 'fs';
import path from 'path';
import categoryModel from '../models/categoryModel.js';
import brandModel from '../models/brandModel.js';
import productModel from '../models/productModel.js';
import stockModel from "../models/stockModel.js";
import categoryAttributeModel from "../models/categoryAttributeModel.js";
import stock from "../models/stockModel.js";
import logger from '../configs/logger.js';

const deleteProductImage = (filename) => {
  if (!filename) return;
  try {
    const filePath = path.resolve(`images/products/${filename}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('Đã xóa ảnh sản phẩm', { filename });
    }
  } catch (error) {
    logger.error('Lỗi khi xóa ảnh sản phẩm', { error: error.message, filename });
  }
};

const createProduct = async (req, res) => {
  try {
    const categories = await categoryModel.getAllCategory();
    const Brands = await brandModel.getAllBrand();
    res.render('home', {
      data: {
        title: 'Create New Product',
        page: 'addProduct',
        categories: categories,
        brands: Brands
      }
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang thêm sản phẩm', { error: err.message, stack: err.stack });
  }
};

const addProduct = async (req, res) => {
  try {
    const { productName, productPrice, ProductDiscount_price, productDescription, brand_id, category_id } = req.body;
    const product_image = req.file?.filename || null;

    if (!productName || !productPrice || !category_id) { 
      logger.warn('Thêm sản phẩm thất bại: Thiếu thông tin bắt buộc', { body: req.body });
      deleteProductImage(product_image);
      return res.render("addProduct", { 
        data: { message: "Tên các trường không được để trống!" } 
      });
    }

    const categories = await categoryModel.getAllCategory();
    const Brands = await brandModel.getAllBrand();

    const result = await productModel.addProduct(
      productName, 
      productPrice, 
      ProductDiscount_price, 
      productDescription, 
      product_image, 
      brand_id, 
      category_id
    );

    if(!result) {
      logger.warn('Thêm sản phẩm thất bại tại Model', { productName });
      deleteProductImage(product_image);
    } else {
      const productId = result.product_id;
      // Khởi tạo số lượng kho cho sản phẩm mới
      await stockModel.addStock(productId);
      logger.info('Thêm sản phẩm thành công', { productId, productName });
    }

    res.render("home", {
      data: {
        page: 'addProduct',
        categories: categories,
        brands: Brands,
        message: result ? "Thêm sản phẩm thành công!" : "Thêm sản phẩm thất bại, vui lòng thử lại."
      }
    });

  } catch (error) {
    logger.error('Lỗi khi thêm sản phẩm', { error: error.message, stack: error.stack, body: req.body });
    deleteProductImage(req.file?.filename);
    res.status(500).send('Có lỗi xảy ra khi thêm sản phẩm.');
  }
};

const listProduct = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const offset = (page - 1) * limit;
      const searchKeyword = req.query.search || '';
      const sortOption = req.query.sort || 'default';
      const brandFilter = req.query.brand || '';
      const categoryFilter = req.query.category || '';

      const totalProduct = await productModel.countProduct(searchKeyword, brandFilter, categoryFilter);
      const totalPages = Math.ceil(totalProduct / limit);
      const message = req.query.message || '';

      const categories = await categoryModel.getAllCategory();
      const brands = await brandModel.getAllBrand();

      const listProduct = await productModel.listProduct(offset, limit, searchKeyword, sortOption, brandFilter, categoryFilter);

      res.render('home', {
          data: {
              title: 'List Product',
              page: 'listProduct',
              rows: listProduct,
              currentPage: page,
              totalPages: totalPages,
              message: message,
              search: searchKeyword,
              sort: sortOption,
              categories: categories,
              brands: brands,
              selectedBrand: brandFilter,
              selectedCategory: categoryFilter
          }
      });
  } catch (error) {
      logger.error('Lỗi khi tải danh sách sản phẩm', { error: error.message, stack: error.stack, query: req.query });
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.body;
    const product_img = await productModel.deleteProduct(product_id);
    if (product_img) {
      deleteProductImage(product_img);
    }

    logger.info('Xóa sản phẩm thành công', { product_id });
    res.redirect('/listproduct?message=Xóa thành công');
  } catch (error) {
    logger.error('Lỗi khi xóa sản phẩm', { error: error.message, stack: error.stack, body: req.body });
    res.redirect('/listproduct?message=Xóa thất bại');
  }
};

const editProduct = async (req, res) => {
  const { productid } = req.params;
  try {
    const product = await productModel.getProductById(productid);
    const categories = await categoryModel.getAllCategory();
    const brands = await brandModel.getAllBrand();
    const message = req.query.message || '';
    
    return res.render('home', {
      data: {
        title: 'Update Product',
        page: 'updateProduct',
        product: product,
        categories: categories,
        brands: brands,
        message: message
      }
    });
  } catch (error) {
    logger.error('Lỗi khi lấy chi tiết sản phẩm', { error: error.message, stack: error.stack, productid });
    return res.redirect('/listproduct');
  }
};

const updateProduct = async (req, res) => {
  try {
    const { product_id, name, price, discount_price, description, oldImage, brand_id, category_id } = req.body;

    if (!product_id) {
      logger.warn('Cập nhật sản phẩm thất bại: Thiếu product_id');
      throw new Error("Thiếu product_id");
    }

    let newImage = oldImage;
    if (req.file) {
      newImage = req.file.filename;
    }

    if (oldImage && newImage !== oldImage) {
      deleteProductImage(oldImage);
    }

    const updatedProduct = await productModel.updateProduct(product_id, name, price, discount_price, description, newImage, brand_id, category_id);
    if (!updatedProduct) {
      logger.warn('Cập nhật sản phẩm thất bại tại Model', { product_id });
      throw new Error("Cập nhật thất bại");
    }

    logger.info('Cập nhật sản phẩm thành công', { product_id, name });
    return res.redirect(`/editproduct/${product_id}?message=Cập nhật thành công`);
  } catch (error) {
    logger.error("Lỗi cập nhật sản phẩm", { error: error.message, stack: error.stack, body: req.body });

    if (req.file) {
      deleteProductImage(req.file.filename);
    }

    return res.redirect(`/editproduct?message=${encodeURIComponent(error.message)}`);
  }
};

const getLatestProductsAPI = async (req, res) => {
  try {
      const category_id = req.params.id || null;
      const data = await productModel.getlatestProductsAPI(category_id);

      return res.status(200).json({
          errCode: 0,
          message: "Success",
          products: data
      });
  } catch (error) {
      logger.error('Error in getLatestProductsAPI', { error: error.message, stack: error.stack, category_id: req.params.id });
      return res.status(500).json({
          errCode: 1,
          message: "Internal server error"
      });
  }
};

const getProductDetailAPI = async (req, res) => {
  try {
      const productid = req.params.id;

      if (!productid) {
          logger.warn('API: Thiếu product ID', { params: req.params });
          return res.status(400).json({ errCode: 1, message: "Missing product ID" });
      }

      const stockInfo = await stock.getStockByProductId(productid);
      const productInfo = await productModel.getProductDetailAPI(productid);

      if (!productInfo) {
          return res.status(404).json({ errCode: 1, message: "Product not found" });
      }

      // Lấy toàn bộ thuộc tính động của sản phẩm từ bảng product_attribute_values
      const attributes = await categoryAttributeModel.getProductAttributesByProductId(productid);

      const technicalDetails = {};
      attributes.forEach(attr => {
          if (attr.value) {
              technicalDetails[attr.name] = attr.value;
          }
      });

      return res.status(200).json({
          errCode: 0,
          message: "Success",
          product: {
              ...productInfo.dataValues,
              stock: stockInfo ? stockInfo.dataValues : null,
              technical_details: technicalDetails
          }
      });
  } catch (error) {
      logger.error('Error in getProductDetailAPI', { error: error.message, stack: error.stack, productid: req.params.id });
      return res.status(500).json({
          errCode: 1,
          message: "Internal server error"
      });
  }
};

const listProductAPI = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 16;
    const offset = (page - 1) * limit;

    const searchKeyword = req.query.search || '';
    const sortOption = req.query.sort || 'default';
    const brandFilter = req.query.brand || '';
    const categoryFilter = req.query.category || '';
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;

    const totalProduct = await productModel.countProductAPI(searchKeyword, brandFilter, categoryFilter, maxPrice, minPrice);
    const totalPages = Math.ceil(totalProduct / limit);
    const message = req.query.message || '';

    const categories = await categoryModel.getAllCategory();
    const brands = await brandModel.getAllBrand();

    const listProduct = await productModel.listProductAPI(
      offset,
      limit,
      searchKeyword,
      sortOption,
      brandFilter,
      categoryFilter,
      maxPrice,
      minPrice
    );

    res.status(200).json({
      title: 'List Product',
      page: 'listProduct',
      listProduct: listProduct,
      currentPage: page,
      totalPages: totalPages,
      message: message,
      search: searchKeyword,
      sort: sortOption,
      maxPrice: maxPrice,
      categories: categories,
      brands: brands,
      selectedBrand: brandFilter,
      selectedCategory: categoryFilter
    });

  } catch (error) {
    logger.error('Error in listProductAPI', { error: error.message, stack: error.stack, query: req.query });
    return res.status(500).json({
      errCode: 1,
      message: "Internal server error"
  });
  }
};

const listLatestProductAPI = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const offset = (page - 1) * limit;

    const products = await productModel.listLatestProductAPI(offset, limit);
    const totalProducts = await productModel.countListLastestProductAPI();
    const hasMore = offset + products.length < totalProducts;

    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      listProduct: products,
      hasMore
    });
  } catch (error) {
    logger.error('Error in listLatestProductAPI', { error: error.message, stack: error.stack, query: req.query });
    return res.status(200).json({
      errCode: 1,
      message: 'Internal server error'
    });
  }
};

export default {
  createProduct,
  addProduct,
  listProduct,
  deleteProduct,
  editProduct,
  updateProduct,
  getLatestProductsAPI,
  getProductDetailAPI,
  listProductAPI,
  listLatestProductAPI,
};