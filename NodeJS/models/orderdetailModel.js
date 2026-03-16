import express from 'express'
import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import { Order } from './orderModel.js'; 
import { Product } from './productModel.js'; // Import model Product để thiết lập quan hệ

// Định nghĩa mô hình OrderDetail
const OrderDetail = sequelize.define('OrderDetail', {
    order_detail_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Order,
            key: 'order_id'
        },
        onDelete: 'CASCADE'  // Khi một order bị xóa, tất cả các order_details liên quan sẽ bị xóa
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: 'product_id'
        },
        onDelete: 'CASCADE'  // Khi một sản phẩm bị xóa, tất cả các order_details liên quan sẽ bị xóa
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    discount_price: {
        type: DataTypes.FLOAT,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'order_details'
});

// Thiết lập quan hệ giữa Order và OrderDetail
Order.hasMany(OrderDetail, { foreignKey: 'order_id' });  // Một Order có nhiều OrderDetail
OrderDetail.belongsTo(Order, { foreignKey: 'order_id' });  // Một OrderDetail chỉ thuộc về một Order

// Thiết lập quan hệ giữa Product và OrderDetail
Product.hasMany(OrderDetail, { foreignKey: 'product_id' });  // Một Product có nhiều OrderDetail
OrderDetail.belongsTo(Product, { foreignKey: 'product_id' });  // Một OrderDetail chỉ thuộc về một Product


const getOrderDetailsByOrderId = async (orderId) => {
    try {
        const details = await OrderDetail.findAll({
            where: { order_id: orderId },
            attributes: [
                'order_detail_id',
                'order_id',
                'product_id',
                'quantity',
                'price',
                'discount_price'
            ],
            include: [
                {
                    model: Product,
                    attributes: ['name', 'product_img'],
                    required: false
                }
            ]
        });

        return details;
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error.message);
        throw error;
    }
};


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////
// Thêm chi tiết đơn hàng
const addOrderDetailAPI = async (orderId, productId, quantity, price, discount_price) => { 
    try {
        // Kiểm tra dữ liệu cơ bản
        if (!orderId || !productId) {
            throw new Error('Thông tin đơn hàng không hợp lệ.');
        }

        let orderDetail = await OrderDetail.findOne({
            where: { order_id: orderId, product_id: productId }
        });

        if (orderDetail) {
            await orderDetail.update({
                quantity: quantity || orderDetail.quantity,
                price: price || orderDetail.price,
                discount_price: discount_price || orderDetail.discount_price
            });
        } else {
            orderDetail = await OrderDetail.create({
                order_id: orderId,
                product_id: productId,
                quantity: quantity || 1,
                price: price || 0,
                discount_price: discount_price || null
            });
        }

        return orderDetail;
    } catch (error) {
        console.error('Lỗi khi thêm hoặc cập nhật chi tiết đơn hàng:', error.message);
        throw error;
    }
};


const getOrderDetailsByOrderIdAPI = async (orderId) => {
    try {
        const details = await OrderDetail.findAll({
            where: { order_id: orderId },
            attributes: [
                'order_detail_id',
                'order_id',
                'product_id',
                'quantity',
                'price',
                'discount_price'
            ],
            include: [
                {
                    model: Product,
                    attributes: ['name', 'product_img'],
                    required: false
                }
            ]
        });

        return details;
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error.message);
        throw error;
    }
};





export { OrderDetail };
export default {
    getOrderDetailsByOrderId,
    //API
    addOrderDetailAPI,
    getOrderDetailsByOrderIdAPI
};
