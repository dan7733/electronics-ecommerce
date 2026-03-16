import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import { Product } from './productModel.js'; // Nếu productModel xuất dạng object { Product }


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
            model: Product, // Sử dụng đúng mô hình Product thay vì Product.Product
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
        // Kiểm tra xem sản phẩm đã có trong kho chưa
        let stock = await Stock.findOne({
            where: { product_id: productId }
        });

        if (stock) {
            // Nếu sản phẩm đã có trong kho, cập nhật số lượng tồn kho
            stock.quantity += (stock.stock_in - stock.stock_out);
            stock.stock_in = 0; // Reset stock_in sau khi cập nhật
            stock.stock_out = 0; // Reset stock_out sau khi cập nhật
            stock.updated_at = new Date(); // Cập nhật thời gian
            await stock.save(); // Lưu lại thay đổi
        } else {
            // Nếu chưa có sản phẩm trong kho, tạo mới một bản ghi kho
            stock = await Stock.create({
                product_id: productId,
                quantity: 0, // Mới thêm nên số lượng ban đầu là 0
                stock_in: 0,
                stock_out: 0
            });
        }

        return stock; // Trả về bản ghi kho đã được thêm hoặc cập nhật
    } catch (error) {
        console.error('Lỗi khi thêm hoặc cập nhật kho:', error);
        throw error;
    }
};




// lấy số lượng sản phẩm trong kho
const listStock = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['product_id', 'quantity', 'updated_at'],
            include: [
                {
                    model: Product, // Sử dụng đúng mô hình Product
                    attributes: ['name'],
                    required: true
                }
            ]
        };
        // Tìm kiếm theo tên sản phẩm
        if (searchKeyword) {
            queryOptions.where['$Product.name$'] = { [Op.like]: `%${searchKeyword}%` };
        }
        // Giới hạn và phân trang
        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        // Sắp xếp theo số lượng sản phẩm
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
        console.error('Lỗi khi tải danh sách kho:', error);
        throw error;
    }
};

// Đếm số lượng stocks
const countStock = async (searchKeyword = '') => {
    try {
        const queryOptions = {
            where: {},
            include: [
                {
                    model: Product, // Sử dụng đúng mô hình Product
                    attributes: [], // Không cần lấy thuộc tính từ Product nếu chỉ cần đếm
                    required: true
                }
            ]
        };

        // Tìm kiếm theo tên sản phẩm
        if (searchKeyword) {
            queryOptions.where['$Product.name$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        const total = await Stock.count(queryOptions);
        return total;
    } catch (error) {
        console.error('Lỗi khi đếm kho:', error);
        throw error;
    }
};


// Lấy thông tin kho theo product_id
const getStockByProductId = async (product_id) => {
    try {
        const stock = await Stock.findOne({
            where: { product_id },
            include: [
                {
                    model: Product,
                    attributes: ['name'], // Lấy thêm tên sản phẩm nếu cần
                }
            ]
        });

        if (!stock) {
            throw new Error(`Không tìm thấy thông tin kho cho sản phẩm có ID: ${product_id}`);
        }

        return stock;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin kho theo product_id:', error);
        throw error;
    }
};



// Cập nhật thông tin tồn kho
const updateStock = async (product_id, stock_in, stock_out) => {
    try {
        const stock = await Stock.findOne({ where: { product_id } });

        if (!stock) {
            throw new Error(`Không tìm thấy kho cho sản phẩm có ID: ${product_id}`);
        }

        // Cộng dồn thay vì ghi đè
        stock.stock_in += stock_in;
        stock.stock_out += stock_out;
        stock.quantity += (stock_in - stock_out);
        stock.updated_at = new Date();

        await stock.save();
        return stock;
    } catch (error) {
        console.error('Lỗi khi cập nhật kho:', error);
        throw error;
    }
};



// Lấy thông tin kho theo product_id
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
        console.error('Lỗi khi lấy thông tin kho theo product_id:', error);
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
