import express from "express";
import voucherModel from '../models/voucherModel.js';

// Tải trang thêm voucher
const createVoucher = async (req, res) => {
  return res.render('home', {
    data: {
      title: 'Thêm Voucher',
      page: 'addVoucher',
    }
  });
};

// Thêm voucher mới
const addVoucher = async (req, res) => {
  try {
    const { voucher, value, end_at } = req.body;
    const result = await voucherModel.addVoucher(voucher, value, end_at);
    res.render("home", {
      data: {
        page: 'addVoucher',
        message: result ? "Thêm voucher thành công!" : "Thêm voucher thất bại, vui lòng thử lại."
      }
    });
  } catch (error) {
    console.error('Lỗi khi thêm voucher:', error);
    res.status(500).send('Có lỗi xảy ra khi thêm voucher.');
  }
};

// Danh sách vouchers có phân trang, tìm kiếm
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
      console.error('Lỗi khi tải danh sách vouchers:', error);
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};


// Xóa voucher
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.body;
    await voucherModel.deleteVoucher(id);
    res.redirect('/listVoucher?message=Xóa thành công');
  } catch (error) {
    console.error('Lỗi khi xóa voucher:', error);
    res.redirect('/listVoucher?message=Xóa thất bại');
  }
};

// Tải trang cập nhật voucher
const editVoucher = async (req, res) => {
  const { id } = req.params;
  const voucher = await voucherModel.getVoucherById(id);
  return res.render('home', {
    data: {
      title: 'Cập nhật Voucher',
      page: 'updateVoucher',
      voucher: voucher,
      message: req.query.message || ''
    }
  });
};

// Cập nhật voucher
const updateVoucher = async (req, res) => {
  try {
    const { id, voucherCode, value, end_at } = req.body;
    await voucherModel.updateVoucher(id, voucherCode, value, end_at);
    res.redirect(`/editVoucher/${id}?message=Cập nhật thành công`);
  } catch (error) {
    console.error('Lỗi khi cập nhật voucher:', error);
    res.redirect(`/editVoucher/${id}?message=Cập nhật thất bại`);
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
    const voucher = await voucherModel.applyVoucherAPI(voucherCode);

    if (!voucher) {
      return res.status(200).json({
        errCode: 1,
        message: 'Voucher không tồn tại hoặc đã hết hạn',
        value: null
      });
    }

    return res.status(200).json({
      errCode: 0,
      message: 'Success',
      value: voucher.value
    });
  } catch (error) {
    console.error('Lỗi khi áp dụng voucher:', error);
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
