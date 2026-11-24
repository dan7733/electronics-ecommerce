import express from "express";
import categoryModel from '../models/categoryModel.js';  // Import model để xử lý với CSDL
import notificationModel from '../models/notificationModel.js'; // Import Model Thông báo
import logger from '../configs/logger.js'; // Import custom logger

// Tải trang thêm loại sản phẩm
const createCategory = async (req, res) => {
  return res.render('home', {
    data: {
      title: 'Thêm danh mục',
      page: 'addCategory',
    }
  });
};

// Thêm loại sản phẩm
const addCategory = async (req, res) => {
  try {
    const { categoryName, icon, highlight } = req.body;

    if (!categoryName) {
      logger.warn('Thêm danh mục thất bại: Tên danh mục trống');
      return res.render("home", { 
        data: { 
          title: 'Thêm danh mục',
          page: 'addCategory', 
          message: "Tên danh mục không được để trống!" 
        } 
      });
    }

    const result = await categoryModel.addCategory(categoryName, icon, highlight);
    
    if (result) {
      logger.info('Thêm danh mục thành công', { categoryName });

      // 🔔 CHỈ GHI NHẬT KÝ HỆ THỐNG DÀNH CHO ADMIN DASHBOARD (Không broadcast cho User)
      try {
        const highlightVal = parseInt(highlight) || 0;
        await notificationModel.createNotification({
          user_id: null,
          title: 'Thêm danh mục mới',
          message: `Admin vừa thêm danh mục "${categoryName}" (Highlight: ${highlightVal}).`,
          type: 'system',
          created_by: 'admin',
          link: '/listcategory'
        });
      } catch (notiError) {
        logger.error('Lỗi khi lưu log thêm danh mục', { error: notiError.message });
      }

    } else {
      logger.warn('Thêm danh mục thất bại tại Model', { categoryName });
    }

    res.render("home", {
      data: {
        title: 'Thêm danh mục',
        page: 'addCategory',
        message: result ? "Thêm danh mục thành công!" : "Thêm danh mục thất bại, vui lòng thử lại."
      }
    });
  } catch (error) {
    logger.error('Lỗi khi thêm danh mục', { error: error.message, stack: error.stack, body: req.body });
    res.status(500).send('Có lỗi xảy ra khi thêm danh mục.');
  }
};

// Danh sách loại sản phẩm bao gồm phân trang, tìm kiếm và sắp xếp
const listCategory = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5; 
      const offset = (page - 1) * limit; 
      
      const searchKeyword = req.query.search || '';
      const sortOption = req.query.sort || 'default';
      
      const totalCategory = await categoryModel.countCategory(searchKeyword);
      const totalPages = Math.ceil(totalCategory / limit);
      const message = req.query.message || '';  
      
      const Listcategory = await categoryModel.listCategory(offset, limit, searchKeyword, sortOption);
      
      res.render('home', {
          data: {
              title: 'Danh sách danh mục',
              page: 'listCategory',
              rows: Listcategory,
              currentPage: page,
              totalPages: totalPages,
              message: message,
              search: searchKeyword,
              sort: sortOption
          }
      });
  } catch (error) {
      logger.error('Lỗi khi tải danh sách danh mục', { error: error.message, stack: error.stack, query: req.query });
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

// Xóa loại sản phẩm
const deleteCategory = async (req, res) => {
  try {
    const { category_id } = req.body;
    await categoryModel.deleteCategory(category_id);
    
    logger.info('Xóa danh mục thành công', { category_id });

    // 🔔 GHI NHẬT KÝ HỆ THỐNG DÀNH CHO ADMIN DASHBOARD
    try {
      await notificationModel.createNotification({
        user_id: null,
        title: 'Xóa danh mục',
        message: `Admin đã xóa danh mục sản phẩm (ID: #${category_id}) khỏi hệ thống.`,
        type: 'system',
        created_by: 'admin',
        link: '/listcategory'
      });
    } catch (notiError) {
      logger.error('Lỗi khi lưu log xóa danh mục', { error: notiError.message });
    }

    res.redirect('/listcategory?message=' + encodeURIComponent('Xóa thành công'));
  } catch (error) {
    logger.error('Lỗi khi xóa danh mục', { error: error.message, stack: error.stack, body: req.body });
    res.redirect('/listcategory?message=' + encodeURIComponent('Xóa thất bại'));
  }
};

// Tải trang cập nhật loại sản phẩm
const editCategory = async (req, res) => {
  const { categoryid } = req.params;
  try {
    const category = await categoryModel.getCategoryByid(categoryid);
    const message = req.query.message || '';
    
    return res.render('home', {
      data: {
        title: 'Cập nhật danh mục',
        page: 'updateCategory',
        category: category,
        message: message
      }
    });
  } catch (error) {
    logger.error('Lỗi khi lấy chi tiết danh mục', { error: error.message, stack: error.stack, categoryid });
    return res.redirect('/listcategory');
  }
};

// Cập nhật loại sản phẩm
const updateCategory = async (req, res) => {
  const { category_id, name, icon, highlight } = req.body;
  try {
    if (!category_id) {
      logger.warn('Cập nhật danh mục thất bại: Thiếu category_id');
      throw new Error("Thiếu category_id");
    }

    await categoryModel.updateCategory(category_id, name, icon, highlight);
    
    // 🔔 GHI NHẬT KÝ HỆ THỐNG DÀNH CHO ADMIN DASHBOARD
    try {
      await notificationModel.createNotification({
        user_id: null,
        title: 'Cập nhật danh mục',
        message: `Admin đã cập nhật thông tin danh mục "${name}" (ID: #${category_id}).`,
        type: 'system',
        created_by: 'admin',
        link: `/editCategory/${category_id}`
      });
    } catch (notiError) {
      logger.error('Lỗi khi lưu log cập nhật danh mục', { error: notiError.message });
    }

    logger.info('Cập nhật danh mục thành công', { category_id, name });
    res.redirect(`/editCategory/${category_id}?message=${encodeURIComponent('Cập nhật thành công')}`);
  } catch (error) {
    logger.error('Lỗi khi cập nhật danh mục', { error: error.message, stack: error.stack, body: req.body });
    const redirectId = category_id || '';
    res.redirect(`/editCategory/${redirectId}?message=${encodeURIComponent(error.message)}`);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// API /////////////////////////////////////////////////

const getAllCategoryAPI = async (req, res) => {
  try {
    const data = await categoryModel.getAllCategoryAPI();
    return res.status(200).json({
      errCode: 0,
      message: "Success",
      categories: data
    });
  } catch (error) {
    logger.error('Lỗi trong getAllCategoryAPI', { error: error.message, stack: error.stack });
    return res.status(500).json({
      errCode: 1,
      message: "Internal server error"
    });
  }
};

export default {
  createCategory,
  addCategory,
  listCategory,
  deleteCategory,
  editCategory,
  updateCategory,
  getAllCategoryAPI
};