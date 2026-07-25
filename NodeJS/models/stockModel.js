import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import logger from '../configs/logger.js'; // Import custom logger
import { Product } from './productModel.js';

const Stock = sequelize.define('Stock', {
    stock_id: {
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
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    stock_in: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    stock_out: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'stocks'
});

// Thiết lập quan hệ với bảng Product
Product.hasOne(Stock, { foreignKey: 'product_id' });
Stock.belongsTo(Product, { foreignKey: 'product_id' });

const addStock = async (productId) => {
    try {
        let stock = await Stock.findOne({
            where: { product_id: productId }
        });

        if (stock) {
            stock.quantity += (stock.stock_in - stock.stock_out);
            stock.stock_in = 0;
            stock.stock_out = 0;
            stock.updated_at = new Date();
            await stock.save();
        } else {
            stock = await Stock.create({
                product_id: productId,
                quantity: 0,
                stock_in: 0,
                stock_out: 0
            });
        }

        return stock;
    } catch (error) {
        logger.error('Lỗi khi thêm hoặc cập nhật kho', { error: error.message, stack: error.stack, productId });
        throw error;
    }
};

const listStock = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['product_id', 'quantity', 'updated_at'],
            include: [
                {
                    model: Product,
                    attributes: ['name'],
                    required: true
                }
            ]
        };

        if (searchKeyword) {
            queryOptions.where['$Product.name$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        if (sortOption === 'quantity_asc') {
            queryOptions.order = [['quantity', 'ASC']];
        } else if (sortOption === 'quantity_desc') {
            queryOptions.order = [['quantity', 'DESC']];
        } else {
            queryOptions.order = [['stock_id', 'DESC']];
        }

        const stocks = await Stock.findAll(queryOptions);
        return stocks;
    } catch (error) {
        logger.error('Lỗi khi tải danh sách kho', { error: error.message, stack: error.stack });
        throw error;
    }
};

const countStock = async (searchKeyword = '') => {
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

        if (searchKeyword) {
            queryOptions.where['$Product.name$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        const total = await Stock.count(queryOptions);
        return total;
    } catch (error) {
        logger.error('Lỗi khi đếm kho', { error: error.message, stack: error.stack });
        throw error;
    }
};

const getStockByProductId = async (product_id) => {
    try {
        const stock = await Stock.findOne({
            where: { product_id },
            include: [
                {
                    model: Product,
                    attributes: ['name'],
                }
            ]
        });

        if (!stock) {
            throw new Error(`Không tìm thấy thông tin kho cho sản phẩm có ID: ${product_id}`);
        }

        return stock;
    } catch (error) {
        logger.error('Lỗi khi lấy thông tin kho theo product_id', { error: error.message, stack: error.stack, product_id });
        throw error;
    }
};

const updateStock = async (product_id, stock_in, stock_out) => {
    try {
        const stock = await Stock.findOne({ where: { product_id } });

        if (!stock) {
            throw new Error(`Không tìm thấy kho cho sản phẩm có ID: ${product_id}`);
        }

        stock.stock_in += stock_in;
        stock.stock_out += stock_out;
        stock.quantity += (stock_in - stock_out);
        stock.updated_at = new Date();

        await stock.save();
        return stock;
    } catch (error) {
        logger.error('Lỗi khi cập nhật kho', { error: error.message, stack: error.stack, product_id });
        throw error;
    }
};

const getStockByProductIdAPI = async (product_id) => {
    try {
        const stock = await Stock.findOne({
            where: { product_id }
        });

        if (!stock) {
            throw new Error(`Không tìm thấy thông tin kho cho sản phẩm có ID: ${product_id}`);
        }
        return stock;
    } catch (error) {
        logger.error('Lỗi khi lấy thông tin kho theo product_id', { error: error.message, stack: error.stack, product_id });
        throw error;
    }
};

export { Stock };
export default {
    listStock,
    countStock,
    addStock,
    updateStock,
    getStockByProductId,
    // API
    getStockByProductIdAPI
};