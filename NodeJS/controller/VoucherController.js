import express from "express";
import voucherModel from '../models/voucherModel.js';
import logger from '../configs/logger.js'; // Import custom logger

// Tải trang thêm voucher
const createVoucher = async (req, res) => {
  try {
    return res.render('home', {
      data: {
        title: 'Thêm Voucher',
        page: 'addVoucher',
      }
    });
  } catch (error) {
    logger.error('Lỗi khi tải trang thêm voucher', { error: error.message, stack: error.stack });
    res.status(500).send("Lỗi máy chủ.");
  }
};

// Thêm voucher mới
const addVoucher = async (req, res) => {
  try {
    const { voucher, value, end_at } = req.body;
    
    if (!voucher || !value || !end_at) {
        logger.warn('Thêm voucher thất bại: Thiếu thông tin bắt buộc', { body: req.body });
    }

    const result = await voucherModel.addVoucher(voucher, value, end_at);
    
    if (result) {
        logger.info('Thêm voucher thành công', { voucher, value });
    } else {
        logger.warn('Thêm voucher thất bại tại Model', { voucher });
    }

    res.render("home", {
      data: {
        page: 'addVoucher',
        message: result ? "Thêm voucher thành công!" : "Thêm voucher thất bại, vui lòng thử lại."
      }
    });
  } catch (error) {
    logger.error('Lỗi khi thêm voucher', { error: error.message, stack: error.stack, body: req.body });
    res.status(500).send('Có lỗi xảy ra khi thêm voucher.');
  }
};

// Danh sách vouchers có phân trang, tìm kiếm và sắp xếp
const listVoucher = async (req, res) => {
  try {
      // Lấy trang hiện tại từ query string, mặc định là 1
      const page = parseInt(req.query.page) || 1;
      const limit = 5; // Số lượng vouchers trên mỗi trang
      const offset = (page - 1) * limit; // Tính vị trí bắt đầu lấy dữ liệu
      
      // Lấy từ khóa tìm kiếm từ query string, mặc định là rỗng
      const searchKeyword = req.query.search || '';
      
      // Lấy tùy chọn sắp xếp từ query string, mặc định là 'default'
      const sortOption = req.query.sort || 'default';
      
      // Lấy tổng số lượng vouchers
      const totalVouchers = await voucherModel.countVoucher(searchKeyword);
      
      // Tính tổng số trang
      const totalPages = Math.ceil(totalVouchers / limit);
      
      // Lấy danh sách vouchers với các điều kiện tìm kiếm và sắp xếp
      const listVouchers = await voucherModel.listVoucher(offset, limit, searchKeyword, sortOption);
      
      // Lấy message từ query string (nếu có)
      const message = req.query.message || '';  

      res.render('home', {
          data: {
              title: 'Danh sách Vouchers',
              page: 'listVoucher',
              rows: listVouchers,
              currentPage: page,
              totalPages: totalPages,
              message: message,
              search: searchKeyword,
              sort: sortOption
          }
      });
  } catch (error) {
      logger.error('Lỗi khi tải danh sách vouchers', { error: error.message, stack: error.stack, query: req.query });
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};


// Xóa voucher
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.body;
    await voucherModel.deleteVoucher(id);
    logger.info('Xóa voucher thành công', { id });
    res.redirect('/listVoucher?message=Xóa thành công');
  } catch (error) {
    logger.error('Lỗi khi xóa voucher', { error: error.message, stack: error.stack, body: req.body });
    res.redirect('/listVoucher?message=Xóa thất bại');
  }
};

// Tải trang cập nhật voucher
const editVoucher = async (req, res) => {
  const { id } = req.params;
  try {
    const voucher = await voucherModel.getVoucherById(id);
    
    if (!voucher) {
        logger.warn('Tải trang cập nhật voucher thất bại: Không tìm thấy voucher', { id });
        return res.redirect('/listVoucher');
    }

    return res.render('home', {
      data: {
        title: 'Cập nhật Voucher',
        page: 'updateVoucher',
        voucher: voucher,
        message: req.query.message || ''
      }
    });
  } catch (error) {
    logger.error('Lỗi khi tải trang cập nhật voucher', { error: error.message, stack: error.stack, id });
    res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

// Cập nhật voucher
const updateVoucher = async (req, res) => {
  const { id, voucherCode, value, end_at } = req.body;
  try {
    if (!id) {
        logger.warn('Cập nhật voucher thất bại: Thiếu ID voucher');
        return res.redirect('/listVoucher?message=Cập nhật thất bại, thiếu ID');
    }

    await voucherModel.updateVoucher(id, voucherCode, value, end_at);
    logger.info('Cập nhật voucher thành công', { id, voucherCode });
    res.redirect(`/editVoucher/${id}?message=Cập nhật thành công`);
  } catch (error) {
    logger.error('Lỗi khi cập nhật voucher', { error: error.message, stack: error.stack, body: req.body });
    res.redirect(`/editVoucher/${id || ''}?message=Cập nhật thất bại`);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

// ÁP DỤNG VOUCHER
const applyVoucherAPI = async (req, res) => {
  const { voucherCode } = req.body;

  try {
    if (!voucherCode) {
        logger.warn('API Áp dụng voucher thất bại: Không gửi mã voucher');
        return res.status(400).json({
            errCode: 1,
            message: 'Mã voucher không được để trống',
            value: null
        });
    }

    const voucher = await voucherModel.applyVoucherAPI(voucherCode);

    if (!voucher) {
      logger.warn('API Áp dụng voucher thất bại: Voucher không tồn tại hoặc đã hết hạn', { voucherCode });
      return res.status(200).json({
        errCode: 1,
        message: 'Voucher không tồn tại hoặc đã hết hạn',
        value: null
      });
    }

    logger.info('API Áp dụng voucher thành công', { voucherCode, value: voucher.value });
    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      value: voucher.value
    });
  } catch (error) {
    logger.error('Lỗi khi áp dụng voucher qua API', { error: error.message, stack: error.stack, body: req.body });
    return res.status(500).json({
      errCode: 1,
      message: 'Internal server error'
    });
  }
};

export default {
  createVoucher,
  addVoucher,
  listVoucher,
  deleteVoucher,
  editVoucher,
  updateVoucher,
  //API
  applyVoucherAPI
};