import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import { Product } from './productModel.js';

const ProductDetails = sequelize.define('ProductDetails', {
    detail_id: {
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
    operating_system: {
        type: DataTypes.STRING,
        allowNull: false
    },
    storage: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ram: {
        type: DataTypes.STRING,
        allowNull: false
    },
    processor: {
        type: DataTypes.STRING,
        allowNull: false
    },
    release_year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'product_details'
});

// Thiết lập quan hệ với Product
Product.hasOne(ProductDetails, { foreignKey: 'product_id' });
ProductDetails.belongsTo(Product, { foreignKey: 'product_id' });

const addProductDetail = async (productId, details = {}) => {
    try {
        if (!details || typeof details !== 'object') {
            throw new Error('Thông tin chi tiết sản phẩm không hợp lệ.');
        }

        let productDetail = await ProductDetails.findOne({
            where: { product_id: productId }
        });

        if (productDetail) {
            // Nếu đã có, cập nhật thông tin chi tiết
            await productDetail.update({
                operating_system: details.operating_system || productDetail.operating_system,
                storage: details.storage || productDetail.storage,
                ram: details.ram || productDetail.ram,
                processor: details.processor || productDetail.processor,
                release_year: details.release_year || productDetail.release_year,
                updated_at: new Date()
            });
        } else {
            // Nếu chưa có, tạo mới chi tiết sản phẩm
            productDetail = await ProductDetails.create({
                product_id: productId,
                operating_system: details.operating_system || 'Unknown',
                storage: details.storage || 'Unknown',
                ram: details.ram || 'Unknown',
                processor: details.processor || 'Unknown',
                release_year: details.release_year || new Date().getFullYear()
            });
        }

        return productDetail;
    } catch (error) {
        console.error('Lỗi khi thêm hoặc cập nhật chi tiết sản phẩm:', error.message);
        throw error;
    }
};

const listProductDetails = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['detail_id', 'product_id', 'release_year', 'updated_at'],
            include: [
                {
                    model: Product, // Liên kết với bảng Product
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

        // Sắp xếp theo thời gian cập nhật
        if (sortOption === 'updated_at_asc') {
            queryOptions.order = [['updated_at', 'ASC']];
        } else if (sortOption === 'updated_at_desc') {
            queryOptions.order = [['updated_at', 'DESC']];
        } else {
            queryOptions.order = [['detail_id', 'DESC']];
        }

        const productDetails = await ProductDetails.findAll(queryOptions);
        return productDetails;
    } catch (error) {
        console.error('Lỗi khi tải danh sách chi tiết sản phẩm:', error);
        throw error;
    }
};

// Đếm số lượng product details
const countProductDetails = async (searchKeyword = '') => {
    try {
        const queryOptions = {
            where: {},
            include: [
                {
                    model: Product, // Liên kết với bảng Product
                    attributes: [],
                    required: true
                }
            ]
        };

        // Tìm kiếm theo tên sản phẩm
        if (searchKeyword) {
            queryOptions.where['$Product.name$'] = { [Op.like]: `%${searchKeyword}%` };
        }

        const total = await ProductDetails.count(queryOptions);
        return total;
    } catch (error) {
        console.error('Lỗi khi đếm chi tiết sản phẩm:', error);
        throw error;
    }
};

//lấy thông tin chi tiết sản phẩm theo id
const getProductDetailById = async (productid) => {
    try {
        const productDetail = await ProductDetails.findOne({
            where: { product_id: productid },
            include: [
                {
                    model: Product,
                    attributes: ['name'],
                    required: true
                }
            ]
        });
        return productDetail;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin chi tiết sản phẩm:', error);
        throw error;
    }
};


//cập nhật thông tin chi tiết sản phẩm
const updateProductDetail = async (product_id, operating_system, storage, ram, processor, release_year) => {
    try {
        const result = await ProductDetails.update(
            {
                operating_system: operating_system,
                storage: storage,
                ram: ram,
                processor: processor,
                release_year: release_year,
                updated_at: new Date()
            },
            {
                where: { product_id: product_id }
            }
        );
        return result;
    } catch (error) {
        console.error('Lỗi khi cập nhật chi tiết sản phẩm:', error);
        throw error;
    }
};


//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////


// Hàm tìm chi tiết sản phẩm theo product_id
const getInforProductDetailAPI = async function (productId) {
    try {
        const details = await ProductDetails.findOne({
            where: { product_id: productId }
        });
        return details;
    } catch (error) {
        console.error('Lỗi khi lấy thông tin chi tiết sản phẩm:', error);
        throw error;
    }
}





export { ProductDetails };
export default 
{
    addProductDetail,
    listProductDetails,
    countProductDetails,
    getProductDetailById,
    updateProductDetail,
    getInforProductDetailAPI
};