import express from "express";
import storeModel from '../models/storeModel.js'  // Import model để xử lý với CSDL hoặc logic nghiệp vụ
// import { body, validationResult } from 'express-validator';


// tải trang thêm vị trí
const createStore = async (req, res) => {
    return res.render('home', {
        data: {
            title: 'Add store',
            page: 'addStore',
        }
    })
}

// thêm loại sản phẩm
const addStore = async (req, res) => {
    try {
        const { name, address, latitude, longitude, open_hours, close_hour } = req.body;
        console.log(req.body);

        // Kiểm tra dữ liệu đầu vào
        if (!name || !address || !latitude || !longitude || !open_hours || !close_hour) {
            return res.render("home", {
                data: {
                    page: 'addStore',
                    message: "Vui lòng nhập đầy đủ thông tin cửa hàng!"
                }
            });
        }

        // Gọi model để thêm cửa hàng
        const newStore = await storeModel.addStore(name, address, latitude, longitude, open_hours, close_hour);

        // Hiển thị kết quả
        res.render("home", {
            data: {
                page: 'addStore',
                message: newStore ? "Thêm cửa hàng thành công!" : "Thêm cửa hàng thất bại, vui lòng thử lại."
            }
        });

    } catch (error) {
        console.error("Lỗi khi thêm cửa hàng:", error);
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
        console.error(error);
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

// Xóa cửa hang
const deleteStore = async (req, res) => {
  try {
    const { storeid } = req.params;
    await storeModel.deleteStore(storeid);
    res.redirect('/liststore?message=Xóa thành công');
  } catch (error) {
    console.error(error);
    res.redirect('/liststore?message=Xóa thất bại');
  }
};

//tải trang sửa sản phẩ
const editStore = async (req, res) => {
  const { storeid } = req.params;
  const store = await storeModel.getStoreById(storeid)
  const message = req.query.message || '';
  return res.render('home', {
    data: {
      title: 'Update Store',
      page: 'updateStore',
      store: store,
      message: message
    }
  })
}

//Cập nhật cửa hàng
const updateStore = async (req, res) => {
    try {
      const { store_id, name, address, latitude, longitude, open_hours, close_hour } = req.body;
      await storeModel.updateStore(store_id, name, address, latitude, longitude, open_hours, close_hour);
      res.redirect(`/editStore/${store_id}?message=Cập nhật thành công`);
    } catch (error) {
      console.error("Lỗi khi cập nhật cửa hàng:", error);
      res.redirect(`/editStore/${store_id}?message=Cập nhật thất bại`);
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
        console.error("Error fetching store list:", error);
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