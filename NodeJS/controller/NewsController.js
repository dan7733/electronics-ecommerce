import express from "express";
import fs from 'fs';
import path from 'path';
import newsModel from '../models/newsModel.js';
import { log } from "console";


// Hàm xóa ảnh nếu cần
const deleteNewsImage = (filename) => {
  if (!filename) return;
  try {
    const filePath = path.resolve(`images/news/${filename}`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error(`Lỗi khi xóa ảnh: ${error.message}`);
  }
};


// tải trang thêm sản phẩm
const createNews = async (req, res) => {
  try {
    res.render('home', {
      data: {
        title: 'Create News Product',
        page: 'addNews',
      }
    });
  } catch (err) {
    console.log(err)
  }
}

const addNews = async (req, res) => {
    try {
      const { newsTitle, newsSummary, newsContent } = req.body;
      const images = req.file?.filename || null;
  
      if (!newsTitle || !newsContent) {
        deleteNewsImage(images); 
        return res.render("home", { 
            data: { page: 'addnews', message: "Tiêu đề và nội dung tin tức không được để trống!" } 
          });
      }
      const result = await newsModel.addNews(
        newsTitle, 
        newsSummary, 
        newsContent, 
        images
      );
  
      if(!result) {
        deleteNewsImage(images); 
      }

      res.render("home", {
        data: {
          page: 'addnews',
          message: result 
            ? "Thêm tin tức thành công!" 
            : "Thêm tin tức thất bại, vui lòng thử lại."
        }
      });

  
  
    } catch (error) {
      console.error('Lỗi khi thêm tin tức:', error);
      deleteNewsImage(req.file?.filename); 
      res.status(500).send('Có lỗi xảy ra khi thêm tin tức.');
    }
  };


  // danh sách tin tức 
  // danh sách tin tức
const listNews = async (req, res) => {
  try {
    // Lấy trang hiện tại từ query string, mặc định là 1
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // số lượng tin tức trên mỗi trang
    const offset = (page - 1) * limit; // vị trí bắt đầu lấy tin tức

    // Lấy từ khóa tìm kiếm từ query string, mặc định là rỗng
    const searchKeyword = req.query.search || '';

    // Lấy tùy chọn sắp xếp từ query string, mặc định là 'default'
    const sortOption = req.query.sort || 'default';

    // Lấy tổng số tin tức
    const totalNews = await newsModel.countNews(searchKeyword);

    // Tính tổng số trang
    const totalPages = Math.ceil(totalNews / limit);

    // Nhận message từ URL nếu có
    const message = req.query.message || '';  

    // Lấy danh sách tin tức
    const listNews = await newsModel.listNews(offset, limit, searchKeyword, sortOption);

    res.render('home', {
      data: {
        title: 'List News',
        page: 'listNews',
        rows: listNews,
        currentPage: page,
        totalPages: totalPages,
        message: message,
        search: searchKeyword,
        sort: sortOption
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Lỗi khi tải dữ liệu tin tức.");
  }
};

// xóa
// Xóa
const deleteNews = async (req, res) => {
  try {
    const { news_id } = req.body;
    const image = await newsModel.deleteNews(news_id);
    
    if (image) {
      deleteNewsImage(image); // Hàm này xóa ảnh khỏi thư mục nếu có
    }

    res.redirect('/listnews?message=Xóa thành công');
  } catch (error) {
    console.error(error);
    res.redirect('/listnews?message=Xóa thất bại');
  }
};

// lấy chi tiết tin tức
const editNews = async (req, res) => {
  const { newsid } = req.params;
  const news = await newsModel.getNewsById(newsid);
  const message = req.query.message || '';
  return res.render('home', {
    data: {
      title: 'Update News',
      page: 'updatenews',
      news: news,
      message: message
    }
  });
};

// Cập nhật tin tức
const updateNews = async (req, res) => {
  try {
    const { news_id, newsTitle, newsSummary, newsContent, oldnewsImage } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!news_id || !newsTitle || !newsContent) {
      throw new Error("Thiếu thông tin bắt buộc: news_id, tiêu đề hoặc nội dung");
    }


    // Giữ lại ảnh cũ nếu không có ảnh mới
    let newImage = oldnewsImage;
    if (req.file) {
      newImage = req.file.filename;
    }

    // Xóa ảnh cũ nếu có ảnh mới khác
    if (oldnewsImage && newImage !== oldnewsImage) {
      deleteNewsImage(oldnewsImage);
    }

    // Cập nhật tin tức
    const updatedNews = await newsModel.updateNews(news_id, newsTitle, newsSummary, newsContent, newImage);
    if (!updatedNews) {
      throw new Error("Cập nhật thất bại");
    }

    return res.redirect(`/editnews/${news_id}?message=Cập nhật thành công`);
  } catch (error) {
    console.error("Lỗi cập nhật tin tức:", error);

    // Nếu có ảnh mới, nhưng lỗi xảy ra -> Xóa ảnh mới để tránh rác
    if (req.file) {
      deleteNewsImage(req.file.filename);
    }

    return res.redirect(`/editnews?message=${encodeURIComponent(error.message)}`);
  }
};




//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////
const getLatestNewsAPI = async (req, res) => {
  try {
    const data = await newsModel.getLatestNewsAPI();
    return res.status(200).json({
      errCode: 0,
      message: "Success",
      news: data
    });
  } catch (error) {
    console.error('Error in news:', error);
    return res.status(500).json({
      errCode: 1,
      message: "Internal server error"
    });
  }
};

// danh sách tin tức
const listNewsAPI = async (req, res) => {
  try {
    // Lấy trang hiện tại từ query string, mặc định là 1
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // số lượng tin tức trên mỗi trang
    const offset = (page - 1) * limit; // vị trí bắt đầu lấy tin tức

    // Lấy từ khóa tìm kiếm từ query string, mặc định là rỗng
    const searchKeyword = req.query.search || '';

    // Lấy tùy chọn sắp xếp từ query string, mặc định là 'default'
    const sortOption = req.query.sort || 'default';

    // Lấy tổng số tin tức
    const totalNews = await newsModel.countNewsAPI(searchKeyword);

    // Tính tổng số trang
    const totalPages = Math.ceil(totalNews / limit);

    // Lấy danh sách tin tức
    const listNews = await newsModel.listNewsAPI(offset, limit, searchKeyword, sortOption);

    // Trả về JSON thành công
    return res.status(200).json({
      errCode: 0,
      message: "Success",
      products: {
        rows: listNews,
        currentPage: page,
        totalPages: totalPages,
        search: searchKeyword,
        sort: sortOption
      }
    });
  } catch (error) {
    console.error(error);
    // Trả về JSON lỗi
    return res.status(500).json({
      errCode: 1,
      message: "Lỗi khi tải dữ liệu tin tức.",
      products: null
    });
  }
};


// lấy chi tiết tin tức
const getNewsByIdAPI = async (req, res) => {
  try {
    const { newsid } = req.params;
    const news = await newsModel.getNewsById(newsid);
    
    if (!news) {
      return res.status(404).json({
        errCode: 1,
        message: "Không tìm thấy tin tức.",
        news: null
      });
    }
    return res.status(200).json({
      errCode: 0,
      message: "Lấy dữ liệu tin tức thành công.",
      news: news
    });
  } catch (error) {
    return res.status(500).json({
      errCode: 1,
      message: "Lỗi khi tải dữ liệu tin tức.",
      news: null
    });
  }
};



export default {
    createNews,
    addNews,
    listNews,
    deleteNews,
    editNews,
    updateNews,
    //API
    getLatestNewsAPI,
    listNewsAPI,
    getNewsByIdAPI
  };