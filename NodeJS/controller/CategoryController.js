import express from "express";
import categoryModel from '../models/categoryModel.js'  // Import model để xử lý với CSDL hoặc logic nghiệp vụ
// import { body, validationResult } from 'express-validator';


// tải trang thêm loại sản phẩm
const createCategory = async (req, res) => {
  return res.render('home', {
    data: {
      title: 'List Category',
      page: 'addCategory',
    }
  })
}

// thêm loại sản phẩm
const addCategory = async (req, res) => {
  try {
    const { categoryName, icon, highlight } = req.body;
    const result = await categoryModel.addCategory(categoryName, icon, highlight);
    res.render("home", {
      data: {
        page: 'addCategory',
        message: result ? "Thêm danh mục thành công!" : "Thêm danh mục thất bại, vui lòng thử lại."
      }
    });
  } catch (error) {
    console.error('Lỗi khi thêm danh mục:', error);
    res.status(500).send('Có lỗi xảy ra khi thêm danh mục.');
  }
}

// const getAllNhom = async (req, res) => {
//   let categorys = await userModel.getAllNhom();
//   return res.status(200).json({
//     errCode: 1,
//     message: "Success",
//     categorys: categorys
//   })
// }

// danh sách loại sản phẩm bao gồm phân trang, tìm kiếm và sắp xếp
const listCategory = async (req, res) => {
  try {
      // Lấy trang hiện tại từ query string, mặc định là 1
      const page = parseInt(req.query.page) || 1;
      const limit = 5; // số lượng sản phẩm trên mỗi trang
      const offset = (page - 1) * limit; // offset: vị trí bắt đầu lấy sản phẩm
      // lấy từ khóa tìm kiếm từ query string, mặc định là rỗng
      const searchKeyword = req.query.search || '';
      // lấy tùy chọn sắp xếp từ query string, mặc định là 'default'
      const sortOption = req.query.sort || 'default';
      // lấy tổng số loại sản phẩm
      const totalCategory = await categoryModel.countCategory(searchKeyword);
      // tính tổng số trang
      const totalPages = Math.ceil(totalCategory / limit);
      // lấy danh sách loại sản phẩm
      const message = req.query.message || '';  // Nhận message từ URL nếu có
      // lấy danh sách loại sản phẩm
      const Listcategory = await categoryModel.listCategory(offset, limit, searchKeyword, sortOption);
      res.render('home', {
          data: {
              title: 'List Category',
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
      console.error(error);
      res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

// Xóa loại sản phẩm
const deleteCategory = async (req, res) => {
  try {
    const { category_id } = req.body;
    await categoryModel.deleteCategory(category_id);
    res.redirect('/listcategory?message=Xóa thành công');
  } catch (error) {
    console.error(error);
    res.redirect('/listcategory?message=Xóa thất bại');
  }
};

//cập nhật loại(nhóm) sản phẩm
//tải trang cập nhật loại sản phẩm
const editCategory = async (req, res) => {
  const { categoryid } = req.params;
  const category = await categoryModel.getCategoryByid(categoryid)
  const message = req.query.message || '';
  return res.render('home', {
    data: {
      title: 'Update Category',
      page: 'updateCategory',
      category: category,
      message: message
    }
  })
}

const updateCategory = async (req, res) => {
  try{
    const { category_id, name, icon, highlight} = req.body;
    await categoryModel.updateCategory(category_id, name, icon, highlight);
    res.redirect(`/editCategory/${category_id}?message=Cập nhật thành công`);
  }catch (error) {
    console.error(error);
    res.redirect(`/editCategory/${category_id}?message=Cập nhật thất bại`);
  }
}


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////


const getAllCategoryAPI = async (req, res) => {
  try {
    const data = await categoryModel.getAllCategoryAPI();
    return res.status(200).json({
      errCode: 0,
      message: "Success",
      categories: data
    });
  } catch (error) {
    console.error('Error in getAllCategoryAPI:', error);
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
  // API
  getAllCategoryAPI
}