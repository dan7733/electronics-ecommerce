import express from 'express';
import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';

const Brand = sequelize.define('Brand', {
    brand_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
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
    tableName: 'brands'
});

// Thêm hãng mới
const addBrand = async (brandName, logo, highlight, country) => {
    try {
        const result = await Brand.create({
            name: brandName,
            logo: logo,
            highlight: highlight,
            country: country
        });
        return result;  // result là bản ghi mới được tạo
    } catch (error) {
        console.error('Lỗi khi thêm hãng:', error);
        throw error;
    }
};


// Lấy tất cả các brands
const listBrand = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
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
            queryOptions.order = [['brand_id', 'DESC']]; // Thay category_id thành brand_id
        }

        // Truy vấn và trả về kết quả
        const brands = await Brand.findAll(queryOptions);
        return brands;
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
        throw error; // Có thể throw để controller xử lý tiếp nếu cần
    }
};

// Đếm số lượng brands
const countBrand = async (searchKeyword = '') => {
    try {
        const queryOptions = { where: {} };

        if (searchKeyword) {
            queryOptions.where.name = { [Op.like]: `%${searchKeyword}%` };
        }

        return await Brand.count(queryOptions);
    } catch (error) {
        console.error('Lỗi khi đếm thương hiệu:', error);
        throw error;
    }
};

// xóa
const deleteBrand = async (idBrand) => {
    try {
        // Tìm thương hiệu trước khi xóa để lấy tên ảnh (logo)
        const brand = await Brand.findOne({
            where: { brand_id: idBrand },
            attributes: ['logo'] // Chỉ lấy trường logo
        });

        if (!brand) {
            return null; // Không tìm thấy thương hiệu
        }

        // Xóa thương hiệu
        const result = await Brand.destroy({
            where: { brand_id: idBrand }
        });

        return result ? brand.logo : null; // Trả về tên ảnh nếu xóa thành công
    } catch (error) {
        console.error('Lỗi khi xóa thương hiệu:', error);
        throw error;
    }
};

//lấy chi tiết
const getBrandById = async (idBrand) => {
    if (!idBrand) {
        throw new Error('Yêu cầu id thương hiệu');
    }
    try {
        const result = await Brand.findOne({ where: { brand_id: idBrand } });
        return result;
    } catch (error) {
        console.error('Lỗi khi tìm thương hiệu:', error);
        throw error;
    }
};


//cập nhật nhãn hàng
const updateBrand = async (idBrand, name, logo, country, highlight) => {
    try {
        const result = await Brand.update(
            { 
                name: name, 
                logo: logo, 
                country: country, 
                highlight: highlight 
            },
            { 
                where: { brand_id: idBrand } 
            }
        );
        return result;
    } catch (error) {
        console.error('Lỗi khi update thương hiệu:', error);
        throw error;
    }
};


// lấy toàn bộ hãng

const getAllBrand = async () => {
    try {
        return await Brand.findAll();
    } catch (error) {
        console.error('Lỗi khi lấy tất cả hãng:', error);
        throw error;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

const getAllBrandAPI = async () => {
    try {
        return await Brand.findAll({
            order: [['highlight', 'DESC']],
            limit: 5
        });
    } catch (error) {
        console.error('Lỗi khi lấy các thương hiệu nổi bật:', error);
        throw error;
    }
};



export { Brand };
export default {
    Brand,
    addBrand,
    listBrand,
    countBrand,
    deleteBrand,
    updateBrand,
    getBrandById,
    getAllBrand,
    // API
    getAllBrandAPI
};