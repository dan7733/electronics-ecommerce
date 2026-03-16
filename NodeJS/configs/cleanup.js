import { PendingUsers } from '../models/PendingUserModel.js';
import cron from 'node-cron';
import { Op } from 'sequelize';

// Chạy mỗi giờ
cron.schedule('0 * * * *', async () => {
  try {
    const deleted = await PendingUsers.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });
    console.log(`Deleted ${deleted} expired pending users`);
  } catch (error) {
    console.error('Error cleaning up expired pending users:', error);
  }
});