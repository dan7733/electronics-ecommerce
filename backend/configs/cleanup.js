import { PendingUsers } from '../models/PendingUserModel.js';
import cron from 'node-cron';
import { Op } from 'sequelize';
import logger from './logger.js'; // Import logger cùng cấp

// Chạy mỗi giờ
cron.schedule('0 * * * *', async () => {
  try {
    const deleted = await PendingUsers.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });
    logger.info(`Deleted ${deleted} expired pending users`);
  } catch (error) {
    logger.error('Error cleaning up expired pending users', { error: error.message, stack: error.stack });
  }
});