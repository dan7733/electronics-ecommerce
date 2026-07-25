import express from "express";
import fs from 'fs';
import path from 'path';
import brandModel from '../models/brandModel.js';  // Import model xử lý với CSDL
import { UnknownConstraintError } from "sequelize";
import logger from '../configs/logger.js'; // Import custom logger

// Hàm xóa ảnh nếu cần
const deleteImage = (filename) => {
  if (!filename) return;
  try {
    const filePath = path.resolve(`images/brands/${filename}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('Đã xóa ảnh thành công', { filename });
    }
  } catch (error) {
    logger.error('Lỗi khi xóa ảnh', { error: error.message, filename });
  }
};

// Tải trang thêm hãng
const createBrand = async (req, res) => {
  return res.render('home', {
    data: {
      title: 'List Brand',
      page: 'addBrand',
    }
  });
};

// thêm hãng
const addBrand = async (req, res) => {
  try {
    const { addbrand_name, addbrand_highlight, addbrand_country } = req.body;
    const logo = req.file?.filename || null;

    //  Kiểm tra dữ liệu trước khi lưu
    if (!addbrand_name) {
      logger.warn('Thêm hãng thất bại: Tên hãng trống');
      deleteImage(logo); // Xóa ảnh ngay nếu dữ liệu không hợp lệ
      return res.render("home", { 
        data: { page: 'addBrand', message: "Tên hãng không được để trống!" } 
      });
    }

    //  Lưu vào database
    const result = await brandModel.addBrand(
      addbrand_name, 
      logo, 
      addbrand_highlight, 
      addbrand_country || 'Unknown'
    );

    if (result) {
      logger.info('Thêm hãng thành công', { brandName: addbrand_name, country: addbrand_country });
    } else {
      logger.warn('Thêm hãng thất bại tại Model', { brandName: addbrand_name });
    }

    res.render("home", {
      data: {
        page: 'addBrand',
        message: result ? "Thêm hãng thành công!" : "Thêm hãng thất bại, vui lòng thử lại."
      }
    });

  } catch (error) {
    logger.error('Lỗi khi thêm hãng', { error: error.message, stack: error.stack, body: req.body });
    deleteImage(req.file?.filename); // Xóa ảnh nếu có lỗi
    res.status(500).send('Có lỗi xảy ra khi thêm hãng.');
  }
};

// danh sách hãng snả phẩm
const listBrand = async (req, res) => {
  try {
      // Lấy trang hiện tại từ query string, mặc định là 1
      const page = parseInt(req.query.page) || 1;
      const limit = 5; // số lượng thương hiệu trên mỗi trang
      const offset = (page - 1) * limit; // vị trí bắt đầu lấy thương hiệu

      // Lấy từ khóa tìm kiếm từ query string, mặc định là rỗng
      const searchKeyword = req.query.search || '';

      // Lấy tùy chọn sắp xếp từ query string, mặc định là 'default'
      const sortOption = req.query.sort || 'default';

      // Lấy tổng số thương hiệu
      const totalBrand = await brandModel.countBrand(searchKeyword);

      // Tính tổng số trang
      const totalPages = Math.ceil(totalBrand / limit);

      // Nhận message từ URL nếu có
      const message = req.query.message || '';  

      // Lấy danh sách thương hiệu
      const listBrand = await brandModel.listBrand(offset, limit, searchKeyword, sortOption);

      res.render('home', {
          data: {
              title: 'List Brand',
              page: 'listBrand',
              rows: listBrand,
              currentPage: page,
              totalPages: totalPages,
              message: message,
              search: searchKeyword,
              sort: sortOption
          }
      });
  } catch (error) {
      logger.error('Lỗi khi tải danh sách hãng', { error: error.message, stack: error.stack, query: req.query });
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

// Xóa 
const deleteBrand = async (req, res) => {
  const { brand_id } = req.body;
  try {
    const logo = await brandModel.deleteBrand(brand_id);
    if(logo){
      deleteImage(logo);
    }
    logger.info('Xóa hãng thành công', { brand_id });
    res.redirect('/listbrand?message=Xóa thành công');
  } catch (error) {
    logger.error('Lỗi khi xóa hãng', { error: error.message, stack: error.stack, brand_id });
    res.redirect('/listbrand?message=Xóa thất bại');
  }
};

// lấy chi tiết nhãn hàng
const editBrand = async (req, res) => {
  const { brandid } = req.params;
  try {
    const brand = await brandModel.getBrandById(brandid);
    const message = req.query.message || '';
    return res.render('home', {
      data: {
        title: 'Update Brand',
        page: 'updateBrand',
        brand: brand,
        message: message
      }
    });
  } catch (error) {
    logger.error('Lỗi khi lấy chi tiết nhãn hàng', { error: error.message, stack: error.stack, brandid });
    return res.redirect('/listbrand');
  }
};

// Cập nhật nhãn hàng
const updateBrand = async (req, res) => {
  try {
    const { brand_id, brandName, brandCountry, oldLogo, highlight } = req.body;

    // Kiểm tra brand_id có tồn tại không
    if (!brand_id) {
      logger.warn('Cập nhật hãng thất bại: Thiếu brand_id');
      throw new Error("Thiếu brand_id");
    }

    // Giữ lại logo cũ nếu không có logo mới
    let newLogo = oldLogo;
    if (req.file) {
      newLogo = req.file.filename;
    }

    // Xóa logo cũ nếu có logo mới khác
    if (oldLogo && newLogo !== oldLogo) {
      deleteImage(oldLogo);
    }

    // Cập nhật thương hiệu
    const updatedBrand = await brandModel.updateBrand(brand_id, brandName, newLogo, brandCountry, highlight);
    if (!updatedBrand) {
      logger.warn('Cập nhật hãng thất bại tại Model', { brand_id });
      throw new Error("Cập nhật thất bại");
    }

    logger.info('Cập nhật hãng thành công', { brand_id, brandName });
    return res.redirect(`/editbrand/${brand_id}?message=Cập nhật thành công`);
  } catch (error) {
    logger.error("Lỗi cập nhật thương hiệu", { error: error.message, stack: error.stack, body: req.body });

    // Nếu có ảnh mới, nhưng lỗi xảy ra -> Xóa ảnh mới để tránh rác
    if (req.file) {
      deleteImage(req.file.filename);
    }

    return res.redirect(`/editbrand?message=${encodeURIComponent(error.message)}`);
  }
};


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

const getAllBrandAPI = async (req, res) => {
  try {
    const data = await brandModel.getAllBrandAPI();
    return res.status(200).json({
      errCode: 0,
      message: "Success",
      brands: data
    });
  } catch (error) {
    logger.error('Lỗi trong getAllBrandAPI', { error: error.message, stack: error.stack });
    return res.status(500).json({
      errCode: 1,
      message: "Internal server error"
    });
  }
};

export default {
  createBrand,
  addBrand,
  listBrand,
  deleteBrand,
  editBrand,
  updateBrand,
  // API
  getAllBrandAPI
};