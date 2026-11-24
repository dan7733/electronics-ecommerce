import express from "express";
import storeModel from '../models/storeModel.js';
import notificationModel from '../models/notificationModel.js'; // 🔔 Import Model Thông báo
import logger from '../configs/logger.js';

const createStore = async (req, res) => {
    try {
        return res.render('home', {
            data: {
                title: 'Add store',
                page: 'addStore',
            }
        });
    } catch (error) {
        logger.error('Lỗi khi tải trang thêm cửa hàng', { error: error.message, stack: error.stack });
        res.status(500).send("Lỗi máy chủ.");
    }
};

// THÊM CỬA HÀNG (GỬI THÔNG BÁO CHO ADMIN)
const addStore = async (req, res) => {
    try {
        const { name, address, latitude, longitude, open_hours, close_hour } = req.body;
        logger.info('Yêu cầu thêm cửa hàng', { body: req.body });

        if (!name || !address || !latitude || !longitude || !open_hours || !close_hour) {
            logger.warn('Thêm cửa hàng thất bại: Thiếu thông tin bắt buộc', { body: req.body });
            return res.render("home", {
                data: {
                    title: 'Add store',
                    page: 'addStore',
                    message: "Vui lòng nhập đầy đủ thông tin cửa hàng!"
                }
            });
        }

        const newStore = await storeModel.addStore(name, address, latitude, longitude, open_hours, close_hour);

        if (newStore) {
            logger.info('Thêm cửa hàng thành công', { storeName: name });

            // 🔔 THÔNG BÁO HỆ THỐNG: Ghi nhật ký Thêm cửa hàng cho Admin
            try {
                await notificationModel.createNotification({
                    user_id: null, // null = gửi cho Admin
                    title: 'Thêm cửa hàng mới',
                    message: `Admin vừa thêm cửa hàng mới "${name}" tại địa chỉ: ${address}.`,
                    type: 'system',
                    created_by: 'admin',
                    link: '/liststore'
                });
            } catch (notiErr) {
                logger.error('Lỗi khi gửi thông báo thêm cửa hàng cho Admin', { error: notiErr.message });
            }
        } else {
            logger.warn('Thêm cửa hàng thất bại tại Model', { storeName: name });
        }

        res.render("home", {
            data: {
                title: 'Add store',
                page: 'addStore',
                message: newStore ? "Thêm cửa hàng thành công!" : "Thêm cửa hàng thất bại, vui lòng thử lại."
            }
        });

    } catch (error) {
        logger.error("Lỗi khi thêm cửa hàng", { error: error.message, stack: error.stack, body: req.body });
        res.status(500).render("home", {
            data: {
                title: 'Add store',
                page: 'addStore',
                message: "Có lỗi xảy ra khi thêm cửa hàng."
            }
        });
    }
};

const listStore = async (req, res) => {
    try {
        const listStore = await storeModel.getAllStores();
        const message = req.query.message || '';
        res.render('home', {
            data: {
                title: 'List Store',
                page: 'listStore',
                liststore: listStore,
                message: message 
            }
        });
    } catch (error) {
        logger.error('Lỗi khi tải danh sách cửa hàng', { error: error.message, stack: error.stack });
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

// XÓA CỬA HÀNG (GỬI THÔNG BÁO CHO ADMIN)
const deleteStore = async (req, res) => {
  try {
    const { storeid } = req.params;
    await storeModel.deleteStore(storeid);
    logger.info('Xóa cửa hàng thành công', { storeid });

    // 🔔 THÔNG BÁO HỆ THỐNG: Ghi nhật ký Xóa cửa hàng cho Admin
    try {
        await notificationModel.createNotification({
            user_id: null, // null = gửi cho Admin
            title: 'Xóa cửa hàng',
            message: `Admin đã xóa cửa hàng ID #${storeid} khỏi hệ thống.`,
            type: 'system',
            created_by: 'admin',
            link: '/liststore'
        });
    } catch (notiErr) {
        logger.error('Lỗi khi gửi thông báo xóa cửa hàng cho Admin', { error: notiErr.message, storeid });
    }

    res.redirect('/liststore?message=' + encodeURIComponent('Xóa thành công'));
  } catch (error) {
    logger.error('Lỗi khi xóa cửa hàng', { error: error.message, stack: error.stack, storeid: req.params.storeid });
    res.redirect('/liststore?message=' + encodeURIComponent('Xóa thất bại'));
  }
};

const editStore = async (req, res) => {
  const { storeid } = req.params;
  try {
    const store = await storeModel.getStoreById(storeid);
    const message = req.query.message || '';
    return res.render('home', {
      data: {
        title: 'Update Store',
        page: 'updateStore',
        store: store,
        message: message
      }
    });
  } catch (error) {
    logger.error('Lỗi khi tải trang cập nhật cửa hàng', { error: error.message, stack: error.stack, storeid });
    return res.redirect('/liststore');
  }
};

// CẬP NHẬT CỬA HÀNG (GỬI THÔNG BÁO CHO ADMIN)
const updateStore = async (req, res) => {
    const { store_id, name, address, latitude, longitude, open_hours, close_hour } = req.body;
    try {
      if (!store_id) {
        logger.warn('Cập nhật cửa hàng thất bại: Thiếu store_id');
        return res.redirect(`/liststore?message=${encodeURIComponent('Thiếu thông tin ID cửa hàng')}`);
      }

      await storeModel.updateStore(store_id, name, address, latitude, longitude, open_hours, close_hour);
      
      // 🔔 THÔNG BÁO HỆ THỐNG: Ghi nhật ký Cập nhật cửa hàng cho Admin
      try {
          await notificationModel.createNotification({
              user_id: null, // null = gửi cho Admin
              title: 'Cập nhật cửa hàng',
              message: `Admin đã cập nhật thông tin cửa hàng "${name}" (ID: #${store_id}).`,
              type: 'system',
              created_by: 'admin',
              link: `/editStore/${store_id}`
          });
      } catch (notiErr) {
          logger.error('Lỗi khi gửi thông báo cập nhật cửa hàng cho Admin', { error: notiErr.message, store_id });
      }

      logger.info('Cập nhật cửa hàng thành công', { store_id, name });
      res.redirect(`/editStore/${store_id}?message=${encodeURIComponent('Cập nhật thành công')}`);
    } catch (error) {
      logger.error("Lỗi khi cập nhật cửa hàng", { error: error.message, stack: error.stack, body: req.body });
      const redirectId = store_id || '';
      res.redirect(`/editStore/${redirectId}?message=${encodeURIComponent('Cập nhật thất bại')}`);
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// API /////////////////////////////////////////////////

const getAllStoresAPI = async (req, res) => {
    try {
        const listStore = await storeModel.getAllStoresAPI();

        return res.status(200).json({
            errCode: 0,
            message: "Success",
            data: listStore || []
        });
    } catch (error) {
        logger.error("Lỗi trong getAllStoresAPI", { error: error.message, stack: error.stack });
        return res.status(500).json({
            errCode: 1,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export default {
    createStore,
    addStore,
    listStore,
    deleteStore,
    editStore,
    updateStore,
    getAllStoresAPI
};