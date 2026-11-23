import express from "express";
import storeModel from '../models/storeModel.js'  // Import model để xử lý với CSDL hoặc logic nghiệp vụ
import logger from '../configs/logger.js'; // Import custom logger
// import { body, validationResult } from 'express-validator';


// tải trang thêm vị trí
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
}

// thêm loại sản phẩm (cửa hàng)
const addStore = async (req, res) => {
    try {
        const { name, address, latitude, longitude, open_hours, close_hour } = req.body;
        logger.info('Yêu cầu thêm cửa hàng', { body: req.body });

        // Kiểm tra dữ liệu đầu vào
        if (!name || !address || !latitude || !longitude || !open_hours || !close_hour) {
            logger.warn('Thêm cửa hàng thất bại: Thiếu thông tin bắt buộc', { body: req.body });
            return res.render("home", {
                data: {
                    page: 'addStore',
                    message: "Vui lòng nhập đầy đủ thông tin cửa hàng!"
                }
            });
        }

        // Gọi model để thêm cửa hàng
        const newStore = await storeModel.addStore(name, address, latitude, longitude, open_hours, close_hour);

        if (newStore) {
            logger.info('Thêm cửa hàng thành công', { storeName: name });
        } else {
            logger.warn('Thêm cửa hàng thất bại tại Model', { storeName: name });
        }

        // Hiển thị kết quả
        res.render("home", {
            data: {
                page: 'addStore',
                message: newStore ? "Thêm cửa hàng thành công!" : "Thêm cửa hàng thất bại, vui lòng thử lại."
            }
        });

    } catch (error) {
        logger.error("Lỗi khi thêm cửa hàng", { error: error.message, stack: error.stack, body: req.body });
        res.status(500).render("home", {
            data: {
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

// Xóa cửa hàng
const deleteStore = async (req, res) => {
  try {
    const { storeid } = req.params;
    await storeModel.deleteStore(storeid);
    logger.info('Xóa cửa hàng thành công', { storeid });
    res.redirect('/liststore?message=Xóa thành công');
  } catch (error) {
    logger.error('Lỗi khi xóa cửa hàng', { error: error.message, stack: error.stack, storeid: req.params.storeid });
    res.redirect('/liststore?message=Xóa thất bại');
  }
};

// tải trang sửa cửa hàng
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
}

// Cập nhật cửa hàng
const updateStore = async (req, res) => {
    const { store_id, name, address, latitude, longitude, open_hours, close_hour } = req.body;
    try {
      if (!store_id) {
        logger.warn('Cập nhật cửa hàng thất bại: Thiếu store_id');
        return res.redirect(`/liststore?message=Thiếu thông tin ID cửa hàng`);
      }

      await storeModel.updateStore(store_id, name, address, latitude, longitude, open_hours, close_hour);
      logger.info('Cập nhật cửa hàng thành công', { store_id, name });
      res.redirect(`/editStore/${store_id}?message=Cập nhật thành công`);
    } catch (error) {
      logger.error("Lỗi khi cập nhật cửa hàng", { error: error.message, stack: error.stack, body: req.body });
      res.redirect(`/editStore/${store_id || ''}?message=Cập nhật thất bại`);
    }
  };


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

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
    // API
    getAllStoresAPI
}