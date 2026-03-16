import express from 'express'
import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';

// Định nghĩa mô hình `Nhom`
const Category = sequelize.define('Category', {
    category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    icon: {
        type: DataTypes.STRING,
        allowNull: true
    },
    highlight: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: false,
    tableName: 'categories'
});

// Thêm nhóm mới
const addCategory = async (categoryName, icon, highlight) => {
    try {
        const result = await Category.create({
            name: categoryName,
            icon: icon,
            highlight: highlight
        });
        return result;  // result là bản ghi mới được tạo
    } catch (error) {
        console.error('Lỗi khi thêm loại sản phẩm:', error);
        throw error;
    }
};



// Lấy tất cả các nhóm
// Lấy tất cả các categories
const listCategory = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        // Tạo một object chứa các tùy chọn truy vấn
        const queryOptions = {
            where: {}
        };

        // Nếu có từ khóa tìm kiếm thì thêm vào query
        if (searchKeyword) {
            queryOptions.where.name = { [Op.like]: `%${searchKeyword}%` };
        }

        // Nếu có offset và limit thì thêm vào query
        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        // Sắp xếp theo tùy chọn
        if (sortOption === 'highlight_asc') {
            queryOptions.order = [['highlight', 'ASC']];
        } else if (sortOption === 'highlight_desc') {
            queryOptions.order = [['highlight', 'DESC']];
        } else {
            queryOptions.order = [['category_id', 'DESC']];
        }

        // Truy vấn và trả về kết quả
        const categories = await Category.findAll(queryOptions);
        return categories;
    } catch (error) {
        console.error('lỗi khi tải dữ liệu:', error);
        throw error; // Có thể throw để controller xử lý tiếp nếu cần
    }
};

// Đếm số lượng nhóm
const countCategory = async (searchKeyword = '') => {
    try {
        const queryOptions = { where: {} };

        if (searchKeyword) {
            queryOptions.where.name = { [Op.like]: `%${searchKeyword}%` };
        }
    
        return await Category.count(queryOptions);
    } catch (error) {
        console.error('lỗi khi đếm nhóm:', error);
        throw error;
    }
};

// Xóa nhóm theo ID
const deleteCategory = async (idCategory) => {
    try {
        const result = await Category.destroy({
            where: {
                category_id: idCategory
            }
        });
        return result;  // result sẽ là số lượng bản ghi bị xóa (nếu thành công)
    } catch (error) {
        console.error('Lỗi khi xóa nhóm:', error);
        throw error;
    }
};

// Lấy thông tin nhóm theo ID
const getCategoryByid = async (idCategory) => {
    if (!idCategory) {
        throw new Error('Yêu cầu id nhóm');
    }
    try {
        const result = await Category.findOne({ where: { category_id: idCategory } });
        return result;
    } catch (error) {
        console.error('Lỗi khi tìm nhóm:', error);
        throw error;
    }
};
// Cập nhật thông tin nhóm
const updateCategory = async (idCategory, name, icon, highlight) => {
    try {
        const result = await Category.update(
            { 
                name: name, 
                icon: icon, 
                highlight: highlight 
            },
            { 
                where: { category_id: idCategory } 
            }
        );
        return result;
    } catch (error) {
        console.error('Lỗi khi update nhóm:', error);
        throw error;
    }
}

// lấy toàn bộ loại sản phẩm
const getAllCategory = async () => {
    try {
        return await Category.findAll();
    } catch (error) {
        console.error('Lỗi khi lấy tất cả loại sản phẩm:', error);
        throw error;
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////
const getAllCategoryAPI = async () => {
    try {
        return await Category.findAll({
            order: [['highlight', 'DESC']], // sắp xếp giảm dần theo highlight
            limit: 5                        // giới hạn 5 hãng
        });
    } catch (error) {
        console.error('Lỗi khi lấy loại sản phẩm nổi bật:', error);
        throw error;
    }
};





export { Category };
export default {
    Category,
    addCategory,
    listCategory,
    countCategory,
    deleteCategory,
    getCategoryByid,
    updateCategory,
    getAllCategory,
    // API
    getAllCategoryAPI
};