import express from "express";
import voucherModel from '../models/voucherModel.js';
import notificationModel from '../models/notificationModel.js'; // 🔔 Import Model Thông báo
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

// THÊM VOUCHER MỚI (GỬI THÔNG BÁO CHO ADMIN)
const addVoucher = async (req, res) => {
  try {
    const { voucher, value, end_at } = req.body;
    
    if (!voucher || !value || !end_at) {
        logger.warn('Thêm voucher thất bại: Thiếu thông tin bắt buộc', { body: req.body });
        return res.render("home", {
          data: {
            title: 'Thêm Voucher',
            page: 'addVoucher',
            message: "Thiếu thông tin bắt buộc!"
          }
        });
    }

    const result = await voucherModel.addVoucher(voucher, value, end_at);
    
    if (result) {
        logger.info('Thêm voucher thành công', { voucher, value });

        // 🔔 THÔNG BÁO HỆ THỐNG: Ghi nhật ký Thêm voucher dành cho Admin
        try {
          const formattedValue = Number(value).toLocaleString('vi-VN');
          await notificationModel.createNotification({
            user_id: null, // null = gửi cho Admin
            title: 'Thêm Voucher mới',
            message: `Admin vừa tạo thành công mã giảm giá "${voucher}" (Giá trị: ${formattedValue} VND, Hạn dùng: ${end_at}).`,
            type: 'system',
            created_by: 'admin',
            link: '/listVoucher'
          });
        } catch (notiErr) {
          logger.error('Lỗi khi gửi thông báo thêm voucher cho Admin', { error: notiErr.message, voucher });
        }
    } else {
        logger.warn('Thêm voucher thất bại tại Model', { voucher });
    }

    res.render("home", {
      data: {
        title: 'Thêm Voucher',
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
      const page = parseInt(req.query.page) || 1;
      const limit = 5; 
      const offset = (page - 1) * limit; 
      
      const searchKeyword = req.query.search || '';
      const sortOption = req.query.sort || 'default';
      
      const totalVouchers = await voucherModel.countVoucher(searchKeyword);
      const totalPages = Math.ceil(totalVouchers / limit);
      
      const listVouchers = await voucherModel.listVoucher(offset, limit, searchKeyword, sortOption);
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

// XÓA VOUCHER (GỬI THÔNG BÁO CHO ADMIN)
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.body;
    await voucherModel.deleteVoucher(id);
    logger.info('Xóa voucher thành công', { id });

    // 🔔 THÔNG BÁO HỆ THỐNG: Ghi nhật ký Xóa voucher dành cho Admin
    try {
      await notificationModel.createNotification({
        user_id: null, // null = gửi cho Admin
        title: 'Xóa Voucher',
        message: `Admin đã xóa mã giảm giá ID #${id} khỏi hệ thống.`,
        type: 'system',
        created_by: 'admin',
        link: '/listVoucher'
      });
    } catch (notiErr) {
      logger.error('Lỗi khi gửi thông báo xóa voucher cho Admin', { error: notiErr.message, id });
    }

    res.redirect('/listVoucher?message=' + encodeURIComponent('Xóa thành công'));
  } catch (error) {
    logger.error('Lỗi khi xóa voucher', { error: error.message, stack: error.stack, body: req.body });
    res.redirect('/listVoucher?message=' + encodeURIComponent('Xóa thất bại'));
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

// CẬP NHẬT VOUCHER (GỬI THÔNG BÁO CHO ADMIN)
const updateVoucher = async (req, res) => {
  const { id, voucherCode, value, end_at } = req.body;
  try {
    if (!id) {
        logger.warn('Cập nhật voucher thất bại: Thiếu ID voucher');
        return res.redirect('/listVoucher?message=' + encodeURIComponent('Cập nhật thất bại, thiếu ID'));
    }

    await voucherModel.updateVoucher(id, voucherCode, value, end_at);
    logger.info('Cập nhật voucher thành công', { id, voucherCode });

    // 🔔 THÔNG BÁO HỆ THỐNG: Ghi nhật ký Cập nhật voucher dành cho Admin
    try {
      await notificationModel.createNotification({
        user_id: null, // null = gửi cho Admin
        title: 'Cập nhật Voucher',
        message: `Admin đã cập nhật thông tin mã giảm giá "${voucherCode}" (ID: #${id}).`,
        type: 'system',
        created_by: 'admin',
        link: `/editVoucher/${id}`
      });
    } catch (notiErr) {
      logger.error('Lỗi khi gửi thông báo cập nhật voucher cho Admin', { error: notiErr.message, id });
    }

    res.redirect(`/editVoucher/${id}?message=${encodeURIComponent('Cập nhật thành công')}`);
  } catch (error) {
    logger.error('Lỗi khi cập nhật voucher', { error: error.message, stack: error.stack, body: req.body });
    const redirectId = id || '';
    res.redirect(`/editVoucher/${redirectId}?message=${encodeURIComponent('Cập nhật thất bại')}`);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// API /////////////////////////////////////////////////

// ÁP DỤNG VOUCHER (API CHO KHÁCH HÀNG)
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
  applyVoucherAPI
};