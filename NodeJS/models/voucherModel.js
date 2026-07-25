import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import logger from '../configs/logger.js'; // Import custom logger

// Định nghĩa mô hình Voucher
const Voucher = sequelize.define('Voucher', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    voucher: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    create_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    end_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: false,
    tableName: 'vouchers'
});

// Thêm voucher mới
const addVoucher = async (voucher, value, end_at) => {
    try {
        return await Voucher.create({ voucher: voucher, value, end_at: end_at });
    } catch (error) {
        logger.error('Lỗi khi thêm voucher', { error: error.message, stack: error.stack });
        throw error;
    }
};

// Lấy danh sách vouchers
const listVoucher = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        const queryOptions = { where: {} };

        if (searchKeyword) {
            queryOptions.where.voucher = { [Op.like]: `%${searchKeyword}%` };
        }

        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        if (sortOption === 'value_asc') {
            queryOptions.order = [['value', 'ASC']];
        } else if (sortOption === 'value_desc') {
            queryOptions.order = [['value', 'DESC']];
        } else {
            queryOptions.order = [['id', 'DESC']];
        }

        return await Voucher.findAll(queryOptions);
    } catch (error) {
        logger.error('Lỗi khi tải danh sách vouchers', { error: error.message, stack: error.stack });
        throw error;
    }
};

// Đếm số lượng vouchers
const countVoucher = async (searchKeyword = '') => {
    try {
        const queryOptions = { where: {} };

        if (searchKeyword) {
            queryOptions.where.voucher = { [Op.like]: `%${searchKeyword}%` };
        }

        return await Voucher.count(queryOptions);
    } catch (error) {
        logger.error('Lỗi khi đếm vouchers', { error: error.message, stack: error.stack });
        throw error;
    }
};

// Xóa voucher theo ID
const deleteVoucher = async (idVoucher) => {
    try {
        return await Voucher.destroy({ where: { id: idVoucher } });
    } catch (error) {
        logger.error('Lỗi khi xóa voucher', { error: error.message, stack: error.stack, idVoucher });
        throw error;
    }
};

// Lấy thông tin voucher theo ID
const getVoucherById = async (id) => {
    try {
        return await Voucher.findOne({ where: { id: id } });
    } catch (error) {
        logger.error('Lỗi khi lấy voucher', { error: error.message, stack: error.stack, id });
        throw error;
    }
};

// Cập nhật thông tin voucher
const updateVoucher = async (idVoucher, voucherCode, value, endAt) => {
    try {
        return await Voucher.update({ voucher: voucherCode, value, end_at: endAt }, { where: { id: idVoucher } });
    } catch (error) {
        logger.error('Lỗi khi cập nhật voucher', { error: error.message, stack: error.stack, idVoucher });
        throw error;
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

const applyVoucherAPI = async (voucherCode) => {
    try {
        const now = new Date();
        const voucher = await Voucher.findOne({
            where: {
                voucher: voucherCode,
                [Op.or]: [
                    { end_at: { [Op.gte]: now } },
                    { end_at: null }
                ]
            }
        });

        return voucher || null;
    } catch (error) {
        logger.error('Lỗi khi truy vấn voucher', { error: error.message, stack: error.stack, voucherCode });
        throw error;
    }
};

export default {
    Voucher,
    addVoucher,
    listVoucher,
    deleteVoucher,
    getVoucherById,
    updateVoucher,
    countVoucher,
    // API
    applyVoucherAPI
};