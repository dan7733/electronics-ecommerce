import express from 'express';
import bcrypt from 'bcryptjs';
import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
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
        console.error(`Lỗi khi lấy user với username: ${username}`, error);
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
        console.error('Error updating last login:', error);
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

        console.log('User created with ID:', newUser.user_id);
        return newUser;
    } catch (error) {
        console.error("Lỗi khi thêm người dùng:", error);
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
        console.error('Lỗi khi tải danh sách người dùng:', error);
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
        console.error('Lỗi khi đếm người dùng:', error);
        throw error;
    }
};

// Xóa người dùng
const deleteUser = async (idUser) => {
    try {
        const user = await User.findOne({
            where: { user_id: idUser },
            attributes: ['avatar']
        });

        if (!user) {
            return null;
        }

        const result = await User.destroy({
            where: { user_id: idUser }
        });

        return result ? user.avatar : null;
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
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
        console.error('Lỗi khi tìm sản phẩm:', error);
        throw error;
    }
};

// Cập nhật người dùng
const updateUser = async (idUser, username, password, fullname, address, sex, email, phone, avatar, status, dateOfBirth, role, provider) => {
    try {
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
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
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
        console.error(`Lỗi khi lấy user với username: ${username}`, error);
        return null;
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

// LẤY THÔNG TIN THEO USERNAME
const getDetailUserByUsernameAPI = async (username) => {
    try {
        const user = await User.findOne({
            where: { username }
        });
        return user;
    } catch (error) {
        console.error(`Lỗi khi lấy user với username: ${username}`, error);
        return null;
    }
};

// Thêm người dùng vào PendingUsers
const addPendingUserAPI = async (username, password, fullname, email, phone) => {
    try {
        // Kiểm tra PendingUsers có được định nghĩa không
        if (!PendingUsers) {
            throw new Error('Model PendingUsers không được định nghĩa!');
        }

        // Validate các trường bắt buộc
        if (!username || !password || !fullname || !email || !phone) {
            throw new Error('Username, password, fullname, email và phone là bắt buộc!');
        }

        // Kiểm tra username/email/phone trong User
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

        // Kiểm tra trong PendingUsers và giới hạn đăng ký từ cùng email
        const pendingCount = await PendingUsers.count({ where: { email } });
        if (pendingCount >= 5) {
            throw new Error('Đã vượt quá giới hạn đăng ký cho email này. Vui lòng thử lại sau!');
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo verification token và thời gian hết hạn (24 giờ)
        const verificationToken = uuidv4();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Lưu vào PendingUsers
        const pendingUser = await PendingUsers.create({
            username,
            password: hashedPassword,
            fullname,
            email,
            phone,
            verificationToken,
            expiresAt,
        });

        // Gửi email xác nhận
        try {
            await sendVerificationEmail(email, verificationToken);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError.message);
            await pendingUser.destroy();
            throw new Error('Không thể gửi email xác nhận. Vui lòng thử lại sau.');
        }

        console.log('Pending user created:', pendingUser.id);
        return pendingUser;
    } catch (error) {
        console.error('Lỗi khi lưu thông tin tạm:', error.message);
        throw error;
    }
};

// Xác nhận người dùng
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

        console.log('User confirmed with ID:', newUser.user_id);
        return newUser;
    } catch (error) {
        console.error('Lỗi khi xác nhận người dùng:', error.message);
        throw error;
    }
};
//thêm người dùng google
const addGoogleUserAPI = async (googleId, email, fullname = null) => {
    try {
        if (!googleId || !email) {
            throw new Error(`Google ID và email là bắt buộc!`);
        }

        // Kiểm tra người dùng đã tồn tại dựa trên email
        const existingUser = await User.findOne({
            where: { email }
        });

        if (existingUser) {
            // Nếu tài khoản đã tồn tại, cập nhật googleId và provider thành 'mixed'
            if (!existingUser.googleId) {
                await existingUser.update({
                    googleId,
                    provider: 'mixed'
                });
                console.log('Google ID updated for user:', existingUser.user_id);
            }
            return existingUser;
        }

        // Dùng email làm username
        const username = email;
        // Sử dụng ảnh mặc định

        const newUser = await User.create({
            username,
            password: 'google-auth', // Không cần mật khẩu
            fullname: fullname || email.split('@')[0], // Sử dụng fullname từ Google hoặc email
            email,
            avatar: null,
            googleId,
            provider: 'google',
            role: 0,
        });
        console.log('Google User created with ID:', newUser.user_id);
        return newUser;
    } catch (error) {
        console.error("Lỗi khi thêm người dùng Google:", error);
        throw error;
    }
};


  
const updateUserAPI = async (username, updateFields) => {
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new Error('Không tìm thấy người dùng!');
        }

        // Validate email/phone uniqueness if provided
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

        // Update only provided fields
        const [affectedRows] = await User.update(updateFields, {
            where: { username },
        });

        // Return updated user even if no changes were made
        return await User.findOne({ where: { username } });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin người dùng:', error);
        throw error;
    }
};


// Đổi mật khẩu người dùng
const changePasswordAPI = async (username, oldPassword, newPassword) => {
    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            throw new Error('Người dùng không tồn tại!');
        }

        // Kiểm tra nếu người dùng sử dụng Google auth
        if (user.password === 'google-auth') {
            // Không yêu cầu mật khẩu cũ, chỉ cần mật khẩu mới
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await User.update(
                { password: hashedPassword, provider: 'mixed' }, // Cập nhật provider thành 'mixed' vì giờ có mật khẩu cục bộ
                { where: { username } }
            );

            return { success: true, message: 'Đổi mật khẩu thành công!' };
        }

        // Đối với người dùng cục bộ, kiểm tra mật khẩu cũ
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new Error('Mật khẩu cũ không đúng!');
        }

        // Hash mật khẩu mới
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu
        await User.update(
            { password: hashedPassword },
            { where: { username } }
        );

        return { success: true, message: 'Đổi mật khẩu thành công!' };
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        throw error;
    }
};

// đổi mật khẩu
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
        console.error('Lỗi khi xác minh token đặt lại mật khẩu:', error);
        throw error;
    }
};

// Tạo token đặt lại mật khẩu và gửi email
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

        // Tạo token đặt lại mật khẩu
        const resetToken = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Hết hạn sau 1 giờ

        // Lưu token vào cơ sở dữ liệu
        await User.update(
            { resetToken, resetTokenExpiresAt: expiresAt },
            { where: { user_id: user.user_id } }
        );

        // Gửi email đặt lại mật khẩu
        await sendPasswordResetEmail(user.email, resetToken);

        return { success: true, message: 'Email đặt lại mật khẩu đã được gửi!' };
    } catch (error) {
        console.error('Lỗi khi yêu cầu đặt lại mật khẩu:', error);
        throw error;
    }
};

// Xác nhận và đặt lại mật khẩu
const resetPasswordAPI = async (resetToken, newPassword) => {
    try {
        const user = await User.findOne({
            where: { resetToken },
        });

        if (!user) {
            throw new Error('Token đặt lại mật khẩu không hợp lệ!');
        }
        // Nếu thời gian hiện tại (new Date()) lớn hơn resetTokenExpiresAt, nghĩa là token đã hết hạn (quá 1 giờ kể từ khi được tạo)
        if (new Date() > user.resetTokenExpiresAt) {
            throw new Error('Token đặt lại mật khẩu đã hết hạn!');
        }

        // Hash mật khẩu mới
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu và xóa token
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
        console.error('Lỗi khi đặt lại mật khẩu:', error);
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