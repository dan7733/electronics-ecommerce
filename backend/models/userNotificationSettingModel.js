import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { User } from './userModel.js';
import logger from '../configs/logger.js';

const UserNotificationSetting = sequelize.define('UserNotificationSetting', {
    setting_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: User,
            key: 'user_id'
        },
        onDelete: 'CASCADE'
    },
    notify_order: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // Thông báo đơn hàng (mặc định Bật)
    },
    notify_news: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // Thông báo tin tức & khuyến mãi (mặc định Bật)
    },
    notify_account: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // Thông báo tài khoản & bảo mật (mặc định Bật)
    },
    notify_system: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true // Thông báo hệ thống chung (mặc định Bật)
    }
}, {
    timestamps: false,
    tableName: 'user_notification_settings'
});

// Thiết lập quan hệ
UserNotificationSetting.belongsTo(User, { foreignKey: 'user_id' });
User.hasOne(UserNotificationSetting, { foreignKey: 'user_id' });

// Lấy hoặc tạo cài đặt mặc định cho User
const getOrCreateSettings = async (user_id) => {
    try {
        let settings = await UserNotificationSetting.findOne({ where: { user_id } });
        if (!settings) {
            settings = await UserNotificationSetting.create({ user_id });
        }
        return settings;
    } catch (error) {
        logger.error('Lỗi lấy/tạo cài đặt thông báo', { error: error.message, user_id });
        throw error;
    }
};

// Cập nhật cài đặt
const updateSettings = async (user_id, updateData) => {
    try {
        await getOrCreateSettings(user_id); // Đảm bảo đã có bản ghi
        return await UserNotificationSetting.update(updateData, { where: { user_id } });
    } catch (error) {
        logger.error('Lỗi cập nhật cài đặt thông báo', { error: error.message, user_id });
        throw error;
    }
};

export { UserNotificationSetting };
export default {
    UserNotificationSetting,
    getOrCreateSettings,
    updateSettings
};