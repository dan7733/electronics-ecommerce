import notificationSettingModel from '../models/userNotificationSettingModel.js';
import logger from '../configs/logger.js';

// 1. API Lấy cài đặt thông báo của User
const getUserSettingsAPI = async (req, res) => {
  try {
    const rawUserId = req.user?.user_id || req.user?.id || req.user?.userId || req.user?.user?.user_id;
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!userId) {
      return res.status(401).json({ errCode: 1, message: 'Chưa xác thực người dùng!' });
    }

    const settings = await notificationSettingModel.getOrCreateSettings(userId);
    return res.status(200).json({ errCode: 0, data: settings });
  } catch (error) {
    logger.error('Lỗi API getUserSettingsAPI', { error: error.message, stack: error.stack });
    return res.status(500).json({ errCode: 1, message: 'Lỗi khi tải cài đặt thông báo' });
  }
};

// 2. API Cập nhật cài đặt thông báo
const updateUserSettingsAPI = async (req, res) => {
  try {
    const rawUserId = req.user?.user_id || req.user?.id || req.user?.userId || req.user?.user?.user_id;
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!userId) {
      return res.status(401).json({ errCode: 1, message: 'Chưa xác thực người dùng!' });
    }

    const { notify_order, notify_news, notify_account, notify_system } = req.body;

    await notificationSettingModel.updateSettings(userId, {
      notify_order: Boolean(notify_order),
      notify_news: Boolean(notify_news),
      notify_account: Boolean(notify_account),
      notify_system: Boolean(notify_system)
    });

    logger.info('Cập nhật cài đặt thông báo thành công', { userId });
    return res.status(200).json({ errCode: 0, message: 'Cập nhật cài đặt thông báo thành công!' });
  } catch (error) {
    logger.error('Lỗi API updateUserSettingsAPI', { error: error.message, stack: error.stack });
    return res.status(500).json({ errCode: 1, message: 'Lỗi khi cập nhật cài đặt thông báo' });
  }
};

export default {
  getUserSettingsAPI,
  updateUserSettingsAPI
};