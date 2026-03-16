import express from "express";
import stockModel from "../models/stockModel.js";
import { StockHistory } from "../models/stockhistoryModel.js";
import stockHistoryModel from "../models/stockhistoryModel.js";
import { Product } from "../models/productModel.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const listStock = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;
        const searchKeyword = req.query.search || '';
        const sortOption = req.query.sort || 'default';

        const totalStock = await stockModel.countStock(searchKeyword);
        const totalPages = Math.ceil(totalStock / limit);
        const message = req.query.message || '';
        const listStock = await stockModel.listStock(offset, limit, searchKeyword, sortOption);

        res.render('home', {
            data: {
                title: 'List Stock',
                page: 'listStock',
                rows: listStock,
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

const editStock = async (req, res) => {
    try {
        const { productid } = req.params;
        const result = await stockModel.getStockByProductId(productid);
        const message = req.query.message || '';
        res.render('home', {
            data: {
                title: 'Cập nhật chi tiết sản phẩm',
                page: 'updatestock',
                stock: result,
                message: message,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Lỗi khi tải dữ liệu.");
    }
};

const updateStock = async (req, res) => {
    try {
        const { product_id, stock_in = 0, stock_out = 0 } = req.body;
        const stockInNum = Number(stock_in) || 0;
        const stockOutNum = Number(stock_out) || 0;

        const stock = await stockModel.getStockByProductId(product_id);
        if (!stock) {
            console.warn(`❌ Không tìm thấy kho cho sản phẩm ID: ${product_id}`);
            return res.status(404).send(`Không tìm thấy kho cho sản phẩm ID: ${product_id}`);
        }

        const newQuantity = stock.quantity + stockInNum - stockOutNum;
        if (newQuantity < 0) {
            console.warn(`⚠️ Xuất kho vượt quá tồn kho hiện tại (Hiện có: ${stock.quantity}, Cần xuất: ${stockOutNum})`);
            return res.redirect(`/editstock/${product_id}?message=Số lượng xuất vượt quá tồn kho hiện tại!`);
        }

        const result = await stockModel.updateStock(product_id, stockInNum, stockOutNum);
        if (!result) {
            console.warn(`❌ Cập nhật tồn kho thất bại cho sản phẩm ID: ${product_id}`);
            return res.redirect(`/editstock/${product_id}?message=Cập nhật thất bại!`);
        }

        if (stockInNum > 0) {
            await StockHistory.create({
                product_id,
                stock_id: result.stock_id,
                transaction_type: 'IN',
                quantity: stockInNum,
                transaction_date: new Date()
            });
        }
        if (stockOutNum > 0) {
            await StockHistory.create({
                product_id,
                stock_id: result.stock_id,
                transaction_type: 'OUT',
                quantity: stockOutNum,
                transaction_date: new Date()
            });
        }

        console.log(`✅ Cập nhật tồn kho thành công cho sản phẩm ID: ${product_id}`);
        return res.redirect(`/editstock/${product_id}?message=Cập nhật tồn kho thành công!`);
    } catch (error) {
        console.error('🔥 Lỗi khi cập nhật tồn kho:', error);
        return res.redirect(`/editstock/${product_id}?message=Lỗi khi cập nhật tồn kho!`);
    }
};

const listStockHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 5; // Đồng bộ với listStock
        const offset = (page - 1) * limit;
        const searchKeyword = req.query.search || '';
        const productId = req.query.productId || null;
        const transactionType = req.query.transactionType || null;
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;
        const message = req.query.message || '';

        const products = await Product.findAll({
            attributes: ['product_id', 'name'],
            order: [['name', 'ASC']]
        });

        const totalHistory = await stockHistoryModel.countStockHistory(searchKeyword, productId, transactionType, startDate, endDate);
        const totalPages = Math.ceil(totalHistory / limit);
        const history = await stockHistoryModel.listStockHistory(offset, limit, searchKeyword, productId, transactionType, startDate, endDate);

        res.render('home', {
            data: {
                title: 'Lịch sử nhập/xuất kho',
                page: 'listStockHistory',
                rows: history,
                products: products,
                currentPage: page,
                totalPages: totalPages,
                message: message,
                search: searchKeyword,
                productId: productId,
                transactionType: transactionType,
                startDate: startDate,
                endDate: endDate
            }
        });
    } catch (error) {
        console.error('Lỗi khi tải lịch sử giao dịch:', error);
        res.status(500).send("Lỗi khi tải lịch sử giao dịch.");
    }
};

const exportStockHistoryPDF = async (req, res) => {
    try {
        const searchKeyword = req.query.search || '';
        const productId = req.query.productId || null;
        const transactionType = req.query.transactionType || null;
        const startDate = req.query.startDate || null;
        const endDate = req.query.endDate || null;

        const history = await stockHistoryModel.listStockHistory(null, null, searchKeyword, productId, transactionType, startDate, endDate);

        // Tạo PDF
        const doc = new PDFDocument({ margin: 50 });
        const filename = `stock_history_${Date.now()}.pdf`;
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
        doc.fontSize(18).text('Lịch sử nhập/xuất kho', 50, doc.y, { align: 'center' });
        doc.moveDown();

        // Ngày xuất PDF
        const exportDate = new Date().toLocaleDateString('vi-VN');
        setFillColor('#333');
        doc.fontSize(10).text(`Ngày xuất: ${exportDate}`, 50, doc.y, { align: 'right' });
        doc.moveDown();

        // Thông tin bộ lọc
        setFillColor('#218282');
        doc.fontSize(12).text('Thông tin bộ lọc', 50, doc.y, { underline: true });
        setFillColor('#333');
        doc.fontSize(10);
        doc.text(`Tìm kiếm: ${searchKeyword || 'Tất cả'}`, 50, doc.y);
        if (productId) {
            const product = await Product.findOne({ where: { product_id: productId }, attributes: ['name'] });
            doc.text(`Sản phẩm: ${product ? product.name : 'Không xác định'}`, 50, doc.y);
        }
        doc.text(`Loại giao dịch: ${transactionType ? (transactionType === 'IN' ? 'Nhập' : 'Xuất') : 'Tất cả'}`, 50, doc.y);
        if (startDate) {
            doc.text(`Từ ngày: ${new Date(startDate).toLocaleDateString('vi-VN')}`, 50, doc.y);
        }
        if (endDate) {
            doc.text(`Đến ngày: ${new Date(endDate).toLocaleDateString('vi-VN')}`, 50, doc.y);
        }
        doc.moveDown(2);

        // Bảng lịch sử giao dịch
        setFillColor('#218282');
        doc.fontSize(12).text('Lịch sử giao dịch', 50, doc.y, { underline: true });
        setFillColor('#333');
        doc.fontSize(9);

        // Định nghĩa cột
        const tableTop = doc.y + 10;
        const col1 = 50;  // ID
        const col2 = 100; // Sản phẩm
        const col3 = 300; // Loại giao dịch
        const col4 = 380; // Số lượng
        const col5 = 460; // Thời gian

        // Header bảng
        doc.fillColor('#e8f4f8').rect(col1 - 5, tableTop - 5, 490, 20).fill();
        setFillColor('#218282');
        doc.text('ID', col1, tableTop, { width: 50 });
        doc.text('Sản phẩm', col2, tableTop, { width: 200 });
        doc.text('Loại giao dịch', col3, tableTop, { width: 80, align: 'right' });
        doc.text('Số lượng', col4, tableTop, { width: 80, align: 'right' });
        doc.text('Thời gian', col5, tableTop, { width: 100, align: 'right' });

        // Dữ liệu bảng
        let y = tableTop + 25;
        history.forEach((row) => {
            setFillColor('#333');
            doc.text(row.history_id.toString(), col1, y, { width: 50, align: 'left' });
            doc.text(
                truncateText(row.Product.name, 60),
                col2,
                y,
                { width: 200, align: 'left', lineBreak: true }
            );
            doc.text(
                row.transaction_type === 'IN' ? 'Nhập' : 'Xuất',
                col3,
                y,
                { width: 80, align: 'right' }
            );
            doc.text(row.quantity.toString(), col4, y, { width: 80, align: 'right' });
            doc.text(
                new Date(row.transaction_date).toLocaleString('vi-VN'),
                col5,
                y,
                { width: 100, align: 'right' }
            );
            y += 25;
        });

        // Lời cảm ơn và hỗ trợ
        doc.moveDown(2);
        setFillColor('#218282');
        doc.fontSize(12).text('Cảm ơn quý khách đã sử dụng hệ thống ESHOP!', 50, doc.y, { align: 'center' });
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
        console.error('Lỗi khi xuất PDF:', error);
        res.status(500).send('Lỗi khi xuất PDF.');
    }
};

export default {
    listStock,
    editStock,
    updateStock,
    listStockHistory,
    exportStockHistoryPDF
};