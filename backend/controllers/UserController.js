import express from "express";
import fs from 'fs';
import path from 'path';
import userModel from '../models/userModel.js';
import notificationModel from '../models/notificationModel.js'; // 🔔 Import Model Thông báo
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

// Tải trang thêm người dùng
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
};

// THÊM NGƯỜI DÙNG (GỬI THÔNG BÁO CHO USER & ADMIN)
const addUser = async (req, res) => {
  try {
    const { username, password, fullname, email, phone, address, sex, dateOfBirth, role } = req.body;
    const avatar = req.file?.filename || null;
    
    logger.info('Yêu cầu thêm người dùng', { username, email, role });

    // Kiểm tra thông tin bắt buộc
    if (!username || !password) {
      logger.warn('Thêm người dùng thất bại: Thiếu tên đăng nhập hoặc mật khẩu', { username });
      if (avatar) deleteUserImage(avatar);
      return res.render("home", {
        data: { 
          title: 'Create new User',
          page: 'addUser',
          message: "Tên đăng nhập và mật khẩu không được để trống!" 
        }
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

      const newUserId = result.user_id || result.id || null;

      // 🔔 1. THÔNG BÁO DÀNH CHO USER MỚI (KÍCH HOẠT TÀI KHOẢN)
      if (newUserId) {
        try {
          await notificationModel.createNotification({
            user_id: newUserId,
            title: 'Tài khoản mới đã được tạo',
            message: `Chào mừng bạn đến với ESHOP! Tài khoản "${username}" của bạn vừa được quản trị viên tạo thành công.`,
            type: 'account',
            created_by: 'admin',
            link: '/account-settings'
          });
        } catch (notiErr) {
          logger.error('Lỗi khi gửi thông báo chào mừng cho User', { error: notiErr.message, username });
        }
      }

      // 🔔 2. THÔNG BÁO HỆ THỐNG DÀNH CHO ADMIN (GHI NHẬT KÝ)
      try {
        await notificationModel.createNotification({
          user_id: null, // null = gửi cho Admin
          title: 'Thêm người dùng mới',
          message: `Admin vừa thêm người dùng mới "${username}" (Email: ${email || 'N/A'}, Vai trò: ${role || 'user'}).`,
          type: 'system',
          created_by: 'admin',
          link: '/listuser'
        });
      } catch (notiErr) {
        logger.error('Lỗi khi gửi thông báo thêm user cho Admin', { error: notiErr.message, username });
      }

    } else {
      logger.warn('Thêm người dùng thất bại tại Model', { username });
      if (avatar) deleteUserImage(avatar);
    }

    const message = result
      ? "Thêm người dùng thành công!"
      : "Thêm người dùng thất bại, vui lòng thử lại.";

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

    res.render('home', {
      data: {
        title: 'Create new User',
        page: 'addUser',
        message: 'Có lỗi xảy ra khi thêm người dùng. Vui lòng thử lại sau.'
      }
    });
  }
};

// Danh sách người dùng
const listUser = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const offset = (page - 1) * limit;

      const searchKeyword = req.query.search || '';
      const sortOption = req.query.sort || 'default';

      const totalUsers = await userModel.countUser(searchKeyword);
      const totalPages = Math.ceil(totalUsers / limit);
      const listUsers = await userModel.listUser(offset, limit, searchKeyword, sortOption);
      const message = req.query.message || '';

      res.render('home', {
          data: {
              title: 'List Users',
              page: 'listUser',
              rows: listUsers,
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

// XÓA NGƯỜI DÙNG (GỬI THÔNG BÁO CHO ADMIN)
const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.body; 
    const currentUserId = req.session?.user?.user_id || null; // Lấy ID của Admin đang thao tác

    // CHẶN: Nếu ID gửi lên đòi xóa trùng với ID đang đăng nhập
    if (currentUserId && parseInt(user_id) === parseInt(currentUserId)) {
        logger.warn('Từ chối thao tác: Cố gắng tự xóa tài khoản của chính mình', { user_id, currentUserId });
        return res.redirect('/listuser?message=' + encodeURIComponent('Hành động bị từ chối: Không thể tự xóa tài khoản của chính mình!'));
    }

    const avatar = await userModel.deleteUser(user_id); 

    if (avatar) {
      deleteUserImage(avatar); 
    }

    // 🔔 THÔNG BÁO HỆ THỐNG DÀNH CHO ADMIN (GHI NHẬT KÝ XÓA TÀI KHOẢN)
    try {
      await notificationModel.createNotification({
        user_id: null, // null = gửi cho Admin
        title: 'Xóa tài khoản người dùng',
        message: `Admin (ID: #${currentUserId || 'N/A'}) đã xóa tài khoản người dùng ID #${user_id} khỏi hệ thống.`,
        type: 'system',
        created_by: 'admin',
        link: '/listuser'
      });
    } catch (notiErr) {
      logger.error('Lỗi khi gửi thông báo xóa user cho Admin', { error: notiErr.message, user_id });
    }
    
    logger.info('Xóa người dùng thành công', { deletedUserId: user_id, actionBy: currentUserId });
    res.redirect('/listuser?message=' + encodeURIComponent('Xóa người dùng thành công'));
  } catch (error) {
    logger.error('Lỗi khi xóa người dùng', { error: error.message, stack: error.stack, body: req.body });
    const errorMessage = error.message || 'Xóa người dùng thất bại';
    res.redirect(`/listuser?message=${encodeURIComponent(errorMessage)}`);
  }
};

// Lấy chi tiết người dùng
const editUser = async (req, res) => {
  const { userid } = req.params; 
  try {
    const userDetail = await userModel.getUserById(userid); 

    if (!userDetail) {
      logger.warn('Lấy chi tiết người dùng thất bại: Không tồn tại', { userid });
      return res.status(404).send("Người dùng không tồn tại.");
    }
    
    // Chặn xem/sửa tài khoản hệ thống
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

// CẬP NHẬT NGƯỜI DÙNG (GỬI THÔNG BÁO CHO USER & ADMIN)
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

    // Chặn sửa tài khoản hệ thống
    if (oldUser.username === 'test') {
        logger.warn('Từ chối thao tác: Cố gắng sửa tài khoản hệ thống', { user_id, actionBy: req.session?.user?.user_id });
        throw new Error("Hành động bị từ chối: Không thể sửa tài khoản hệ thống!");
    }

    // Xử lý Upload Avatar
    let newAvatar = oldUser.avatar;
    if (req.file) {
      newAvatar = req.file.filename;
      if (oldUser.avatar && newAvatar !== oldUser.avatar) {
        deleteUserImage(oldUser.avatar); 
      }
    }

    // Kiểm tra & mã hóa mật khẩu nếu có thay đổi
    let hashedPassword = oldUser.password;
    let isPasswordUpdated = false;

    if (password) {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(password, salt);
      isPasswordUpdated = true;
    }

    // Cập nhật thông tin trong Database
    const updatedUser = await userModel.updateUser(
      user_id, username, hashedPassword, fullname, address, sex, 
      email, phone, newAvatar, status, dateOfBirth, role, provider
    );

    if (!updatedUser) {
      logger.warn('Cập nhật người dùng thất bại tại Model', { user_id });
      throw new Error("Cập nhật người dùng thất bại.");
    }

    // 🔔 1. THÔNG BÁO BẢO MẬT GỬI CHO KHÁCH HÀNG (USER)
    try {
      const notiTitle = isPasswordUpdated ? 'Mật khẩu đã được thay đổi' : 'Thông tin tài khoản đã được cập nhật';
      const notiMsg = isPasswordUpdated
        ? 'Mật khẩu tài khoản của bạn vừa được cập nhật thành công. Nếu không phải bạn thao tác, hãy liên hệ ngay với bộ phận hỗ trợ.'
        : 'Thông tin cá nhân trong tài khoản của bạn vừa được cập nhật thành công.';

      await notificationModel.createNotification({
        user_id: user_id,
        title: notiTitle,
        message: notiMsg,
        type: 'account',
        created_by: 'admin',
        link: '/account-settings'
      });
    } catch (notiErr) {
      logger.error('Lỗi khi gửi thông báo cập nhật tài khoản cho User', { error: notiErr.message, user_id });
    }

    // 🔔 2. THÔNG BÁO HỆ THỐNG GỬI CHO ADMIN (GHI NHẬT KÝ)
    try {
      await notificationModel.createNotification({
        user_id: null, // null = gửi cho Admin
        title: 'Cập nhật tài khoản người dùng',
        message: `Admin đã cập nhật thông tin tài khoản "${username}" (ID: #${user_id}).`,
        type: 'system',
        created_by: 'admin',
        link: `/edituser/${user_id}`
      });
    } catch (notiErr) {
      logger.error('Lỗi khi gửi thông báo cập nhật user cho Admin', { error: notiErr.message, user_id });
    }

    logger.info('Cập nhật người dùng thành công', { user_id, username });
    res.redirect(`/edituser/${user_id}?message=${encodeURIComponent('Cập nhật thành công')}`);
  } catch (error) {
    logger.error("Lỗi cập nhật người dùng", { error: error.message, stack: error.stack, body: req.body });
    if (req.file) {
      deleteUserImage(req.file.filename);
    }
    const redirectId = req.body.user_id || '';
    res.redirect(`/edituser/${redirectId}?message=${encodeURIComponent(error.message)}`);
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