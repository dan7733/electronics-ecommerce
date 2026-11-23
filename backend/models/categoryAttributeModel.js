import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Category } from './categoryModel.js';
import { Product } from './productModel.js';
import logger from '../configs/logger.js';

const CategoryAttribute = sequelize.define('CategoryAttribute', {
    attribute_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'category_attributes'
});

const ProductAttributeValue = sequelize.define('ProductAttributeValue', {
    value_id: {
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
    attribute_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: CategoryAttribute,
            key: 'attribute_id'
        },
        onDelete: 'CASCADE'
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'product_attribute_values'
});

Category.hasMany(CategoryAttribute, { foreignKey: 'category_id' });
CategoryAttribute.belongsTo(Category, { foreignKey: 'category_id' });

CategoryAttribute.hasMany(ProductAttributeValue, { foreignKey: 'attribute_id' });
ProductAttributeValue.belongsTo(CategoryAttribute, { foreignKey: 'attribute_id' });

Product.hasMany(ProductAttributeValue, { foreignKey: 'product_id' });
ProductAttributeValue.belongsTo(Product, { foreignKey: 'product_id' });

const getAttributesByCategoryId = async (categoryId) => {
    try {
        return await CategoryAttribute.findAll({
            where: { category_id: categoryId }
        });
    } catch (error) {
        logger.error('Lỗi khi lấy thuộc tính theo Category', { error: error.message, categoryId });
        throw error;
    }
};

const addCategoryAttribute = async (categoryId, name) => {
    try {
        const cleanName = name.trim().substring(0, 100);
        const existing = await CategoryAttribute.findOne({
            where: { category_id: categoryId, name: cleanName }
        });
        if (existing) return existing;

        return await CategoryAttribute.create({
            category_id: categoryId,
            name: cleanName
        });
    } catch (error) {
        logger.error('Lỗi khi thêm thuộc tính cho Category', { error: error.message, categoryId, name });
        throw error;
    }
};

const deleteCategoryAttribute = async (attributeId) => {
    try {
        return await CategoryAttribute.destroy({
            where: { attribute_id: attributeId }
        });
    } catch (error) {
        logger.error('Lỗi khi xóa thuộc tính Category', { error: error.message, attributeId });
        throw error;
    }
};

const getProductAttributesByProductId = async (productId) => {
    try {
        const product = await Product.findByPk(productId);
        if (!product) throw new Error('Không tìm thấy sản phẩm.');

        const attributes = await CategoryAttribute.findAll({
            where: { category_id: product.category_id }
        });

        const existingValues = await ProductAttributeValue.findAll({
            where: { product_id: productId }
        });

        const valueMap = {};
        existingValues.forEach(item => {
            valueMap[item.attribute_id] = item.value;
        });

        return attributes.map(attr => ({
            attribute_id: attr.attribute_id,
            name: attr.name,
            value: valueMap[attr.attribute_id] || ''
        }));
    } catch (error) {
        logger.error('Lỗi khi lấy danh sách thuộc tính sản phẩm', { error: error.message, productId });
        throw error;
    }
};

// Hàm lưu thuộc tính đã được nâng cấp an toàn
const saveProductAttributeValues = async (productId, attributesObj = {}) => {
    try {
        for (const [key, val] of Object.entries(attributesObj)) {
            // Trích xuất ID số từ key (ví dụ: "attr_15" hoặc "15" -> 15)
            const attributeId = parseInt(String(key).replace(/\D/g, ''), 10);
            
            // Bỏ qua nếu ID không hợp lệ hoặc <= 0
            if (isNaN(attributeId) || attributeId <= 0) {
                continue;
            }

            const cleanVal = val !== undefined && val !== null ? String(val).trim() : '';
            
            const existing = await ProductAttributeValue.findOne({
                where: { product_id: productId, attribute_id: attributeId }
            });

            if (existing) {
                await existing.update({ value: cleanVal });
            } else if (cleanVal !== '') {
                await ProductAttributeValue.create({
                    product_id: productId,
                    attribute_id: attributeId,
                    value: cleanVal
                });
            }
        }
    } catch (error) {
        logger.error('Lỗi khi lưu giá trị thuộc tính sản phẩm', { error: error.message, productId });
        throw error;
    }
};

export { CategoryAttribute, ProductAttributeValue };
export default {
    getAttributesByCategoryId,
    addCategoryAttribute,
    deleteCategoryAttribute,
    getProductAttributesByProductId,
    saveProductAttributeValues
};