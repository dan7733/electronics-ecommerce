import express from "express";
import notificationModel, { Notification } from '../models/notificationModel.js';
import { User } from '../models/userModel.js';
import { Op } from 'sequelize';
import logger from '../configs/logger.js';

// 1. Tải trang Tạo & Gửi thông báo
const createNotification = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { status: 'active', role: 0 },
      attributes: ['user_id', 'username', 'fullname', 'email'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return res.render('home', {
      data: {
        title: 'Gửi Thông báo',
        page: 'addNotification',
        users: users,
        message: req.query.message || ''
      }
    });
  } catch (error) {
    logger.error('Lỗi khi tải trang tạo thông báo', { error: error.message, stack: error.stack });
    res.status(500).send("Lỗi máy chủ.");
  }
};

// 2. API AJAX Tìm kiếm Người dùng Realtime
const searchUsersAPI = async (req, res) => {
  try {
    const keyword = req.query.keyword || '';

    const users = await User.findAll({
      where: {
        status: 'active',
        role: 0,
        [Op.or]: [
          { username: { [Op.like]: `%${keyword}%` } },
          { fullname: { [Op.like]: `%${keyword}%` } },
          { email: { [Op.like]: `%${keyword}%` } }
        ]
      },
      attributes: ['user_id', 'username', 'fullname', 'email'],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return res.status(200).json({ errCode: 0, data: users });
  } catch (error) {
    logger.error('Lỗi API searchUsersAPI', { error: error.message });
    return res.status(500).json({ errCode: 1, message: 'Lỗi khi tìm kiếm người dùng' });
  }
};

// 3. Xử lý Thêm & Gửi thông báo từ Admin
const addNotification = async (req, res) => {
  try {
    const { target_type, target_user_id, user_id, title, message, type, link } = req.body;
    const selectedUserId = target_user_id || user_id || null;

    if (!title || !message) {
      return res.redirect('/addnotification?message=' + encodeURIComponent('Vui lòng nhập đầy đủ tiêu đề và nội dung!'));
    }

    if (target_type === 'broadcast' || target_type === 'all') {
      const count = await notificationModel.sendBroadcastNotification(title, message, type || 'news', link || null);
      logger.info('Admin đã gửi broadcast thông báo', { count, title });
      return res.redirect(`/listnotification?message=${encodeURIComponent(`Đã gửi thông báo thành công đến ${count} người dùng!`)}`);
    } else {
      if (!selectedUserId) {
        return res.redirect('/addnotification?message=' + encodeURIComponent('Vui lòng chọn người dùng nhận thông báo!'));
      }

      await notificationModel.addNotification(selectedUserId, title, message, type || 'system', 'admin', link || null);
      logger.info('Admin đã gửi thông báo đơn lẻ', { targetUser: selectedUserId, title });
      return res.redirect('/listnotification?message=' + encodeURIComponent('Đã gửi thông báo thành công!'));
    }
  } catch (error) {
    logger.error('Lỗi khi thêm thông báo', { error: error.message, stack: error.stack, body: req.body });
    res.redirect('/addnotification?message=' + encodeURIComponent('Có lỗi xảy ra khi gửi thông báo.'));
  }
};

// 4. Danh sách thông báo Quản lý (Admin EJS Dashboard)
const listNotification = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 7;
    const offset = (page - 1) * limit;

    const searchKeyword = req.query.search || '';
    const typeFilter = req.query.type || '';
    const createdByFilter = req.query.created_by || '';
    const receiverFilter = req.query.receiver || '';

    const whereClause = {};

    if (searchKeyword) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${searchKeyword}%` } },
        { message: { [Op.like]: `%${searchKeyword}%` } }
      ];
    }

    if (typeFilter) whereClause.type = typeFilter;
    if (createdByFilter) whereClause.created_by = createdByFilter;

    if (receiverFilter === 'single') {
      whereClause.user_id = { [Op.ne]: null };
    } else if (receiverFilter === 'admin') {
      whereClause.user_id = null;
    }

    const allNotifications = await Notification.findAll({
      where: whereClause,
      include: [{
        model: User,
        attributes: ['user_id', 'username', 'fullname', 'email']
      }],
      order: [['created_at', 'DESC']]
    });

    const groupedMap = new Map();

    allNotifications.forEach(noti => {
      if (noti.user_id === null) {
        groupedMap.set(`admin_${noti.notification_id}`, {
          ...noti.toJSON(),
          isGroup: false,
          recipientCount: 1
        });
      } else {
        const timeKey = new Date(noti.created_at).toISOString().substring(0, 16);
        const groupKey = `broadcast_${noti.title}_${noti.type}_${timeKey}`;

        if (groupedMap.has(groupKey)) {
          const existingGroup = groupedMap.get(groupKey);
          existingGroup.recipientCount += 1;
          existingGroup.allIds.push(noti.notification_id);
        } else {
          groupedMap.set(groupKey, {
            ...noti.toJSON(),
            isGroup: true,
            recipientCount: 1,
            allIds: [noti.notification_id]
          });
        }
      }
    });

    const groupedList = Array.from(groupedMap.values());
    const totalNotifications = groupedList.length;
    const totalPages = Math.ceil(totalNotifications / limit) || 1;
    const paginatedRows = groupedList.slice(offset, offset + limit);

    res.render('home', {
      data: {
        title: 'Quản lý Thông báo',
        page: 'listNotification',
        rows: paginatedRows,
        currentPage: page,
        totalPages: totalPages,
        totalNotifications: totalNotifications,
        message: req.query.message || '',
        search: searchKeyword,
        typeFilter: typeFilter,
        createdByFilter: createdByFilter,
        receiverFilter: receiverFilter
      }
    });
  } catch (error) {
    logger.error('Lỗi khi tải danh sách thông báo', { error: error.message, stack: error.stack });
    res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

// 5. API Lấy chi tiết thông báo
const getNotificationDetailAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id, {
      include: [{ model: User, attributes: ['user_id', 'username', 'fullname', 'email'] }]
    });

    if (!notification) {
      return res.status(404).json({ errCode: 1, message: 'Không tìm thấy thông báo!' });
    }

    if (!notification.is_read) {
      await notification.update({ is_read: true });
    }

    const unreadCount = await Notification.count({
      where: { user_id: null, is_read: false }
    });

    return res.status(200).json({ errCode: 0, data: notification, unreadCount });
  } catch (error) {
    logger.error('Lỗi API getNotificationDetailAPI', { error: error.message, id: req.params.id });
    return res.status(500).json({ errCode: 1, message: 'Có lỗi xảy ra khi tải thông báo!' });
  }
};

// 6. Xóa thông báo
const deleteNotification = async (req, res) => {
  try {
    const { notification_id, ids } = req.body;

    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id, 10)).filter(Boolean);
      await Notification.destroy({ where: { notification_id: { [Op.in]: idArray } } });
    } else if (notification_id) {
      await notificationModel.deleteNotification(notification_id);
    }

    logger.info('Xóa thông báo thành công', { notification_id, ids });
    res.redirect('/listnotification?message=' + encodeURIComponent('Xóa thông báo thành công'));
  } catch (error) {
    logger.error('Lỗi khi xóa thông báo', { error: error.message, stack: error.stack, body: req.body });
    res.redirect('/listnotification?message=' + encodeURIComponent('Xóa thông báo thất bại'));
  }
};

// 7. API LẤY DANH SÁCH THÔNG BÁO DÀNH CHO USER (REACT FRONTEND)
const getUserNotificationsAPI = async (req, res) => {
  try {
    const rawUserId = req.user?.user_id || req.user?.id || req.user?.userId || req.user?.user?.user_id || req.user?.user?.id;
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!userId) {
      logger.warn('getUserNotificationsAPI: Không tìm thấy userId trong req.user', { userPayload: req.user });
      return res.status(401).json({ errCode: 1, message: 'Chưa xác thực người dùng!' });
    }

    // Tự động đánh dấu đã đọc các thông báo cũ quá 7 ngày
    const AUTO_READ_DAYS = 7;
    const expireDate = new Date(Date.now() - AUTO_READ_DAYS * 24 * 60 * 60 * 1000);

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId, // ⚡ ĐÃ FIX: Chỉ áp dụng cho chính User này
          is_read: false,
          created_at: { [Op.lt]: expireDate }
        }
      }
    );

    const limit = parseInt(req.query.limit, 10) || 10;

    // ⚡ ĐÃ FIX: Chỉ truy vấn các thông báo gửi đích danh cho User này (user_id === userId)
    const notifications = await Notification.findAll({
      where: {
        user_id: userId
      },
      order: [['created_at', 'DESC']],
      limit: limit
    });

    return res.status(200).json({ errCode: 0, data: notifications });
  } catch (error) {
    logger.error('Lỗi API getUserNotificationsAPI', { error: error.message, stack: error.stack });
    return res.status(500).json({ errCode: 1, message: 'Lỗi tải danh sách thông báo' });
  }
};

// 8. API ĐẾM SỐ THÔNG BÁO CHƯA ĐỌC CỦA USER
const getUnreadCountAPI = async (req, res) => {
  try {
    const rawUserId = req.user?.user_id || req.user?.id || req.user?.userId || req.user?.user?.user_id || req.user?.user?.id;
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!userId) {
      return res.status(401).json({ errCode: 1, message: 'Chưa xác thực người dùng!' });
    }

    const AUTO_READ_DAYS = 7;
    const expireDate = new Date(Date.now() - AUTO_READ_DAYS * 24 * 60 * 60 * 1000);

    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId, // ⚡ ĐÃ FIX: Chỉ thuộc về User này
          is_read: false,
          created_at: { [Op.lt]: expireDate }
        }
      }
    );

    // ⚡ ĐÃ FIX: Đếm thông báo thuộc sở hữu của User
    const unreadCount = await Notification.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    return res.status(200).json({ errCode: 0, unreadCount });
  } catch (error) {
    logger.error('Lỗi API getUnreadCountAPI', { error: error.message });
    return res.status(500).json({ errCode: 1, message: 'Lỗi đếm số lượng thông báo' });
  }
};

// 9. API ĐÁNH DẤU 1 THÔNG BÁO ĐÃ ĐỌC
const markReadAPI = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByPk(id);

    if (notification && !notification.is_read) {
      await notification.update({ is_read: true });
    }

    return res.status(200).json({ errCode: 0, message: 'Đã đánh dấu đã đọc' });
  } catch (error) {
    logger.error('Lỗi API markReadAPI', { error: error.message, id: req.params.id });
    return res.status(500).json({ errCode: 1, message: 'Lỗi cập nhật thông báo' });
  }
};

// 10. API ĐÁNH DẤU TẤT CẢ THÔNG BÁO ĐÃ ĐỌC CỦA USER
const markAllReadAPI = async (req, res) => {
  try {
    const rawUserId = req.user?.user_id || req.user?.id || req.user?.userId || req.user?.user?.user_id || req.user?.user?.id;
    const userId = rawUserId ? parseInt(rawUserId, 10) : null;

    if (!userId) {
      return res.status(401).json({ errCode: 1, message: 'Chưa xác thực người dùng!' });
    }

    // ⚡ ĐÃ FIX: Chỉ cập nhật các thông báo của User này
    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: userId,
          is_read: false
        }
      }
    );

    return res.status(200).json({ errCode: 0, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    logger.error('Lỗi API markAllReadAPI', { error: error.message });
    return res.status(500).json({ errCode: 1, message: 'Lỗi cập nhật tất cả thông báo' });
  }
};

// 11. ĐÁNH DẤU TẤT CẢ THÔNG BÁO ADMIN LÀ ĐÃ ĐỌC (DÙNG CHO DASHBOARD EJS ADMIN)
const markAllAdminRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true },
      {
        where: {
          user_id: null,
          is_read: false
        }
      }
    );
    logger.info('Admin đã đánh dấu tất cả thông báo hệ thống là đã đọc');
    const backUrl = req.get('Referrer') || '/';
    return res.redirect(backUrl);
  } catch (error) {
    logger.error('Lỗi khi đánh dấu tất cả thông báo Admin đã đọc', { error: error.message, stack: error.stack });
    const backUrl = req.get('Referrer') || '/';
    return res.redirect(backUrl);
  }
};

export default {
  createNotification,
  searchUsersAPI,
  addNotification,
  listNotification,
  getNotificationDetailAPI,
  deleteNotification,
  getUserNotificationsAPI,
  getUnreadCountAPI,
  markReadAPI,
  markAllReadAPI,
  markAllAdminRead
};