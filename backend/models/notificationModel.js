import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import logger from '../configs/logger.js';
import { User } from './userModel.js';
import { UserNotificationSetting } from './userNotificationSettingModel.js';

const Notification = sequelize.define('Notification', {
    notification_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // null = gửi chung cho Broadcast / Admin
        references: {
            model: User,
            key: 'user_id'
        },
        onDelete: 'CASCADE'
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('order', 'news', 'account', 'system'),
        allowNull: false,
        defaultValue: 'system'
    },
    created_by: {
        type: DataTypes.ENUM('system', 'admin'),
        allowNull: false,
        defaultValue: 'system'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    link: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'notifications'
});

Notification.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Notification, { foreignKey: 'user_id' });

// 1. Lấy danh sách thông báo có Phân trang, Tìm kiếm & Lọc
const listNotification = async (offset = null, limit = null, searchKeyword = '', typeFilter = '', createdByFilter = '') => {
    try {
        const queryOptions = {
            where: {},
            include: [{
                model: User,
                attributes: ['user_id', 'username', 'fullname', 'email']
            }],
            order: [['created_at', 'DESC']]
        };

        if (searchKeyword) {
            queryOptions.where[Op.or] = [
                { title: { [Op.like]: `%${searchKeyword}%` } },
                { message: { [Op.like]: `%${searchKeyword}%` } }
            ];
        }

        if (typeFilter) {
            queryOptions.where.type = typeFilter;
        }

        if (createdByFilter) {
            queryOptions.where.created_by = createdByFilter;
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        return await Notification.findAll(queryOptions);
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách thông báo', { error: error.message, stack: error.stack });
        throw error;
    }
};

// 2. Đếm số lượng thông báo theo bộ lọc
const countNotification = async (searchKeyword = '', typeFilter = '', createdByFilter = '') => {
    try {
        const queryOptions = { where: {} };

        if (searchKeyword) {
            queryOptions.where[Op.or] = [
                { title: { [Op.like]: `%${searchKeyword}%` } },
                { message: { [Op.like]: `%${searchKeyword}%` } }
            ];
        }

        if (typeFilter) queryOptions.where.type = typeFilter;
        if (createdByFilter) queryOptions.where.created_by = createdByFilter;

        return await Notification.count(queryOptions);
    } catch (error) {
        logger.error('Lỗi khi đếm thông báo', { error: error.message, stack: error.stack });
        throw error;
    }
};

// ⚡ 3. Thêm thông báo (Hỗ trợ linh hoạt cả Object lẫn Tham số rời)
const addNotification = async (user_id, title, message, type = 'system', created_by = 'admin', link = null) => {
    try {
        // Nếu truyền dạng Object: addNotification({ user_id, title, message, ... })
        if (typeof user_id === 'object' && user_id !== null) {
            const data = user_id;
            user_id = data.user_id || data.userId || data.target_user_id || null;
            title = data.title;
            message = data.message;
            type = data.type || 'system';
            created_by = data.created_by || 'admin';
            link = data.link || null;
        }

        const parsedUserId = user_id ? parseInt(user_id, 10) : null;

        // Nếu có user_id, kiểm tra xem User có tồn tại trong DB không
        if (parsedUserId) {
            const existingUser = await User.findByPk(parsedUserId);
            if (!existingUser) {
                logger.warn('Không thể tạo thông báo: User không tồn tại trong DB', { parsedUserId });
                return null;
            }
        }

        const newNoti = await Notification.create({
            user_id: parsedUserId,
            title,
            message,
            type,
            created_by,
            link,
            is_read: false,
            created_at: new Date() // Gán thời gian tạo rõ ràng
        });

        logger.info('Tạo thông báo thành công', { notification_id: newNoti.notification_id, parsedUserId });
        return newNoti;
    } catch (error) {
        logger.error('Lỗi khi thêm thông báo vào DB', { error: error.message, stack: error.stack, title });
        throw error;
    }
};

const createNotification = addNotification;

// 4. Gửi Broadcast toàn hệ thống
const sendBroadcastNotification = async (title, message, type = 'news', link = null) => {
    try {
        const users = await User.findAll({
            where: { status: 'active' },
            include: [{ model: UserNotificationSetting }]
        });

        const fieldMap = {
            'order': 'notify_order',
            'news': 'notify_news',
            'account': 'notify_account',
            'system': 'notify_system'
        };
        const settingField = fieldMap[type];

        const validNotifications = users
            .filter(u => {
                const userSetting = u.UserNotificationSetting;
                return !userSetting || userSetting[settingField] !== false;
            })
            .map(u => ({
                user_id: u.user_id,
                title,
                message,
                type,
                created_by: 'admin',
                link,
                is_read: false,
                created_at: new Date()
            }));

        if (validNotifications.length > 0) {
            await Notification.bulkCreate(validNotifications);
        }
        return validNotifications.length;
    } catch (error) {
        logger.error('Lỗi gửi broadcast thông báo', { error: error.message, stack: error.stack });
        throw error;
    }
};

// 5. Xóa thông báo theo ID
const deleteNotification = async (idNotification) => {
    try {
        return await Notification.destroy({
            where: { notification_id: idNotification }
        });
    } catch (error) {
        logger.error('Lỗi khi xóa thông báo', { error: error.message, stack: error.stack, idNotification });
        throw error;
    }
};

export { Notification };
export default {
    Notification,
    listNotification,
    countNotification,
    addNotification,
    createNotification,
    sendBroadcastNotification,
    deleteNotification
};