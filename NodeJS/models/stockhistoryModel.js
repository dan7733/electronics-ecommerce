// models/stockHistoryModel.js
import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Product } from './productModel.js';
import { Stock } from './stockModel.js';
import { Op } from 'sequelize';

const StockHistory = sequelize.define('StockHistory', {
    history_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: 'product_id'
        },
        onDelete: 'CASCADE'
    },
    stock_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Stock,
            key: 'stock_id'
        },
        onDelete: 'CASCADE'
    },
    transaction_type: {
        type: DataTypes.ENUM('IN', 'OUT'),
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    transaction_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'stock_history'
});

// Thiết lập quan hệ
StockHistory.belongsTo(Product, { foreignKey: 'product_id' });
StockHistory.belongsTo(Stock, { foreignKey: 'stock_id' });
Product.hasMany(StockHistory, { foreignKey: 'product_id' });
Stock.hasMany(StockHistory, { foreignKey: 'stock_id' });

const listStockHistory = async (offset = null, limit = null, searchKeyword = '', productId = null, transactionType = null, startDate = null, endDate = null) => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['history_id', 'product_id', 'stock_id', 'transaction_type', 'quantity', 'transaction_date'],
            include: [
                {
                    model: Product,
                    attributes: ['name'],
                    required: true
                }
            ]
        };

        if (productId) {
            queryOptions.where.product_id = productId;
        }

        if (searchKeyword) {
            queryOptions.where['$Product.name$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        if (transactionType) {
            queryOptions.where.transaction_type = transactionType;
        }

        if (startDate && endDate) {
            queryOptions.where.transaction_date = {
                [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999Z')]
            };
        } else if (startDate) {
            queryOptions.where.transaction_date = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            queryOptions.where.transaction_date = {
                [Op.lte]: new Date(endDate + 'T23:59:59.999Z')
            };
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        queryOptions.order = [['transaction_date', 'DESC']];

        const history = await StockHistory.findAll(queryOptions);
        return history;
    } catch (error) {
        console.error('Lỗi khi tải lịch sử kho:', error);
        throw error;
    }
};

const countStockHistory = async (searchKeyword = '', productId = null, transactionType = null, startDate = null, endDate = null) => {
    try {
        const queryOptions = {
            where: {},
            include: [
                {
                    model: Product,
                    attributes: [],
                    required: true
                }
            ]
        };

        if (productId) {
            queryOptions.where.product_id = productId;
        }

        if (searchKeyword) {
            queryOptions.where['$Product.name$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        if (transactionType) {
            queryOptions.where.transaction_type = transactionType;
        }

        if (startDate && endDate) {
            queryOptions.where.transaction_date = {
                [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999Z')]
            };
        } else if (startDate) {
            queryOptions.where.transaction_date = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            queryOptions.where.transaction_date = {
                [Op.lte]: new Date(endDate + 'T23:59:59.999Z')
            };
        }

        const total = await StockHistory.count(queryOptions);
        return total;
    } catch (error) {
        console.error('Lỗi khi đếm lịch sử kho:', error);
        throw error;
    }
};

export { StockHistory };
export default {
    listStockHistory,
    countStockHistory
};