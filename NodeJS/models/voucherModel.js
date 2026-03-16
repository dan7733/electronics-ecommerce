import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
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
        console.error('Lỗi khi thêm voucher:', error);
        throw error;
    }
};

// Lấy danh sách vouchers
const listVoucher = async (offset = null, limit = null, searchKeyword = '', sortOption = 'default') => {
    try {
        // Tạo một object chứa các tùy chọn truy vấn
        const queryOptions = { where: {} };

        // Nếu có từ khóa tìm kiếm thì thêm vào query
        if (searchKeyword) {
            queryOptions.where.voucher = { [Op.like]: `%${searchKeyword}%` };
        }

        // Nếu có offset và limit thì thêm vào query
        if (offset !== null) queryOptions.offset = offset;
        if (limit !== null) queryOptions.limit = limit;

        // Sắp xếp theo tùy chọn
        if (sortOption === 'value_asc') {
            queryOptions.order = [['value', 'ASC']];
        } else if (sortOption === 'value_desc') {
            queryOptions.order = [['value', 'DESC']];
        } else {
            queryOptions.order = [['id', 'DESC']]; // Mặc định sắp xếp theo id giảm dần
        }

        // Truy vấn và trả về kết quả
        return await Voucher.findAll(queryOptions);
    } catch (error) {
        console.error('Lỗi khi tải danh sách vouchers:', error);
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

        return await Voucher.count(queryOptions); // Đổi từ Category sang Voucher
    } catch (error) {
        console.error('Lỗi khi đếm vouchers:', error);
        throw error;
    }
};


// Xóa voucher theo ID
const deleteVoucher = async (idVoucher) => {
    try {
        return await Voucher.destroy({ where: { id: idVoucher } });
    } catch (error) {
        console.error('Lỗi khi xóa voucher:', error);
        throw error;
    }
};

// Lấy thông tin voucher theo ID
const getVoucherById = async (id) => {
    try {
        return await Voucher.findOne({ where: { id: id } });
    } catch (error) {
        console.error('Lỗi khi lấy voucher:', error);
        throw error;
    }
};

// Cập nhật thông tin voucher
const updateVoucher = async (idVoucher, voucherCode, value, endAt) => {
    try {
        return await Voucher.update({ voucher: voucherCode, value, end_at: endAt }, { where: { id: idVoucher } });
    } catch (error) {
        console.error('Lỗi khi cập nhật voucher:', error);
        throw error;
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////
// Kiểm tra và trả về giá trị giảm giá của mã voucher
const applyVoucherAPI = async (voucherCode) => {
    try {
        const now = new Date();
        const voucher = await Voucher.findOne({
            where: {
                voucher: voucherCode,
                [Op.or]: [
                    { end_at: { [Op.gte]: now } },  // chưa hết hạn
                    { end_at: null }                // hoặc không có ngày hết hạn
                ]
            }
        });

        // Không ném lỗi, chỉ return null để controller xử lý
        return voucher || null;
    } catch (error) {
        console.error('Lỗi khi truy vấn voucher:', error.message);
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
