import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import logger from '../configs/logger.js'; // Import custom logger
import { Brand } from './brandModel.js';
import { Category } from './categoryModel.js';

const Product = sequelize.define('Product', {
    product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    discount_price: {  
        type: DataTypes.FLOAT,
        allowNull: true, 
        defaultValue: null
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    product_img: {
        type: DataTypes.STRING,
        allowNull: true
    },
    brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true,  
        references: {
            model: Brand,
            key: 'brand_id'
        },
        onDelete: 'SET NULL'
    },
    category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,  
        references: {
            model: Category,
            key: 'category_id'
        },
        onDelete: 'CASCADE'
    },
    views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: false,
    tableName: 'products'
});

// Thiết lập quan hệ
Product.belongsTo(Brand, { foreignKey: 'brand_id', allowNull: true });
Brand.hasMany(Product, { foreignKey: 'brand_id' });

Product.belongsTo(Category, { foreignKey: 'category_id', allowNull: false });
Category.hasMany(Product, { foreignKey: 'category_id' });

// Thêm sản phẩm mới
const addProduct = async (name, price, discount_price, description, product_img, brand_id, category_id) => {
    try {
        if(!brand_id){
            brand_id = null;
        }
        const result = await Product.create({
            name: name,
            price: price,
            discount_price: discount_price,
            description: description,
            product_img: product_img,
            brand_id: brand_id,
            category_id: category_id
        });
        
        return result;
    } catch (error) {
        logger.error('Lỗi khi thêm sản phẩm', { error: error.message, stack: error.stack });
        throw error;
    }
};

const listProduct = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default', brandFilter = '', categoryFilter = '') => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['product_id', 'name', 'price', 'discount_price'],
            include: [
                {
                    model: Brand,
                    attributes: ['name'],
                },
                {
                    model: Category,
                    attributes: ['name'],
                }
            ]
        };

        if (searchKeyword) {
            queryOptions.where.name = { [Op.like]: `%${searchKeyword}%` };
        }

        if (brandFilter) {
            queryOptions.include[0].where = { brand_id: brandFilter };
        }

        if (categoryFilter) {
            queryOptions.include[1].where = { category_id: categoryFilter };
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        if (sortOption === 'price_asc') {
            queryOptions.order = [['price', 'ASC']];
        } else if (sortOption === 'price_desc') {
            queryOptions.order = [['price', 'DESC']];
        } else {
            queryOptions.order = [['product_id', 'DESC']];
        }

        const products = await Product.findAll(queryOptions);
        return products;
    } catch (error) {
        logger.error('Lỗi khi tải danh sách sản phẩm', { error: error.message, stack: error.stack });
        throw error;
    }
};

const countProduct = async (searchKeyword = '', brandFilter = '', categoryFilter = '') => {
    try {
        const queryOptions = {
            where: {}
        };

        if (searchKeyword) {
            queryOptions.where.name = { [Op.like]: `%${searchKeyword}%` };
        }

        if (brandFilter) {
            queryOptions.where.brand_id = brandFilter;
        }

        if (categoryFilter) {
            queryOptions.where.category_id = categoryFilter;
        }

        const total = await Product.count(queryOptions);
        return total;
    } catch (error) {
        logger.error('Lỗi khi đếm sản phẩm', { error: error.message, stack: error.stack });
        throw error;
    }
};

const deleteProduct = async (idProduct) => {
    try {
        const product = await Product.findOne({
            where: { product_id: idProduct },
            attributes: ['product_img']
        });

        if (!product) {
            return null;
        }

        const result = await Product.destroy({
            where: { product_id: idProduct }
        });

        return result ? product.product_img : null;
    } catch (error) {
        logger.error('Lỗi khi xóa sản phẩm', { error: error.message, stack: error.stack, idProduct });
        throw error;
    }
};

const getProductById = async (productId) => {
    if (!productId) {
        throw new Error('Yêu cầu id sản phẩm');
    }
    try {
        const result = await Product.findOne({ where: { product_id: productId } });
        return result;
    } catch (error) {
        logger.error('Lỗi khi tìm sản phẩm', { error: error.message, stack: error.stack, productId });
        throw error;
    }
};

const updateProduct = async (idProduct, name, price, discount_price, description, product_img, brand_id, category_id) => {
    try {
        if(!brand_id){
            brand_id = null;
        }
        const result = await Product.update(
            { 
                name: name, 
                price: price, 
                discount_price: discount_price, 
                description: description, 
                product_img: product_img, 
                brand_id: brand_id, 
                category_id: category_id 
            },
            { 
                where: { product_id: idProduct } 
            }
        );
        return result;
    } catch (error) {
        logger.error('Lỗi khi update sản phẩm', { error: error.message, stack: error.stack, idProduct });
        throw error;
    }
};

const getlatestProductsAPI = async (category_id = null) => {
    try {
        const whereClause = category_id ? { category_id } : {};

        const products = await Product.findAll({
            where: whereClause,
            attributes: ['product_id', 'name', 'price', 'discount_price', 'product_img'],
            include: {
                model: Category,
                as: 'Category',
                attributes: ['name']
            },
            limit: 4,
            order: [['product_id', 'DESC']]
        });

        return products;
    } catch (error) {
        logger.error('Error fetching latest products', { error: error.message, stack: error.stack });
        throw new Error('Could not fetch latest products.');
    }
};

const getProductDetailAPI = async (product_id) => {
    try {
        console.log(`Processing getProductDetailAPI for product_id: ${product_id}`);
        await Product.increment('views', {
            where: { product_id },
            silent: true
        });

        const product = await Product.findOne({
            where: { product_id },
            attributes: ['product_id', 'name', 'price', 'discount_price', 'description', 'product_img', 'views'],
            include: [
                {
                    model: Category,
                    as: 'Category',
                    attributes: ['name']
                },
                {
                    model: Brand,
                    as: 'Brand',
                    attributes: ['name']
                }
            ]
        });

        if (!product) {
            throw new Error('Product not found.');
        }

        console.log(`Returning product with views: ${product.views}`);
        return product;
    } catch (error) {
        logger.error('Error fetching product detail', { error: error.message, stack: error.stack, product_id });
        throw new Error('Could not fetch product detail.');
    }
};

const listProductAPI = async (
    offset = null,
    limit = null,
    searchKeyword = '',
    sortOption = 'default',
    brandFilter = '',
    categoryFilter = '',
    maxPrice = null,
    minPrice = 0
) => {
    try {
        const queryOptions = {
            where: {},
            attributes: ['product_id', 'name', 'price', 'discount_price', 'product_img'],
            include: [
                {
                    model: Brand,
                    attributes: ['name']
                },
                {
                    model: Category,
                    attributes: ['name']
                }
            ]
        };

        if (searchKeyword) {
            queryOptions.where.name = { [Op.like]: `%${searchKeyword}%` };
        }

        if (maxPrice !== null || minPrice !== null) {
            queryOptions.where.price = {};
            if (minPrice !== null) {
                queryOptions.where.price[Op.gte] = minPrice;
            }
            if (maxPrice !== null) {
                queryOptions.where.price[Op.lte] = maxPrice;
            }
        }

        if (brandFilter) {
            queryOptions.where.brand_id = brandFilter;
        }

        if (categoryFilter) {
            queryOptions.where.category_id = categoryFilter;
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        switch (sortOption) {
            case 'price_asc':
                queryOptions.order = [['price', 'ASC']];
                break;
            case 'price_desc':
                queryOptions.order = [['price', 'DESC']];
                break;
            default:
                queryOptions.order = [['product_id', 'DESC']];
        }

        const products = await Product.findAll(queryOptions);
        return products;
    } catch (error) {
        logger.error('Lỗi khi tải danh sách sản phẩm', { error: error.message, stack: error.stack });
        throw error;
    }
};

const countProductAPI = async (
    searchKeyword = '',
    brandFilter = '',
    categoryFilter = '',
    maxPrice = null,
    minPrice = 0
) => {
    try {
        const queryOptions = {
            where: {}
        };

        if (searchKeyword) {
            queryOptions.where.name = { [Op.like]: `%${searchKeyword}%` };
        }

        if (maxPrice !== null || minPrice !== null) {
            queryOptions.where.price = {};
            if (minPrice !== null) {
                queryOptions.where.price[Op.gte] = minPrice;
            }
            if (maxPrice !== null) {
                queryOptions.where.price[Op.lte] = maxPrice;
            }
        }

        if (brandFilter) {
            queryOptions.where.brand_id = brandFilter;
        }

        if (categoryFilter) {
            queryOptions.where.category_id = categoryFilter;
        }

        const total = await Product.count(queryOptions);
        return total;
    } catch (error) {
        logger.error('Lỗi khi đếm sản phẩm', { error: error.message, stack: error.stack });
        throw error;
    }
};

const listLatestProductAPI = async (offset, limit) => {
    try {
        const queryOptions = {
            attributes: ['product_id', 'name', 'price', 'discount_price', 'product_img'],
            include: [
                {
                    model: Brand,
                    attributes: ['name'],
                    required: false
                },
                {
                    model: Category,
                    attributes: ['name'],
                    required: true
                }
            ],
            order: [['product_id', 'DESC']],
            offset,
            limit
        };

        const products = await Product.findAll(queryOptions);
        return products;
    } catch (error) {
        logger.error('Lỗi khi tải danh sách sản phẩm mới nhất', { error: error.message, stack: error.stack });
        throw error;
    }
};

const countListLastestProductAPI = async () => {
    try {
        const total = await Product.count();
        return total;
    } catch (error) {
        logger.error('Lỗi khi đếm sản phẩm', { error: error.message, stack: error.stack });
        throw error;
    }
};

export { Product };
export default { 
    addProduct,
    listProduct,
    countProduct,
    deleteProduct,
    getProductById,
    updateProduct,
    getlatestProductsAPI,
    getProductDetailAPI,
    listProductAPI,
    countProductAPI,
    listLatestProductAPI,
    countListLastestProductAPI
};