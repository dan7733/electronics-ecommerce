// admin middlewareController and login
import express from "express";
import userModel from '../models/userModel.js';  // Import model để xử lý với CSDL hoặc logic nghiệp vụ
import dotenv from 'dotenv/config';
import bcrypt from 'bcryptjs';

const adminSessionMiddleware = (req, res, next) => {
    // Gán thông tin session vào res.locals
    res.locals.session = req.session;
    next();
};

const getLoginPage = (req, res) => {
    return res.render("login", { data: { title: 'Login page', page: "login", content: 'Đây là Đăng nhập' } });
};

const adminLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        console.log(username)
        const user = await userModel.getUserByUsername(username);
        // Kiểm tra tài khoản có tồn tại không
        if (!user) {
            return res.render('login', {
                title: 'Login',
                data: { page: 'login', error: 'Tên người dùng hoặc mật khẩu không đúng.' }
            });
        }
        // kỉểm tra tài khoản có bị khóa không
        if (user.status !== 'active') {
            return res.render('login', {
                title: 'Login',
                data: { page: 'login', error: 'Tài khoản đã bị khóa hoặc không hoạt động.' }
            });
        }
        // So sánh mật khẩu
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', {
                title: 'Login',
                data: { page: 'login', error: 'Tên người dùng hoặc mật khẩu không đúng.' }
            });
        }
        // Chỉ lưu các thông tin cần thiết vào session
        await userModel.updateLastLogin(user.user_id);
        req.session.user = {
            user_id: user.user_id, 
            username: user.username,   // Giả sử username có trong user
            fullname: user.fullname,     // Giả sử fullname có trong user
            role: user.role,
            avatar: user.avatar
        };
        res.redirect('/'); // Chuyển hướng về trang chính
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Internal Server Error');
    }
};

const adminLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect('/'); // Quay về trang chính nếu có lỗi
        }
        res.clearCookie('connect.sid'); // Xóa cookie phiên
        res.redirect('/login');
    });
};

// Middleware kiểm tra quyền admin
const adminMiddleware = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role !== 1) {
        return res.status(403).send('Access denied');
    }
    next();
};


// 404 Not Found
const adminNotFound = (req, res) => {
    return res.render('page404', {
        data: {
            title: '404 Not Found',
            page: 'page404',
            content: 'Trang không tồn tại hoặc bạn không có quyền truy cập!'
        }
    });
};




export default { 
    adminSessionMiddleware, 
    getLoginPage, 
    adminLogout, 
    adminMiddleware, 
    adminLogin,
    adminNotFound
};
