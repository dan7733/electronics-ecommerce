import express from 'express';
import bcrypt from 'bcryptjs';
import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import logger from '../configs/logger.js'; // Import custom logger
import { PendingUsers } from './PendingUserModel.js';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail, sendPasswordResetEmail } from '../configs/email.js';

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    sex: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active'
    },
    dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    role: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    provider: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'local'
    },
    resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    resetTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    timestamps: true,
    tableName: 'users'
});

// Lấy username đăng nhập
const getUserByUsername = async (username) => {
    try {
        const user = await User.findOne({
            where: { username },
            attributes: ['user_id', 'username', 'password', 'fullname', 'role', 'avatar', 'status']
        });
        return user;
    } catch (error) {
        logger.error(`Lỗi khi lấy user với username: ${username}`, { error: error.message, stack: error.stack });
        return null;
    }
};

// Cập nhật đăng nhập lần cuối
const updateLastLogin = async (userId) => {
    try {
        await User.update(
            { lastLogin: new Date() },
            { where: { user_id: userId } }
        );
    } catch (error) {
        logger.error('Error updating last login', { error: error.message, stack: error.stack, userId });
    }
};

// Thêm người dùng
const addUser = async (
    username, password,
    fullname = null, email = null, phone = null,
    address = null, sex = null, dateOfBirth = null, avatar = null, role = 0
) => {
    try {
        if (!username || !password) {
            throw new Error(`Username và password là bắt buộc! ${username} ${password}`);
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    ...(email ? [{ email }] : []),
                    ...(phone ? [{ phone }] : []),
                ],
            },
        });

        if (existingUser) {
            throw new Error('Username/Email/Phone đã được sử dụng!');
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            password: hashedPassword,
            fullname,
            email,
            phone,
            address,
            sex,
            dateOfBirth,
            avatar,
            provider: 'local',
            role,
        });

        logger.info('User created with ID:', { userId: newUser.user_id });
        return newUser;
    } catch (error) {
        logger.error("Lỗi khi thêm người dùng", { error: error.message, stack: error.stack, username });
        throw error;
    }
};

// Danh sách người dùng
const listUser = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['user_id', 'username', 'fullname', 'email', 'phone', 'status']
        };

        if (searchKeyword) {
            queryOptions.where.fullname = { [Op.like]: `%${searchKeyword}%` };
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        if (sortOption === 'role_asc') {
            queryOptions.order = [['role', 'ASC']];
        } else if (sortOption === 'role_desc') {
            queryOptions.order = [['role', 'DESC']];
        } else {
            queryOptions.order = [['user_id', 'DESC']];
        }

        const users = await User.findAll(queryOptions);
        return users;
    } catch (error) {
        logger.error('Lỗi khi tải danh sách người dùng', { error: error.message, stack: error.stack });
        throw error;
    }
};

// Đếm người dùng
const countUser = async (searchKeyword = '') => {
    try {
        const queryOptions = {
            where: {}
        };

        if (searchKeyword) {
            queryOptions.where.fullname = { [Op.like]: `%${searchKeyword}%` };
        }

        const total = await User.count(queryOptions);
        return total;
    } catch (error) {
        logger.error('Lỗi khi đếm người dùng', { error: error.message, stack: error.stack });
        throw error;
    }
};

// Xóa người dùng
const deleteUser = async (idUser) => {
    try {
        const user = await User.findOne({
            where: { user_id: idUser },
            attributes: ['username', 'avatar'] 
        });

        if (!user) {
            return null;
        }

        if (user.username === 'test') {
            throw new Error('Không thể xóa tài khoản hệ thống!');
        }

        const result = await User.destroy({
            where: { user_id: idUser }
        });

        return result ? user.avatar : null;
    } catch (error) {
        logger.error('Lỗi khi xóa người dùng', { error: error.message, stack: error.stack, idUser });
        throw error;
    }
};

// Lấy thông tin người dùng theo ID
const getUserById = async (userid) => {
    if (!userid) {
        throw new Error('Yêu cầu id người dùng');
    }
    try {
        const result = await User.findOne({ where: { user_id: userid } });
        return result;
    } catch (error) {
        logger.error('Lỗi khi tìm sản phẩm', { error: error.message, stack: error.stack, userid });
        throw error;
    }
};

// Cập nhật người dùng
const updateUser = async (idUser, username, password, fullname, address, sex, email, phone, avatar, status, dateOfBirth, role, provider) => {
    try {
        const targetUser = await User.findOne({ where: { user_id: idUser } });
        if (targetUser && targetUser.username === 'test') {
            throw new Error('Hệ thống từ chối: Không thể cập nhật tài khoản hệ thống!');
        }

        if (!provider) {
            provider = 'local';
        }

        const existingUser = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    ...(email ? [{ email }] : []),
                    ...(phone ? [{ phone }] : []),
                ],
                user_id: { [Op.ne]: idUser },
            },
        });

        if (existingUser) {
            throw new Error('Username/Email/Phone đã được sử dụng!');
        }

        let updateFields = { 
            username, 
            password, 
            fullname, 
            address, 
            sex, 
            email, 
            phone, 
            avatar, 
            status, 
            dateOfBirth, 
            role, 
            provider 
        };

        const result = await User.update(updateFields, { 
            where: { user_id: idUser } 
        });

        return result;
    } catch (error) {
        logger.error('Lỗi khi cập nhật thông tin người dùng', { error: error.message, stack: error.stack, idUser });
        throw error;
    }
};

// API đăng nhập và tài khoản phía client
const getUserByUsernameAPI = async (username) => {
    try {
        const user = await User.findOne({
            where: { username },
            attributes: ['user_id', 'username', 'password', 'fullname', 'role', 'avatar', 'status', 'avatar']
        });
        return user;
    } catch (error) {
        logger.error(`Lỗi khi lấy user với username: ${username}`, { error: error.message, stack: error.stack });
        return null;
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

const getDetailUserByUsernameAPI = async (username) => {
    try {
        const user = await User.findOne({
            where: { username }
        });
        return user;
    } catch (error) {
        logger.error(`Lỗi khi lấy user với username: ${username}`, { error: error.message, stack: error.stack });
        return null;
    }
};

const addPendingUserAPI = async (username, password, fullname, email, phone) => {
    try {
        if (!PendingUsers) {
            throw new Error('Model PendingUsers không được định nghĩa!');
        }

        if (!username || !password || !fullname || !email || !phone) {
            throw new Error('Username, password, fullname, email và phone là bắt buộc!');
        }

        const existingUser = await User.findOne({
            where: { [Op.or]: [{ username }, { email }, { phone }] },
        });

        if (existingUser) {
            const errors = [];
            if (existingUser.username === username) errors.push('Tên đăng nhập');
            if (existingUser.email === email) errors.push('Email');
            if (existingUser.phone === phone) errors.push('Số điện thoại');
            throw new Error(`${errors.join(', ')} đã được sử dụng!`);
        }

        const pendingCount = await PendingUsers.count({ where: { email } });
        if (pendingCount >= 5) {
            throw new Error('Đã vượt quá giới hạn đăng ký cho email này. Vui lòng thử lại sau!');
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const pendingUser = await PendingUsers.create({
            username,
            password: hashedPassword,
            fullname,
            email,
            phone,
            verificationToken,
            expiresAt,
        });

        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            logger.error('Failed to send verification email', { error: emailError.message, email });
            await pendingUser.destroy();
            throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại sau.');
        }

        logger.info('Pending user created', { id: pendingUser.id });
        return pendingUser;
    } catch (error) {
        logger.error('Lỗi khi lưu thông tin tạm', { error: error.message, stack: error.stack });
        throw error;
    }
};

const confirmUserAPI = async (verificationToken) => {
    try {
        if (!PendingUsers) {
            throw new Error('Model PendingUsers không được định nghĩa!');
        }

        const pendingUser = await PendingUsers.findOne({
            where: { verificationToken },
        });

        if (!pendingUser) {
            throw new Error('Liên kết xác nhận không hợp lệ hoặc đã hết hạn!');
        }

        if (new Date() > pendingUser.expiresAt) {
            await pendingUser.destroy();
            throw new Error('Liên kết xác nhận đã hết hạn!');
        }

        const newUser = await User.create({
            username: pendingUser.username,
            password: pendingUser.password,
            fullname: pendingUser.fullname,
            email: pendingUser.email,
            phone: pendingUser.phone,
            provider: 'local',
        });

        await pendingUser.destroy();

        logger.info('User confirmed with ID:', { userId: newUser.user_id });
        return newUser;
    } catch (error) {
        logger.error('Lỗi khi xác nhận người dùng', { error: error.message, stack: error.stack });
        throw error;
    }
};

const addGoogleUserAPI = async (googleId, email, fullname = null) => {
    try {
        if (!googleId || !email) {
            throw new Error(`Google ID và email là bắt buộc!`);
        }

        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            if (!existingUser.googleId) {
                await existingUser.update({
                    googleId,
                    provider: 'mixed'
                });
                logger.info('Google ID updated for user', { userId: existingUser.user_id });
            }
            return existingUser;
        }

        const username = email;

        const newUser = await User.create({
            username,
            password: 'google-auth',
            fullname: fullname || email.split('@')[0],
            email,
            avatar: null,
            googleId,
            provider: 'google',
            role: 0,
        });
        logger.info('Google User created with ID:', { userId: newUser.user_id });
        return newUser;
    } catch (error) {
        logger.error("Lỗi khi thêm người dùng Google", { error: error.message, stack: error.stack, email });
        throw error;
    }
};

const updateUserAPI = async (username, updateFields) => {
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new Error('Không tìm thấy người dùng!');
        }

        if (updateFields.email || updateFields.phone) {
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [
                        ...(updateFields.email ? [{ email: updateFields.email }] : []),
                        ...(updateFields.phone ? [{ phone: updateFields.phone }] : []),
                    ],
                    user_id: { [Op.ne]: user.user_id },
                },
            });
            if (existingUser) {
                const errors = [];
                if (updateFields.email && existingUser.email === updateFields.email) {
                    errors.push('Email');
                }
                if (updateFields.phone && existingUser.phone === updateFields.phone) {
                    errors.push('Số điện thoại');
                }
                throw new Error(`${errors.join(' và ')} đã được sử dụng!`);
            }
        }

        const [affectedRows] = await User.update(updateFields, {
            where: { username },
        });

        return await User.findOne({ where: { username } });
    } catch (error) {
        logger.error('Lỗi khi cập nhật thông tin người dùng', { error: error.message, stack: error.stack, username });
        throw error;
    }
};

const changePasswordAPI = async (username, oldPassword, newPassword) => {
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new Error('Người dùng không tồn tại!');
        }

        if (user.password === 'google-auth') {
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await User.update(
                { password: hashedPassword, provider: 'mixed' },
                { where: { username } }
            );

            return { success: true, message: 'Đổi mật khẩu thành công!' };
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new Error('Mật khẩu cũ không đúng!');
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.update(
            { password: hashedPassword },
            { where: { username } }
        );

        return { success: true, message: 'Đổi mật khẩu thành công!' };
    } catch (error) {
        logger.error('Lỗi khi đổi mật khẩu', { error: error.message, stack: error.stack, username });
        throw error;
    }
};

const verifyResetTokenAPI = async (resetToken) => {
    try {
        const user = await User.findOne({
            where: { resetToken },
        });

        if (!user) {
            throw new Error('Token đặt lại mật khẩu không hợp lệ!');
        }

        if (new Date() > user.resetTokenExpiresAt) {
            throw new Error('Token đặt lại mật khẩu đã hết hạn!');
        }

        return user;
    } catch (error) {
        logger.error('Lỗi khi xác minh token đặt lại mật khẩu', { error: error.message, stack: error.stack });
        throw error;
    }
};

const requestPasswordResetAPI = async (usernameOrEmail) => {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
            },
        });

        if (!user) {
            throw new Error('Không tìm thấy người dùng với username hoặc email này!');
        }

        if (user.provider === 'google' && user.password === 'google-auth') {
            throw new Error('Tài khoản này sử dụng đăng nhập Google. Vui lòng sử dụng đăng nhập Google!');
        }

        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await User.update(
            { resetToken, resetTokenExpiresAt: expiresAt },
            { where: { user_id: user.user_id } }
        );

        await sendPasswordResetEmail(user.email, resetToken);

        return { success: true, message: 'Email đặt lại mật khẩu đã được gửi!' };
    } catch (error) {
        logger.error('Lỗi khi yêu cầu đặt lại mật khẩu', { error: error.message, stack: error.stack });
        throw error;
    }
};

const resetPasswordAPI = async (resetToken, newPassword) => {
    try {
        const user = await User.findOne({
            where: { resetToken },
        });

        if (!user) {
            throw new Error('Token đặt lại mật khẩu không hợp lệ!');
        }

        if (new Date() > user.resetTokenExpiresAt) {
            throw new Error('Token đặt lại mật khẩu đã hết hạn!');
        }

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.update(
            {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiresAt: null,
                provider: user.provider === 'google' ? 'mixed' : user.provider,
            },
            { where: { user_id: user.user_id } }
        );

        return { success: true, message: 'Đặt lại mật khẩu thành công!' };
    } catch (error) {
        logger.error('Lỗi khi đặt lại mật khẩu', { error: error.message, stack: error.stack });
        throw error;
    }
};

export { User };
export default {
    getUserByUsername,
    updateLastLogin,
    addUser,
    listUser,
    countUser,
    deleteUser,
    getUserById,
    updateUser,
    //API
    getUserByUsernameAPI,
    getDetailUserByUsernameAPI,
    addPendingUserAPI,
    confirmUserAPI,
    addGoogleUserAPI,
    updateUserAPI,
    changePasswordAPI,
    requestPasswordResetAPI,
    resetPasswordAPI,
    verifyResetTokenAPI
};