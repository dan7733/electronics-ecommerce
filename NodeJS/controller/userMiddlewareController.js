// user Middleware and login/logout and register
import express from "express";
import userModel from '../models/userModel.js';  // Import model để xử lý với CSDL hoặc logic nghiệp vụ
import dotenv from 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt  from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';


/////////////////Đăng nhập, Đăng xuất, xác thực người dùng, Đăng ký///////////////////////

// XỬ LÝ ĐĂNG NHẬP USer
// Xử lý đăng nhập và trả về refresh token
const userLoginAPI = async (req, res) => {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ message: 'Missing username or password' });
    }
  
    try {
      const user = await userModel.getUserByUsernameAPI(username);
      if (!user) {
        return res.status(409).json({ errCode: 1, message: 'Tài khoản và mật khẩu không đúng.' });
      }
  
      if (user.status !== 'active') {
        return res.status(403).json({ errCode: 2, message: 'Tài khoản đã bị khóa hoặc không hoạt động.' });
      }
  
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(409).json({ errCode: 1, message: 'Tài khoản và mật khẩu không đúng.' });
      }
  
      const payload = {
        userId: user.user_id,
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        avatar: user.avatar
      };
  
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });  // Token sống 15 phút
      const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }); // Refresh token sống 7 ngày
  
      // Gửi cả access token và refresh token về client
      res.cookie('jwt', refreshToken, { httpOnly: true, path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 }); // lưu refresh token trong cookie
      return res.status(200).json({ accessToken });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
  


  // Cải tiến route để làm mới access token
const refreshTokenAPI = (req, res) => {
    const token = req.cookies.jwt; // Lấy refresh token từ cookie
    if (!token) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập lại.' });
    }
  
    const decoded = verifyToken(token); // Giải mã refresh token
    if (!decoded) {
      return res.status(403).json({ message: 'Refresh token không hợp lệ, vui lòng đăng nhập lại.' });
    }
  
    const payload = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      fullname: decoded.fullname,
      avatar: decoded.avatar
    };
  
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });  // Tạo access token mới
    return res.json({ accessToken });
  };
  

//giải mã token
const verifyToken = (token) => {
    if (!token || token.split('.').length !== 3) {
        console.error('Invalid JWT format');
        return null;
    }
    const key = process.env.JWT_SECRET;
    try {
        return jwt.verify(token, key);
    } catch (err) {
        console.error('Error verifying JWT:', err);
        return null;
    }
};



// Xác thực Middleware
const userMiddlewareAPI = (req, res, next) => {
    const token = req.cookies.jwt; // Lấy token từ cookie
    if (!token) {
        return res.status(401).json({
            err: 0,
            message: 'Vui lòng đăng nhập để tiếp tục.'
        });
    }
    const decoded = verifyToken(token); // Giải mã token
    if (!decoded) {
        return res.status(403).json({
            err: 0,
            message: 'Token không hợp lệ, vui lòng đăng nhập lại.'
        });
    }
    req.user = decoded;
    // Nếu route có req.params.username thì kiểm tra quyền truy cập
    const usernameInUrl = req.params.username;
    if (usernameInUrl) {
        const tokenUsername = decoded.username;
        // Nếu không phải admin và không đúng user thì chặn
        if (decoded.role !== 'admin' && usernameInUrl !== tokenUsername) {
            return res.status(403).json({
                err: 0,
                message: 'Bạn chỉ có thể thao tác trên tài khoản của mình.'
            });
        }
    }
    next();
};

// lấy thông tin người dùng
const getAccountAPI = (req, res) => {
  try {
    const token = req.cookies.jwt;
    const decoded = verifyToken(token);
    if (decoded) {
      return res.status(200).json({
        errCode: 0,
        message: 'Thành công',
        data: {
          user: decoded.username,
          fullname: decoded.fullname,
          avatar: decoded.avatar,
        },
      });
    }
    return res.status(401).json({
      errCode: 1,
      message: 'Token không hợp lệ hoặc đã hết hạn',
    });
  } catch (error) {
    console.error('Lỗi khi lấy thông tin tài khoản:', error);
    return res.status(500).json({
      errCode: 1,
      message: 'Có lỗi xảy ra khi lấy thông tin tài khoản',
    });
  }
};


//đăng xuất
const userLogoutAPI = (req, res) => {
    res.clearCookie('jwt', {path: "/", httpOnly: true}); // Xóa cookie chứa token
    return res.status(200).json({
        errCode: 1,
        message: "Đăng xuất thành công.",
    });
};




//////////////////////////////xử lý thông tin người dùng/////////////////////////////////////////

// lấy toàn bộ thông tin người dùng
const getdetailUserbyUsernameAPI = async (req, res) => {
    let data = await userModel.getDetailUserByUsernameAPI(req.params.username);
    return res.status(200).json({
      errCode: 0,
      message: "Success",
      detailuser: data
    })
  }



// đăng ký người dùng
const addUserAPI = async (req, res) => {
  try {
    const { username, password, fullname, email, phone } = req.body;
    const avatar = req.file?.filename || null;

    if (!username || !password || !fullname || !email || !phone) {
      if (avatar) await deleteUserImage(avatar);
      return res.status(400).json({
        errCode: 1,
        message: 'Vui lòng điền đầy đủ: Tên đăng nhập, mật khẩu, họ tên, email và số điện thoại!',
        detailuser: null,
      });
    }

    await userModel.addPendingUserAPI(username, password, fullname, email, phone);

    if (avatar) await deleteUserImage(avatar);

    return res.status(200).json({
      errCode: 0,
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.',
      detailuser: { username, fullname, email, phone },
    });
  } catch (error) {
    console.error('Lỗi khi đăng ký người dùng:', error.message); // Chỉ in error.message
    if (req.file?.filename) await deleteUserImage(req.file.filename);

    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Có lỗi xảy ra khi đăng ký người dùng. Vui lòng thử lại sau.',
      detailuser: null,
    });
  }
};

const getEmailVerifyUserAPI = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.render('verifyEmail', {
        message: 'Token xác nhận không hợp lệ!',
      });
    }

    const user = await userModel.confirmUserAPI(token);

    return res.render('verifyEmail', {
      message: 'Xác nhận email thành công! Bạn có thể đăng nhập.',
    });
  } catch (error) {
    console.error('Lỗi khi xác nhận email:', error.message);
    return res.render('verifyEmail', {
      message: error.message || 'Có lỗi xảy ra khi xác nhận email. Vui lòng thử lại.',
    });
  }
};

// đăng nhập google và đăng ký google luôn
const addGoogleUserAPI = async (req, res) => {
  try {
    const { googleId, email, fullname } = req.body;
    console.log('Request body:', req.body);

    if (!googleId || !email) {
      return res.status(400).json({
        errCode: 1,
        message: 'Google ID và email là bắt buộc!',
        detailuser: null,
      });
    }

    const result = await userModel.addGoogleUserAPI(googleId, email, fullname);
    if (!result) {
      return res.status(400).json({
        errCode: 1,
        message: 'Thêm/cập nhật người dùng thất bại, vui lòng thử lại.',
        detailuser: null,
      });
    }

    // Tạo payload cho JWT
    const payload = {
      userId: result.user_id,
      username: result.username,
      role: result.role || 0,
      fullname: result.fullname,
      avatar: result.avatar,
    };

    // Tạo refresh token
    const refreshToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Thiết lập cookie jwt
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Tạo access token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    return res.status(200).json({
      errCode: 0,
      message: 'Thêm/cập nhật người dùng thành công!',
      detailuser: result,
      accessToken,
    });
  } catch (error) {
    console.error('Lỗi khi thêm/cập nhật người dùng:', error);
    return res.status(400).json({
      errCode: 1,
      message: error.message || 'Có lỗi xảy ra khi xử lý người dùng. Vui lòng thử lại sau.',
      detailuser: null,
    });
  }
};




// xóa ảnh
const deleteUserImage = (filename) => {
  if (!filename) return;
  try {
    const filePath = path.resolve(`images/useravatar/${filename}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Lỗi khi xóa ảnh: ${error.message}`);
  }
};


// Cập nhật người dùng
const updateUserAPI = async (req, res) => {
  try {
      const {
          username,
          fullname,
          email,
          phone,
          address,
          sex,
          dateOfBirth,
          role,
          status,
          provider,
      } = req.body;

      // Validate required fields
      if (!username) {
          throw new Error("Thiếu thông tin bắt buộc: username.");
      }

      // Retrieve the old user data
      const oldUser = await userModel.getUserByUsername(username);
      if (!oldUser) {
          throw new Error("Người dùng không tồn tại.");
      }

      // Handle avatar upload
      let newAvatar = oldUser.avatar;
      if (req.file) {
          newAvatar = req.file.filename;
          if (oldUser.avatar && newAvatar !== oldUser.avatar) {
              await deleteUserImage(oldUser.avatar);
          }
      }

      // Prepare update fields
      const updateFields = {
          username,
          fullname: fullname || oldUser.fullname,
          email: email || oldUser.email,
          phone: phone || oldUser.phone,
          address: address || oldUser.address,
          sex: sex || oldUser.sex,
          dateOfBirth: dateOfBirth || oldUser.dateOfBirth,
          role: role !== undefined ? role : oldUser.role,
          status: status || oldUser.status,
          provider: provider || oldUser.provider,
          avatar: newAvatar,
      };

      // Update user
      const updatedUser = await userModel.updateUserAPI(username, updateFields);

      return res.status(200).json({
          errCode: 0,
          message: "Cập nhật người dùng thành công.",
          detailuser: updatedUser,
      });
  } catch (error) {
      console.error("Lỗi cập nhật người dùng:", error);
      if (req.file) {
          await deleteUserImage(req.file.filename);
      }
      return res.status(400).json({
          errCode: 1,
          message: error.message || 'Có lỗi xảy ra khi xử lý người dùng. Vui lòng thử lại sau.',
          detailuser: null,
      });
  }
};

// đổi mật khẩu
const changePasswordAPI = async (req, res) => {
  try {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      const username = req.user.username; // Lấy username từ middleware (đã xác thực)

      // Validate input
      if (!newPassword || !confirmPassword) {
          return res.status(400).json({
              errCode: 1,
              message: 'Vui lòng cung cấp mật khẩu mới và xác nhận mật khẩu!',
          });
      }

      if (newPassword !== confirmPassword) {
          return res.status(400).json({
              errCode: 1,
              message: 'Mật khẩu mới và xác nhận mật khẩu không khớp!',
          });
      }

      // Kiểm tra độ dài mật khẩu mới
      if (newPassword.length < 6) {
          return res.status(400).json({
              errCode: 1,
              message: 'Mật khẩu mới phải có ít nhất 6 ký tự!',
          });
      }

      // Lấy thông tin người dùng
      const user = await userModel.getUserByUsernameAPI(username);
      if (!user) {
          return res.status(404).json({
              errCode: 1,
              message: 'Người dùng không tồn tại!',
          });
      }

      // Nếu không phải người dùng Google, yêu cầu mật khẩu cũ
      if (user.password !== 'google-auth' && !oldPassword) {
          return res.status(400).json({
              errCode: 1,
              message: 'Vui lòng cung cấp mật khẩu cũ!',
          });
      }

      // Gọi model để đổi mật khẩu
      const result = await userModel.changePasswordAPI(username, oldPassword, newPassword);

      return res.status(200).json({
          errCode: 0,
          message: result.message,
      });
  } catch (error) {
      console.error('Lỗi khi đổi mật khẩu:', error.message);
      return res.status(400).json({
          errCode: 1,
          message: error.message || 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại sau.',
      });
  }
};

// đặt lại mật khẩu
const requestPasswordResetAPI = async (req, res) => {
  try {
      const { usernameOrEmail } = req.body;

      if (!usernameOrEmail) {
          return res.status(400).json({
              errCode: 1,
              message: 'Vui lòng cung cấp username hoặc email!',
          });
      }

      const result = await userModel.requestPasswordResetAPI(usernameOrEmail);

      return res.status(200).json({
          errCode: 0,
          message: result.message,
      });
  } catch (error) {
      console.error('Lỗi khi yêu cầu đặt lại mật khẩu:', error.message);
      return res.status(400).json({
          errCode: 1,
          message: error.message || 'Có lỗi xảy ra khi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.',
      });
  }
};

// GET: Render password reset form
const getResetPasswordAPI = async (req, res) => {
  try {
      const { token } = req.query;

      if (!token) {
          return res.render('resetPassword', {
              errorMessage: 'Liên kết không hợp lệ. Vui lòng thử lại!',
              successMessage: null,
              token: null,
          });
      }

      // Verify token using userModel function
      await userModel.verifyResetTokenAPI(token);

      return res.render('resetPassword', {
          errorMessage: null,
          successMessage: null,
          token,
      });
  } catch (error) {
      console.error('Lỗi khi hiển thị form đặt lại mật khẩu:', error.message);
      return res.render('resetPassword', {
          errorMessage: error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau!',
          successMessage: null,
          token: null,
      });
  }
};

// POST: Handle password reset form submission
const resetPasswordAPI = async (req, res) => {
  try {
      const { token, newPassword, confirmPassword } = req.body;

      if (!token || !newPassword || !confirmPassword) {
          return res.render('resetPassword', {
              errorMessage: 'Vui lòng cung cấp token, mật khẩu mới và xác nhận mật khẩu!',
              successMessage: null,
              token,
          });
      }

      if (newPassword !== confirmPassword) {
          return res.render('resetPassword', {
              errorMessage: 'Mật khẩu mới và xác nhận mật khẩu không khớp!',
              successMessage: null,
              token,
          });
      }

      if (newPassword.length < 6) {
          return res.render('resetPassword', {
              errorMessage: 'Mật khẩu mới phải có ít nhất 6 ký tự!',
              successMessage: null,
              token,
          });
      }

      const result = await userModel.resetPasswordAPI(token, newPassword);

      return res.render('resetPassword', {
          errorMessage: null,
          successMessage: result.message,
          token: null,
      });
  } catch (error) {
      console.error('Lỗi khi đặt lại mật khẩu:', error.message);
      return res.render('resetPassword', {
          errorMessage: error.message || 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau!',
          successMessage: null,
          token: req.body.token || null,
      });
  }
};


export default {
    userMiddlewareAPI,
    userLoginAPI,
    getAccountAPI,
    getdetailUserbyUsernameAPI,
    userLogoutAPI,
    refreshTokenAPI,
    addUserAPI,
    getEmailVerifyUserAPI,
    addGoogleUserAPI,
    updateUserAPI,
    changePasswordAPI,
    requestPasswordResetAPI,
    resetPasswordAPI,
    getResetPasswordAPI
}