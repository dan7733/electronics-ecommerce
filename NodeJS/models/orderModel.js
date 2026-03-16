import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import { User } from './userModel.js';

const Order = sequelize.define('Order', {
    order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        },
        onDelete: 'CASCADE'
    },
    total_price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']] // thêm 'confirmed' vào
        }
    },    
    status_payment: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
        validate: {
            isIn: [['pending', 'waiting_payment', 'paid', 'failed']] // Trạng thái thanh toán
        }
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'orders'
});

User.hasOne(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

const listOrder = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['order_id', 'user_id', 'created_at', 'status', 'status_payment'], // Thêm status_payment
            include: [
                {
                    model: User,
                    attributes: ['fullname'],
                    required: true
                }
            ]
        };

        if (searchKeyword) {
            queryOptions.where['$User.fullname$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        if (sortOption === 'created_at_asc') {
            queryOptions.order = [['created_at', 'ASC']];
        } else if (sortOption === 'created_at_desc') {
            queryOptions.order = [['created_at', 'DESC']];
        } else {
            queryOptions.order = [['order_id', 'DESC']];
        }

        const orders = await Order.findAll(queryOptions);
        return orders;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        throw error;
    }
};

const countOrder = async (searchKeyword = '') => {
    try {
        const queryOptions = {
            where: {},
            include: [
                {
                    model: User,
                    attributes: [],
                    required: true
                }
            ]
        };

        if (searchKeyword) {
            queryOptions.where['$User.fullname$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        const total = await Order.count(queryOptions);
        return total;
    } catch (error) {
        console.error('Lỗi khi đếm đơn hàng:', error);
        throw error;
    }
};

const getOrderById = async (orderId) => {
    try {
        if (!orderId || isNaN(orderId)) {
            throw new Error('ID đơn hàng không hợp lệ.');
        }

        const order = await Order.findOne({
            where: { order_id: orderId },
            attributes: [
                'order_id',
                'user_id',
                'total_price',
                'status',
                'status_payment', // Thêm status_payment
                'address',
                'phone',
                'email',
                'note',
                'created_at',
                'updated_at'
            ],
            include: [
                {
                    model: User,
                    attributes: ['fullname'],
                    required: true
                }
            ]
        });

        if (!order) {
            throw new Error('Không tìm thấy đơn hàng.');
        }

        return order;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error.message);
        throw error;
    }
};

const updateOrder = async (orderId, updates) => {
    try {
      if (!orderId || !updates || (!updates.status && !updates.status_payment)) {
        throw new Error('Thiếu thông tin cập nhật.');
      }
  
      const [updatedRows] = await Order.update(
        { ...updates, updated_at: new Date() },
        { where: { order_id: orderId } }
      );
  
      if (updatedRows === 0) {
        throw new Error('Không tìm thấy đơn hàng để cập nhật.');
      }
  
      return { success: true, message: 'Cập nhật trạng thái đơn hàng thành công.' };
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error.message);
      throw error;
    }
  };

const addOrderAPI = async (userId, totalPrice, status = 'pending', status_payment = 'pending', address, phone, email = null, note = null) => {
    try {
        if (!userId || !totalPrice || !address || !phone) {
            throw new Error('Thông tin đơn hàng không hợp lệ.');
        }
        
        const order = await Order.create({
            user_id: userId,
            total_price: totalPrice,
            status,
            status_payment, // Thêm status_payment
            address,
            phone,
            email,
            note,
            created_at: new Date(),
            updated_at: new Date()
        });

        return order;
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error.message);
        throw error;
    }
};

// api
const listOrderAPI = async (username, status = null, offset = null, limit = null, sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['order_id', 'user_id', 'created_at', 'status', 'total_price', 'address', 'phone'],
            include: [
                {
                    model: User,
                    attributes: ['fullname'],
                    required: true,
                    where: { username } // Lọc theo username
                }
            ]
        };

        if (status) {
            queryOptions.where.status = status; // Lọc theo status
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        if (sortOption === 'created_at_asc') {
            queryOptions.order = [['created_at', 'ASC']];
        } else if (sortOption === 'created_at_desc') {
            queryOptions.order = [['created_at', 'DESC']];
        } else {
            queryOptions.order = [['order_id', 'DESC']];
        }

        const orders = await Order.findAll(queryOptions);
        return orders;
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        throw error;
    }
};

const countOrderAPI = async (username, status = null) => {
    try {
        const queryOptions = {
            where: {},
            include: [
                {
                    model: User,
                    attributes: [],
                    required: true,
                    where: { username } // Lọc theo username
                }
            ]
        };

        if (status) {
            queryOptions.where.status = status; // Lọc theo status
        }

        const total = await Order.count(queryOptions);
        return total;
    } catch (error) {
        console.error('Lỗi khi đếm đơn hàng:', error);
        throw error;
    }
};

const getOrderByIdAPI = async (orderId) => {
    try {
        if (!orderId || isNaN(orderId)) {
            throw new Error('ID đơn hàng không hợp lệ.');
        }

        const order = await Order.findOne({
            where: { order_id: orderId },
            attributes: [
                'order_id',
                'user_id',
                'total_price',
                'status',
                'status_payment', // Thêm status_payment
                'address',
                'phone',
                'email',
                'note',
                'created_at',
            ],
            include: [
                {
                    model: User,
                    attributes: ['fullname'],
                    required: true
                }
            ]
        });

        if (!order) {
            throw new Error('Không tìm thấy đơn hàng.');
        }

        return order;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error.message);
        throw error;
    }
};




export { Order };
export default {
    listOrder,
    countOrder,
    getOrderById,
    updateOrder,
    addOrderAPI,
    // API
    listOrderAPI,
    countOrderAPI,
    getOrderByIdAPI
};