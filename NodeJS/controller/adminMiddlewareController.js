// admin middlewareController and login
import express from "express";
import userModel from '../models/userModel.js';  // Import model để xử lý với CSDL hoặc logic nghiệp vụ
import dotenv from 'dotenv/config';
import bcrypt from 'bcryptjs';
import logger from '../configs/logger.js'; // Import custom logger

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
        logger.info('Login attempt', { username });

        const user = await userModel.getUserByUsername(username);
        
        // Kiểm tra tài khoản có tồn tại không
        if (!user) {
            logger.warn('Login failed: User not found', { username });
            return res.render('login', {
                title: 'Login',
                data: { page: 'login', error: 'Tên người dùng hoặc mật khẩu không đúng.' }
            });
        }
        
        // kỉểm tra tài khoản có bị khóa không
        if (user.status !== 'active') {
            logger.warn('Login failed: Account locked or inactive', { username, status: user.status });
            return res.render('login', {
                title: 'Login',
                data: { page: 'login', error: 'Tài khoản đã bị khóa hoặc không hoạt động.' }
            });
        }
        
        // So sánh mật khẩu
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logger.warn('Login failed: Incorrect password', { username });
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
        
        logger.info('Login successful', { username, userId: user.user_id, role: user.role });
        res.redirect('/'); // Chuyển hướng về trang chính
    } catch (error) {
        logger.error('Login error', { error: error.message, stack: error.stack, username });
        res.status(500).send('Internal Server Error');
    }
};

const adminLogout = (req, res) => {
    const username = req.session?.user?.username || 'unknown';
    
    req.session.destroy(err => {
        if (err) {
            logger.error('Error destroying session', { error: err.message, stack: err.stack, username });
            return res.redirect('/'); // Quay về trang chính nếu có lỗi
        }
        
        logger.info('Logout successful', { username });
        res.clearCookie('connect.sid'); // Xóa cookie phiên
        res.redirect('/login');
    });
};

// Middleware kiểm tra quyền admin
const adminMiddleware = (req, res, next) => {
    if (!req.session.user) {
        logger.warn('Unauthorized access attempt: No session found', { path: req.originalUrl });
        return res.redirect('/login');
    }
    
    if (req.session.user.role !== 1) {
        logger.warn('Forbidden access attempt: Not an admin', { 
            username: req.session.user.username, 
            role: req.session.user.role,
            path: req.originalUrl 
        });
        return res.status(403).send('Access denied');
    }
    
    next();
};

// 404 Not Found
const adminNotFound = (req, res) => {
    const username = req.session?.user?.username || 'guest';
    logger.warn('404 Not Found accessed', { url: req.originalUrl, username });
    
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