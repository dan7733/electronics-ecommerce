import express from "express";
import fs from 'fs';
import path from 'path';
import userModel from '../models/userModel.js';
import logger from '../configs/logger.js'; // Import custom logger
import bcrypt from 'bcryptjs'; // Import bcryptjs lên đầu file để tránh lỗi require trong ES Modules

// Hàm xóa ảnh nếu cần
const deleteUserImage = (filename) => {
  if (!filename) return;
  try {
    const filePath = path.resolve(`images/useravatar/${filename}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('Đã xóa ảnh người dùng', { filename });
    }
  } catch (error) {
    logger.error('Lỗi khi xóa ảnh người dùng', { error: error.message, filename });
  }
};

// tải trang thêm sản phẩm (người dùng)
const createUser = async (req, res) => {
  try {
    res.render('home', {
      data: {
        title: 'Create new User',
        page: 'addUser',
      }
    });
  } catch (err) {
    logger.error('Lỗi khi tải trang thêm người dùng', { error: err.message, stack: err.stack });
  }
}

// thêm người dùng
const addUser = async (req, res) => {
  try {
    const { username, password, fullname, email, phone, address, sex, dateOfBirth, role } = req.body;
    const avatar = req.file?.filename || null;
    
    logger.info('Yêu cầu thêm người dùng', { username, email, role });

    // Kiểm tra thông tin bắt buộc
    if (!username || !password) {
      logger.warn('Thêm người dùng thất bại: Thiếu tên đăng nhập hoặc mật khẩu', { username });
      if (avatar) deleteUserImage(avatar); // Xoá avatar nếu có mà dữ liệu sai
      return res.render("addUser", {
        data: { message: "Tên đăng nhập và mật khẩu không được để trống!" }
      });
    }

    // Gọi tới model để thêm user
    const result = await userModel.addUser(
      username,
      password,
      fullname,
      email,
      phone,
      address,
      sex,
      dateOfBirth,
      avatar,
      role
    );

    if (result) {
      logger.info('Thêm người dùng thành công', { username });
    } else {
      logger.warn('Thêm người dùng thất bại tại Model', { username });
    }

    const message = result
      ? "Thêm người dùng thành công!"
      : "Thêm người dùng thất bại, vui lòng thử lại.";

    // Nếu thất bại, xoá avatar
    if (!result && avatar) deleteUserImage(avatar);

    res.render('home', {
      data: {
        title: 'Create new User',
        page: 'addUser',
        message: message
      }
    });

  } catch (error) {
    logger.error("Lỗi khi thêm người dùng", { error: error.message, stack: error.stack, body: req.body });
    if (req.file?.filename) deleteUserImage(req.file.filename);

    // Truyền thông báo lỗi chi tiết cho người dùng
    res.render('home', {
      data: {
        title: 'Create new User',
        page: 'addUser',
        message: 'Có lỗi xảy ra khi thêm người dùng. Vui lòng thử lại sau.'
      }
    });
  }
};


// danh sách người dùng
const listUser = async (req, res) => {
  try {
      // Lấy trang hiện tại từ query string, mặc định là 1
      const page = parseInt(req.query.page) || 1;
      const limit = 5; // Số lượng người dùng trên mỗi trang
      const offset = (page - 1) * limit;

      // Từ khóa tìm kiếm theo fullname
      const searchKeyword = req.query.search || '';

      // Tùy chọn sắp xếp theo role
      const sortOption = req.query.sort || 'default';

      // Đếm tổng số người dùng phù hợp
      const totalUsers = await userModel.countUser(searchKeyword);

      // Tính tổng số trang
      const totalPages = Math.ceil(totalUsers / limit);

      // Lấy danh sách người dùng
      const listUsers = await userModel.listUser(offset, limit, searchKeyword, sortOption);

      // Message (nếu có) từ query string
      const message = req.query.message || '';

      // Render ra view (giả sử dùng view 'listUser')
      res.render('home', {
          data: {
              title: 'List Users',
              page: 'listUser',
              rows: listUsers, // Danh sách người dùng
              currentPage: page,
              totalPages: totalPages,
              message: message,
              search: searchKeyword,
              sort: sortOption
          }
      });
  } catch (error) {
      logger.error('Lỗi khi tải danh sách người dùng', { error: error.message, stack: error.stack, query: req.query });
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};


// Xóa người dùng
const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.body; 
    const currentUserId = req.session.user.user_id; // Lấy ID của Admin đang thao tác

    // CHẶN: Nếu ID gửi lên đòi xóa trùng với ID đang đăng nhập
    if (parseInt(user_id) === currentUserId) {
        logger.warn('Từ chối thao tác: Cố gắng tự xóa tài khoản của chính mình', { user_id, currentUserId });
        return res.redirect('/listuser?message=' + encodeURIComponent('Hành động bị từ chối: Không thể tự xóa tài khoản của chính mình!'));
    }

    const avatar = await userModel.deleteUser(user_id); 

    if (avatar) {
      deleteUserImage(avatar); 
    }
    
    logger.info('Xóa người dùng thành công', { deletedUserId: user_id, actionBy: currentUserId });
    res.redirect('/listuser?message=Xóa người dùng thành công');
  } catch (error) {
    logger.error('Lỗi khi xóa người dùng', { error: error.message, stack: error.stack, body: req.body });
    const errorMessage = error.message || 'Xóa người dùng thất bại';
    res.redirect(`/listuser?message=${encodeURIComponent(errorMessage)}`);
  }
};


// lấy chi tiết người dùng
const editUser = async (req, res) => {
  const { userid } = req.params; 
  try {
    const userDetail = await userModel.getUserById(userid); 

    if (!userDetail) {
      logger.warn('Lấy chi tiết người dùng thất bại: Không tồn tại', { userid });
      return res.status(404).send("Người dùng không tồn tại.");
    }
    // chặn xóa tài khoản hệ thống
    if (userDetail.username === 'test') {
        logger.warn('Từ chối thao tác: Cố gắng xem/sửa tài khoản hệ thống', { userid, actionBy: req.session?.user?.user_id });
        return res.redirect('/listuser?message=' + encodeURIComponent('Hành động bị từ chối: Không thể xem hoặc sửa tài khoản hệ thống!'));
    }

    const message = req.query.message || '';
    res.render('home', {
      data: {
        title: 'Update User',
        page: 'updateUser',
        user: userDetail,
        message: message
      }
    });
  } catch (error) {
    logger.error('Lỗi khi tải chi tiết người dùng', { error: error.message, stack: error.stack, userid });
    res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

// cập nhật người dùng
const updateUser = async (req, res) => {
  try {
    const { user_id, username, password, fullname, email, phone, address, sex, dateOfBirth, role, status, provider } = req.body;

    if (!user_id || !username) {
      logger.warn('Cập nhật người dùng thất bại: Thiếu thông tin bắt buộc', { body: req.body });
      throw new Error("Thiếu thông tin bắt buộc: user_id hoặc username.");
    }

    const oldUser = await userModel.getUserById(user_id);
    if (!oldUser) {
      logger.warn('Cập nhật người dùng thất bại: Người dùng không tồn tại', { user_id });
      throw new Error("Người dùng không tồn tại.");
    }

    // chặn sửa tk hệ thống
    if (oldUser.username === 'test') {
        logger.warn('Từ chối thao tác: Cố gắng sửa tài khoản hệ thống', { user_id, actionBy: req.session?.user?.user_id });
        throw new Error("Hành động bị từ chối: Không thể sửa tài khoản hệ thống!");
    }

    // Handle avatar upload
    let newAvatar = oldUser.avatar;
    if (req.file) {
      newAvatar = req.file.filename;
      if (oldUser.avatar && newAvatar !== oldUser.avatar) {
        deleteUserImage(oldUser.avatar); 
      }
    }

    // Hash password if it is updated (sử dụng bcrypt đã import ở đầu file)
    let hashedPassword = oldUser.password;
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(password, salt);
    }

    // Update user
    const updatedUser = await userModel.updateUser(
      user_id, username, hashedPassword, fullname, address, sex, 
      email, phone, newAvatar, status, dateOfBirth, role, provider
    );

    if (!updatedUser) {
      logger.warn('Cập nhật người dùng thất bại tại Model', { user_id });
      throw new Error("Cập nhật người dùng thất bại.");
    }

    logger.info('Cập nhật người dùng thành công', { user_id, username });
    res.redirect(`/edituser/${user_id}?message=Cập nhật thành công`);
  } catch (error) {
    logger.error("Lỗi cập nhật người dùng", { error: error.message, stack: error.stack, body: req.body });
    if (req.file) {
      deleteUserImage(req.file.filename);
    }
    res.redirect(`/edituser/${req.body.user_id || ''}?message=${encodeURIComponent(error.message)}`);
  }
};

export default {
    createUser,
    addUser,
    listUser,
    deleteUser,
    editUser,
    updateUser
  };