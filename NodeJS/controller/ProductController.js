import express from "express";
import fs from 'fs';
import path from 'path';
import categoryModel from '../models/categoryModel.js';
import brandModel from '../models/brandModel.js';
import productModel from '../models/productModel.js';
import stockModel from "../models/stockModel.js";
import productdetailsModel from "../models/productdetailsModel.js";
import stock from "../models/stockModel.js"
// Hàm xóa ảnh nếu cần
const deleteProductImage = (filename) => {
  if (!filename) return;
  try {
    const filePath = path.resolve(`images/products/${filename}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Lỗi khi xóa ảnh: ${error.message}`);
  }
};


// tải trang thêm sản phẩm
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
    console.log(err)
  }
}

// thêm sản phẩm
const addProduct = async (req, res) => {
  try {
    const { productName, productPrice, ProductDiscount_price, productDescription, brand_id, category_id } = req.body;
    const product_image = req.file?.filename || null;

    // Kiểm tra dữ liệu trước khi lưu
    if (!productName || !productPrice || !category_id) { 
      deleteProductImage(product_image); // Xóa ảnh nếu dữ liệu không hợp lệ
      return res.render("addProduct", { 
        data: { message: "Tên các trường không được để trống!" } 
      });
    }

    const categories = await categoryModel.getAllCategory();
    const Brands = await brandModel.getAllBrand();

    // Lưu vào database
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
      deleteProductImage(product_image); // Xóa ảnh nếu lưu không thành công
    }else {
      // Lấy id của sản phẩm vừa thêm

      const productId = result.product_id;
      // Thêm vào kho nếu sản phẩm được thêm thành công
      await stockModel.addStock(productId);
      await productdetailsModel.addProductDetail(productId);
    }

    res.render("home", {
      data: {
        page: 'addproduct',
        categories: categories,
        brands: Brands,
        message: result ? "Thêm sản phẩm thành công!" : "Thêm sản phẩm thất bại, vui lòng thử lại."
      }
    });

  } catch (error) {
    console.error('Lỗi khi thêm sản phẩm:', error);
    deleteProductImage(req.file?.filename); // Xóa ảnh nếu có lỗi
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
      const brandFilter = req.query.brand || '';  // Lọc theo thương hiệu
      const categoryFilter = req.query.category || ''; // Lọc theo danh mục

      const totalProduct = await productModel.countProduct(searchKeyword, brandFilter, categoryFilter);
      const totalPages = Math.ceil(totalProduct / limit);
      const message = req.query.message || '';

      // Lấy danh sách thương hiệu và danh mục
      const categories = await categoryModel.getAllCategory();
      const brands = await brandModel.getAllBrand();

      // Lấy danh sách sản phẩm với các bộ lọc
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
      console.error(error);
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

// Xóa sản phẩm
const deleteProduct = async (req, res) => {
  try {
    const { product_id } = req.body; // Lấy product_id từ request body
    const product_img = await productModel.deleteProduct(product_id); // Gọi hàm xóa sản phẩm
    if (product_img) {
      deleteProductImage(product_img); // Xóa ảnh nếu có
    }

    res.redirect('/listproduct?message=Xóa thành công');
  } catch (error) {
    console.error(error);
    res.redirect('/listproduct?message=Xóa thất bại');
  }
};


// lấy chi tiết nhãn hàng
const editProduct = async (req, res) => {
  const { productid } = req.params;
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
};


// cập nhật sản phẩm
const updateProduct = async (req, res) => {
  try {
    const { product_id, name, price, discount_price, description, oldImage, brand_id, category_id } = req.body;

    // Kiểm tra product_id có tồn tại không
    if (!product_id) {
      throw new Error("Thiếu product_id");
    }

    // Giữ lại ảnh cũ nếu không có ảnh mới
    let newImage = oldImage;
    if (req.file) {
      newImage = req.file.filename;
    }

    // Xóa ảnh cũ nếu có ảnh mới khác
    if (oldImage && newImage !== oldImage) {
      deleteProductImage(oldImage);
    }

    // Cập nhật sản phẩm
    const updatedProduct = await productModel.updateProduct(product_id, name, price, discount_price, description, newImage, brand_id, category_id);
    if (!updatedProduct) {
      throw new Error("Cập nhật thất bại");
    }

    return res.redirect(`/editproduct/${product_id}?message=Cập nhật thành công`);
  } catch (error) {
    console.error("Lỗi cập nhật sản phẩm:", error);

    // Nếu có ảnh mới nhưng lỗi xảy ra -> Xóa ảnh mới để tránh rác
    if (req.file) {
      deleteProductImage(req.file.filename);
    }

    return res.redirect(`/editproduct?message=${encodeURIComponent(error.message)}`);
  }
};



//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

// lấy 4 sản phẩm (nếu không có id thì lấy 4 sản phẩm mới)
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
      console.error('Error in getLatestProductsAPI:', error);
      return res.status(500).json({
          errCode: 1,
          message: "Internal server error"
      });
  }
};
// lấy chi tiết sản phẩm theo id
const getProductDetailAPI = async (req, res) => {
  try {
      const productid = req.params.id;

      if (!productid) {
          return res.status(400).json({
              errCode: 1,
              message: "Missing product ID"
          });
      }
      // Lấy thông tin kho
      const stockInfo = await stock.getStockByProductId(productid);
      // Lấy thông tin cơ bản của sản phẩm
      const productInfo = await productModel.getProductDetailAPI(productid);
      // Lấy thông tin kỹ thuật chi tiết
      const detailInfo = await productdetailsModel.getInforProductDetailAPI(productid);
      return res.status(200).json({
          errCode: 0,
          message: "Success",
          product: {
              ...productInfo.dataValues,
              stock: stockInfo ? stockInfo.dataValues : null,
              technical_details: detailInfo ? detailInfo.dataValues : null
          }
      });
  } catch (error) {
      console.error('Error in getProductDetailAPI:', error);
      return res.status(500).json({
          errCode: 1,
          message: "Internal server error"
      });
  }
};



// danh sách sản phẩm call api
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
    console.error(error);
    return res.status(500).json({
      errCode: 1,
      message: "Internal server error"
  });
  }
};

// danh sách sản phẩm mới nhất
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
    console.error('Error in listLatestProductsAPI:', error);
    return res.status(500).json({
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
  // API
  getLatestProductsAPI,
  getProductDetailAPI,
  listProductAPI,
  listLatestProductAPI,
};