// controller/OrderController.js
import express from "express";
import orderdetailModel from '../models/orderdetailModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import { sendOrderConfirmationEmail, sendZaloPayConfirmationEmail } from '../configs/email.js';
import stockModel from '../models/stockModel.js';
import { StockHistory } from '../models/stockhistoryModel.js'; // Thêm import StockHistory
import axios from 'axios';
import CryptoJS from 'crypto-js';
import moment from 'moment';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// ZaloPay configuration
const zalopayConfig = {
  app_id: "2553",
  key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
  key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
  endpoint: "https://sb-openapi.zalopay.vn/v2/create",
  query_endpoint: "https://sb-openapi.zalopay.vn/v2/query",
  callback_url: "https://80c6-2405-4803-dad3-6c90-b4ed-2ed9-3d02-f66a.ngrok-free.app/api/v1/zalopay-callback"
};

const addOrderAPI = async (req, res) => {
  try {
    const { userId, totalPrice, address, phone, email, note, status = 'pending', paymentMethod, orderDetails } = req.body;

    if (!userId || !totalPrice || !address || !phone) {
      return res.status(400).json({
        errCode: 2,
        message: "Thông tin đơn hàng không được để trống!"
      });
    }

    const user = await userModel.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        errCode: 3,
        message: "Người dùng không tồn tại!"
      });
    }

    if (orderDetails && orderDetails.length > 0) {
      for (const detail of orderDetails) {
        const stock = await stockModel.getStockByProductIdAPI(detail.productId);
        if (!stock || stock.quantity < detail.quantity) {
          return res.status(400).json({
            errCode: 4,
            message: `Sản phẩm với ID ${detail.productId} không đủ tồn kho!`
          });
        }
      }
    }

    const result = await orderModel.addOrderAPI(userId, totalPrice, status, paymentMethod === 'zalopay' ? 'waiting_payment' : 'pending', address, phone, email, note);
    if (!result) {
      return res.status(500).json({
        errCode: 1,
        message: "Thêm đơn hàng thất bại, vui lòng thử lại."
      });
    }

    const orderId = result.order_id;
    if (orderDetails && orderDetails.length > 0) {
      for (const detail of orderDetails) {
        await orderdetailModel.addOrderDetailAPI(orderId, detail.productId, detail.quantity, detail.price, detail.discount_price);
        const stockUpdate = await stockModel.updateStock(detail.productId, 0, detail.quantity);
        // Thêm bản ghi vào StockHistory
        if (stockUpdate) {
          await StockHistory.create({
            product_id: detail.productId,
            stock_id: stockUpdate.stock_id,
            transaction_type: 'OUT',
            quantity: detail.quantity,
            transaction_date: new Date()
          });
        }
      }
    }
    if (paymentMethod === 'zalopay') {
      const transID = `${moment().format('YYMMDD')}_${orderId}_${Math.floor(Math.random() * 1000000)}`;
      const orderData = {
        app_id: zalopayConfig.app_id,
        app_trans_id: transID,
        app_user: user.fullname || user.username,
        app_time: Date.now(),
        item: JSON.stringify(orderDetails.map(detail => ({
          itemid: detail.productId,
          itename: `Sản phẩm ${detail.productId}`,
          itemprice: detail.discount_price || detail.price,
          itemquantity: detail.quantity
        }))),
        embed_data: JSON.stringify({ order_id: orderId }),
        amount: totalPrice,
        description: `Thanh toán đơn hàng #${orderId}`,
        bank_code: "",
        callback_url: zalopayConfig.callback_url
      };

      const data = `${zalopayConfig.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
      orderData.mac = CryptoJS.HmacSHA256(data, zalopayConfig.key1).toString();

      try {
        const response = await axios.post(zalopayConfig.endpoint, null, { params: orderData });
        const { return_code, order_url, zp_trans_token } = response.data;
        console.log('ZaloPay API response:', response.data);

        if (return_code === 1) {
          return res.status(200).json({
            errCode: 0,
            message: "Đơn hàng đã được tạo, chuyển hướng đến ZaloPay để thanh toán.",
            order_url,
            zp_trans_token,
            app_trans_id: transID
          });
        } else {
          await orderModel.destroy({ where: { order_id: orderId } });
          return res.status(500).json({
            errCode: 5,
            message: "Tạo đơn hàng ZaloPay thất bại."
          });
        }
      } catch (error) {
        console.error('Lỗi khi gọi API ZaloPay:', error);
        await orderModel.destroy({ where: { order_id: orderId } });
        return res.status(500).json({
          errCode: 5,
          message: "Lỗi khi gọi API ZaloPay."
        });
      }
    }

    if (email && paymentMethod !== 'zalopay') {
      try {
        await sendOrderConfirmationEmail(email, orderId, user.fullname, totalPrice, address, phone);
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
      }
    }

    return res.status(201).json({
      errCode: 0,
      message: "Thêm đơn hàng thành công!",
      orderId
    });
  } catch (error) {
    console.error('Lỗi khi thêm đơn hàng:', error);
    return res.status(500).json({
      errCode: 1,
      message: "Internal server error"
    });
  }
};

// Các hàm khác giữ nguyên
const listOrder = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    const searchKeyword = req.query.search || '';
    const sortOption = req.query.sort || 'default';

    const totalOrders = await orderModel.countOrder(searchKeyword);
    const totalPages = Math.ceil(totalOrders / limit);
    const listOrders = await orderModel.listOrder(offset, limit, searchKeyword, sortOption);
    const message = req.query.message || '';

    res.render('home', {
      data: {
        title: 'Danh sách đơn hàng',
        page: 'listOrder',
        rows: listOrders,
        currentPage: page,
        totalPages: totalPages,
        message: message,
        search: searchKeyword,
        sort: sortOption
      }
    });
  } catch (error) {
    console.error('Lỗi khi tải danh sách đơn hàng:', error);
    res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

const editOrder = async (req, res) => {
  try {
    const { orderid } = req.params;
    const order = await orderModel.getOrderById(orderid);
    if (!order) {
      return res.status(404).send("Đơn hàng không tồn tại.");
    }
    const orderDetails = await orderdetailModel.getOrderDetailsByOrderId(orderid);
    const message = req.query.message || '';

    return res.render('home', {
      data: {
        title: 'Cập nhật đơn hàng',
        page: 'updateOrder',
        order: order,
        orderDetails: orderDetails,
        message: message
      }
    });
  } catch (error) {
    console.error('Lỗi khi tải thông tin đơn hàng:', error);
    res.status(500).send("Lỗi khi tải dữ liệu.");
  }
};

const updateOrder = async (req, res) => {
  const { order_id } = req.body;  // <-- lấy ở ngoài luôn nè
  try {
    const { status, status_payment } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (status_payment) updates.status_payment = status_payment;

    await orderModel.updateOrder(order_id, updates);
    res.redirect(`/editOrder/${order_id}?message=Cập nhật đơn hàng thành công`);
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn hàng:', error);
    res.redirect(`/editOrder/${order_id}?message=Cập nhật đơn hàng thất bại`);
  }
};


const downloadOrderPDF = async (req, res) => {
  try {
    const { orderid } = req.params;
    const order = await orderModel.getOrderById(orderid);
    if (!order) {
      return res.status(404).send("Đơn hàng không tồn tại.");
    }
    const orderDetails = await orderdetailModel.getOrderDetailsByOrderId(orderid);
    if (!orderDetails || !Array.isArray(orderDetails)) {
      console.error('Order details invalid:', orderDetails);
      return res.status(500).send('Lỗi: Chi tiết đơn hàng không hợp lệ.');
    }

    // Tạo PDF
    const doc = new PDFDocument({ margin: 50 });
    const filename = `order_${orderid}.pdf`;
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    // Đăng ký font
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Arial.ttf');
    if (!fs.existsSync(fontPath)) {
      console.error('Font file not found:', fontPath);
      return res.status(500).send('Lỗi: Không tìm thấy font Arial.');
    }
    doc.registerFont('Arial', fontPath);
    doc.font('Arial');

    // Gửi PDF
    doc.pipe(res);

    // Hàm quản lý màu sắc
    let currentFillColor = '#333';
    const setFillColor = (color) => {
      if (currentFillColor !== color) {
        doc.fillColor(color);
        currentFillColor = color;
      }
    };

    // Hàm cắt ngắn văn bản
    const truncateText = (text, maxLength) => {
      if (typeof text !== 'string') return 'N/A';
      if (text.length > maxLength) {
        return text.substring(0, maxLength - 3) + '...';
      }
      return text;
    };

    // Header cửa hàng
    setFillColor('#218282');
    doc.fontSize(16).text('ESHOP - Cửa hàng điện tử', 50, 50, { align: 'center' });
    setFillColor('#333');
    doc.fontSize(10).text(
      'Email: eshop.service.electronics@gmail.com | Website: http://localhost:3001/',
      50,
      70,
      { align: 'center' }
    );
    doc.moveDown(2);

    // Tiêu đề
    setFillColor('#218282');
    doc.fontSize(18).text('Chi tiết đơn hàng', 50, doc.y, { align: 'center' });
    doc.moveDown();

    // Ngày tạo đơn hàng
    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('vi-VN')
      : new Date().toLocaleDateString('vi-VN');
    setFillColor('#333');
    doc.fontSize(10).text(`Ngày tạo đơn: ${orderDate}`, 50, doc.y, { align: 'right' });
    doc.moveDown();

    // Thông tin đơn hàng
    setFillColor('#218282');
    doc.fontSize(12).text('Thông tin đơn hàng', 50, doc.y, { underline: true });
    setFillColor('#333');
    doc.fontSize(10);
    doc.text(`Mã đơn hàng: ${order.order_id}`, 50, doc.y);
    doc.text(`Tên khách hàng: ${order.User ? order.User.fullname : 'N/A'}`, 50, doc.y);
    doc.text(`Tổng giá: ${order.total_price.toFixed(2)} VND`, 50, doc.y);
    doc.text(`Địa chỉ: ${order.address || 'N/A'}`, 50, doc.y);
    doc.text(`Số điện thoại: ${order.phone || 'N/A'}`, 50, doc.y);
    doc.text(`Email: ${order.email || 'N/A'}`, 50, doc.y);
    doc.text(`Ghi chú: ${order.note || 'Không có'}`, 50, doc.y);
    doc.text(`Trạng thái: ${order.status === 'pending' ? 'Đang chờ' :
                         order.status === 'confirmed' ? 'Đã xác nhận' :
                         order.status === 'shipped' ? 'Đang giao' :
                         order.status === 'delivered' ? 'Đã giao' :
                         order.status === 'cancelled' ? 'Đã hủy' : order.status}`, 50, doc.y);
    doc.text(`Trạng thái thanh toán: ${order.status_payment === 'waiting_payment' ? 'Đang chờ thanh toán' :
                                     order.status_payment === 'paid' ? 'Đã thanh toán' :
                                     order.status_payment === 'failed' ? 'Thanh toán thất bại' : 'N/A'}`, 50, doc.y);
    doc.moveDown(2);

    // Chi tiết đơn hàng (bảng)
    setFillColor('#218282');
    doc.fontSize(12).text('Chi tiết đơn hàng', 50, doc.y, { underline: true });
    setFillColor('#333');
    doc.fontSize(9);

    // Định nghĩa cột
    const tableTop = doc.y + 10;
    const col1 = 50;  // Sản phẩm
    const col2 = 250; // Số lượng
    const col3 = 290; // Giá
    const col4 = 390; // Tổng

    // Header bảng
    doc.fillColor('#e8f4f8').rect(col1 - 5, tableTop - 5, 440, 20).fill();
    setFillColor('#218282');
    doc.text('Sản phẩm', col1, tableTop, { width: 200 });
    doc.text('Số lượng', col2, tableTop, { width: 40, align: 'right' });
    doc.text('Giá', col3, tableTop, { width: 100, align: 'right' });
    doc.text('Tổng', col4, tableTop, { width: 100, align: 'right' });

    // Dữ liệu bảng
    let y = tableTop + 25;
    orderDetails.forEach(detail => {
      setFillColor('#333');
      doc.text(
        truncateText(detail.Product && detail.Product.name ? detail.Product.name : detail.product_id, 60),
        col1,
        y,
        { width: 200, align: 'left', lineBreak: true }
      );
      doc.text(detail.quantity.toString(), col2, y, { width: 40, align: 'right' });
      doc.text(`${detail.price.toFixed(2)} VND`, col3, y, { width: 100, align: 'right' });
      doc.text(
        `${(detail.price * detail.quantity).toFixed(2)} VND`,
        col4,
        y,
        { width: 100, align: 'right' }
      );
      y += 25;
    });

    // Tổng hợp chi phí
    doc.moveDown(2);
    setFillColor('#218282');
    doc.fontSize(12).text('Tổng hợp chi phí', 50, doc.y, { underline: true });
    setFillColor('#333');
    doc.fontSize(10);
    const totalBeforeDiscount = orderDetails.reduce(
      (sum, detail) => sum + detail.price * detail.quantity,
      0
    );
    const labelX = 50;
    const valueX = 400;
    doc.text('Tổng giá:', labelX, doc.y);
    doc.text(`${totalBeforeDiscount.toFixed(2)} VND`, valueX, doc.y, { align: 'right', width: 100 });
    doc.text('Tổng thanh toán:', labelX, doc.y);
    doc.text(`${order.total_price.toFixed(2)} VND`, valueX, doc.y, { align: 'right', width: 100 });

    // Lời cảm ơn và hỗ trợ
    doc.moveDown(2);
    setFillColor('#218282');
    doc.fontSize(12).text('Cảm ơn quý khách đã mua sắm tại ESHOP!', 50, doc.y, { align: 'center' });
    setFillColor('#333');
    doc.fontSize(10).text(
      'Liên hệ hỗ trợ: eshop.service.electronics@gmail.com | Hotline: 0123 456 789',
      50,
      doc.y,
      { align: 'center', width: 500 }
    );

    // Footer
    setFillColor('#333');
    doc.fontSize(8).text('Trang 1', 50, doc.page.height - 50, { align: 'left' });

    // Kết thúc PDF
    doc.end();
  } catch (error) {
    console.error('Lỗi khi tạo PDF:', error);
    res.status(500).send('Lỗi khi tạo PDF.');
  }
};

const zalopayCallback = async (req, res) => {
  try {
    console.log('Received ZaloPay callback:', req.body);
    const { data, mac } = req.body;
    const calculatedMac = CryptoJS.HmacSHA256(data, zalopayConfig.key2).toString();
    console.log('Calculated MAC:', calculatedMac, 'Received MAC:', mac);

    if (calculatedMac !== mac) {
      console.error('Invalid MAC');
      return res.json({ return_code: -1, return_message: "Invalid MAC" });
    }

    if (!data || typeof data !== 'string') {
      console.error('Invalid data format');
      return res.json({ return_code: 0, return_message: 'Invalid data format' });
    }
    const dataJson = JSON.parse(data);
    console.log('Parsed data:', dataJson);

    if (!dataJson.embed_data || typeof dataJson.embed_data !== 'string') {
      console.error('Invalid embed_data format');
      return res.json({ return_code: 0, return_message: 'Invalid embed_data format' });
    }
    const embedData = JSON.parse(dataJson.embed_data);
    const orderId = embedData.order_id;
    console.log('Order ID:', orderId);

    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      console.error(`Order ${orderId} not found`);
      return res.json({ return_code: 0, return_message: `Order ${orderId} not found` });
    }

    // Gọi API Query để kiểm tra trạng thái giao dịch
    const reqdate = moment().format('YYYYMMDDHHmmss');
    const queryData = {
      app_id: zalopayConfig.app_id,
      app_trans_id: dataJson.app_trans_id,
      reqdate: reqdate
    };
    const queryString = `${queryData.app_id}|${queryData.app_trans_id}|${zalopayConfig.key1}`;
    queryData.mac = CryptoJS.HmacSHA256(queryString, zalopayConfig.key1).toString();
    console.log('Query data sent to ZaloPay:', queryData);

    let retryCount = 0;
    const maxRetries = 3;
    while (retryCount < maxRetries) {
      try {
        const queryResponse = await axios.post(zalopayConfig.query_endpoint, null, { params: queryData });
        const { return_code, is_processing } = queryResponse.data;
        console.log('ZaloPay query response:', queryResponse.data);

        if (return_code === 1 && !is_processing) {
          console.log(`Updating order ${orderId} to paid`);
          await orderModel.updateOrder(orderId, { 
            status_payment: 'paid',
            status: 'confirmed'
          });          
          // Gửi email xác nhận thanh toán ZaloPay
          if (order.email) {
            try {
              await sendZaloPayConfirmationEmail(
                order.email,
                orderId,
                order.User ? order.User.fullname : 'Khách hàng',
                order.total_price,
                order.address,
                order.phone,
                Date.now()
              );
            } catch (emailError) {
              console.error('Failed to send ZaloPay confirmation email:', emailError);
            }
          }
        } else {
          console.log(`Updating order ${orderId} to failed`);
          await orderModel.updateOrder(orderId, { status_payment: 'failed' });
        }
        break;
      } catch (queryError) {
        console.error(`Retry ${retryCount + 1}/${maxRetries} - Error querying ZaloPay status:`, queryError.response ? queryError.response.data : queryError.message);
        retryCount++;
        if (retryCount === maxRetries) {
          console.log(`Keeping order ${orderId} as waiting_payment after ${maxRetries} retries`);
          return res.json({ return_code: 0, return_message: 'Failed to query transaction status, order remains pending' });
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return res.json({ return_code: 1, return_message: "Success" });
  } catch (error) {
    console.error('Error in ZaloPay callback:', error);
    return res.json({ return_code: 0, return_message: error.message });
  }
};

const queryOrderStatus = async (req, res) => {
  try {
    const { app_trans_id } = req.params;
    const reqdate = moment().format('YYYYMMDDHHmmss');
    const queryData = {
      app_id: zalopayConfig.app_id,
      app_trans_id,
      reqdate: reqdate
    };
    const queryString = `${queryData.app_id}|${queryData.app_trans_id}|${zalopayConfig.key1}`;
    queryData.mac = CryptoJS.HmacSHA256(queryString, zalopayConfig.key1).toString();
    console.log('Query data sent to ZaloPay:', queryData);

    const response = await axios.post(zalopayConfig.query_endpoint, null, { params: queryData });
    const { return_code, is_processing } = response.data;
    console.log('ZaloPay query response:', response.data);

    if (return_code === 1 && !is_processing) {
      const embedData = JSON.parse(response.data.embed_data || '{}');
      const orderId = embedData.order_id;
      if (orderId) {
        await orderModel.updateOrder(orderId, { status_payment: 'paid' });
        // Gửi email xác nhận thanh toán ZaloPay
        const order = await orderModel.getOrderById(orderId);
        if (order && order.email) {
          try {
            await sendZaloPayConfirmationEmail(
              order.email,
              orderId,
              order.User ? order.User.fullname : 'Khách hàng',
              order.total_price,
              order.address,
              order.phone,
              Date.now()
            );
          } catch (emailError) {
            console.error('Failed to send ZaloPay confirmation email:', emailError);
          }
        }
      }
    } else {
      const embedData = JSON.parse(response.data.embed_data || '{}');
      const orderId = embedData.order_id;
      if (orderId) {
        await orderModel.updateOrder(orderId, { status_payment: 'failed' });
      }
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error querying ZaloPay:', error.response ? error.response.data : error.message);
    res.status(500).json({ errCode: 1, message: 'Error querying ZaloPay' });
  }
};

const listOrderAPI = async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const offset = (page - 1) * limit;
      const sortOption = req.query.sort || 'default';
      const username = req.query.username;
      const status = req.query.status || null;

      if (!username) {
          return res.status(400).json({
              errCode: 1,
              message: "Thiếu tham số username."
          });
      }

      const totalOrders = await orderModel.countOrderAPI(username, status);
      const totalPages = Math.ceil(totalOrders / limit);
      const listOrders = await orderModel.listOrderAPI(username, status, offset, limit, sortOption);

      return res.status(200).json({
          errCode: 0,
          message: "Success",
          data: {
              orders: listOrders,
              currentPage: page,
              totalPages: totalPages,
              totalOrders: totalOrders
          }
      });
  } catch (error) {
      console.error('Lỗi khi tải danh sách đơn hàng:', error);
      return res.status(500).json({
          errCode: 1,
          message: "Lỗi khi tải danh sách đơn hàng."
      });
  }
};

const getDetailOrderbyIdAPI = async (req, res) => {
  try {
      const { orderid } = req.params;

      const order = await orderModel.getOrderByIdAPI(orderid);
      if (!order) {
          return res.status(404).json({
              errCode: 1,
              message: "Đơn hàng không tồn tại."
          });
      }

      const orderDetails = await orderdetailModel.getOrderDetailsByOrderIdAPI(orderid);

      return res.status(200).json({
          errCode: 0,
          message: "Success",
          data: {
              order: order,
              orderDetails: orderDetails
          }
      });
  } catch (error) {
      console.error('Lỗi khi tải thông tin đơn hàng:', error);
      return res.status(500).json({
          errCode: 1,
          message: "Lỗi khi tải dữ liệu."
      });
  }
};

export default { 
  listOrder,
  editOrder,
  updateOrder,
  addOrderAPI,
  zalopayCallback,
  queryOrderStatus,
  downloadOrderPDF,
  listOrderAPI,
  getDetailOrderbyIdAPI
};