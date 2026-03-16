import express from "express";
import fs from 'fs';
import path from 'path';
import userModel from '../models/userModel.js';

// Hàm xóa ảnh nếu cần
const deleteUserImage = (filename) => {
  if (!filename) return;
  try {
    const filePath = path.resolve(`images/useravatar/${filename}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Lỗi khi xóa ảnh: ${error.message}`);
  }
};

// tải trang thêm sản phẩm
const createUser = async (req, res) => {
  try {
    res.render('home', {
      data: {
        title: 'Create new User',
        page: 'addUser',
      }
    });
  } catch (err) {
    console.log(err)
  }
}

// thêm người dùng
const addUser = async (req, res) => {
  try {
    const { username, password, fullname, email, phone, address, sex, dateOfBirth, role } = req.body;
    const avatar = req.file?.filename || null;
    console.log(req.body);

    // Kiểm tra thông tin bắt buộc
    if (!username || !password) {
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
    console.error("Lỗi khi thêm người dùng:", error);
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
      console.error('Lỗi khi tải danh sách người dùng:', error);
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};


// Xóa người dùng
const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.body; // Lấy product_id từ request body
    const avatar = await userModel.deleteUser(user_id); // Gọi hàm xóa sản phẩm
    if (avatar) {
      deleteUserImage(avatar); // Xóa ảnh nếu có
    }
    res.redirect('/listuser?message=Xóa người dùng thành công');
  } catch (error) {
    console.error(error);
    res.redirect('/listuser?message=Xóa người dùng thất bại');
  }
};


//lấy chi tiết người dùng
const editUser = async (req, res) => {
  try {
    const { userid } = req.params; // Lấy user_id từ params
    const userDetail = await userModel.getUserById(userid); // Gọi hàm lấy chi tiết người dùng

    if (!userDetail) {
      return res.status(404).send("Người dùng không tồn tại.");
    }
    const message = req.query.message || '';
    res.render('home', {
      data: {
        title: 'Update User',
        page: 'updateUser',
        user: userDetail, // Truyền thông tin người dùng vào view
        message: message
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

//cập nhật người dùng
const updateUser = async (req, res) => {
  try {
    const { user_id, username, password, fullname, email, phone, address, sex, dateOfBirth, role, status, provider } = req.body;

    // Validate required fields
    if (!user_id || !username) {
      throw new Error("Thiếu thông tin bắt buộc: user_id hoặc username.");
    }

    // Retrieve the old user data
    const oldUser = await userModel.getUserById(user_id);
    if (!oldUser) {
      throw new Error("Người dùng không tồn tại.");
    }

    // Handle avatar upload
    let newAvatar = oldUser.avatar;
    if (req.file) {
      newAvatar = req.file.filename;
      if (oldUser.avatar && newAvatar !== oldUser.avatar) {
        deleteUserImage(oldUser.avatar); // Delete old avatar if a new one is uploaded
      }
    }

    // Hash password if it is updated
    let hashedPassword = oldUser.password;
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(password, salt);
    }

    // Update user
    const updatedUser = await userModel.updateUser(
      user_id,
      username,
      hashedPassword,
      fullname,
      address,
      sex,
      email,
      phone,
      newAvatar,
      status,
      dateOfBirth,
      role,
      provider
    );

    if (!updatedUser) {
      throw new Error("Cập nhật người dùng thất bại.");
    }

    res.redirect(`/edituser/${user_id}?message=Cập nhật thành công`);
  } catch (error) {
    console.error("Lỗi cập nhật người dùng:", error);
    // Delete new avatar if an error occurs
    if (req.file) {
      deleteUserImage(req.file.filename);
    }
    res.redirect(`/edituser/${req.body.user_id}?message=${encodeURIComponent(error.message)}`);
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