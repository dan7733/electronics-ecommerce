import express from 'express';
import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import logger from '../configs/logger.js'; // Import custom logger

const Store = sequelize.define("Store", {
    store_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    open_hours: {
        type: DataTypes.STRING,
        allowNull: false
    },
    close_hour: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: "stores",
    timestamps: false
});

const addStore = async (name, address, latitude, longitude, open_hours, close_hour) => {
    try {
        const newStore = await Store.create({
            name,
            address,
            latitude,
            longitude,
            open_hours,
            close_hour
        });
        return newStore;
    } catch (error) {
        logger.error("Lỗi khi thêm cửa hàng", { error: error.message, stack: error.stack });
        throw error;
    }
};

const getAllStores = async () => {
    try {
        const stores = await Store.findAll();
        return stores;
    } catch (error) {
        logger.error("Lỗi khi lấy danh sách cửa hàng", { error: error.message, stack: error.stack });
        throw error;
    }
};

const deleteStore = async (idStore) => {
    try {
        const result = await Store.destroy({
            where: { store_id: idStore }
        });
        return result ? true : false;
    } catch (error) {
        logger.error('Lỗi khi xóa cửa hàng', { error: error.message, stack: error.stack, idStore });
        throw error;
    }
};

const getStoreById = async (storeId) => {
    if (!storeId) {
        throw new Error('Yêu cầu id cửa hàng');
    }
    try {
        const result = await Store.findOne({ where: { store_id: storeId } });
        return result;
    } catch (error) {
        logger.error('Lỗi khi tìm cửa hàng', { error: error.message, stack: error.stack, storeId });
        throw error;
    }
};

const updateStore = async (storeId, name, address, latitude, longitude, open_hours, close_hour) => {
    try {
        const result = await Store.update(
            {
                name: name,
                address: address,
                latitude: latitude,
                longitude: longitude,
                open_hours: open_hours,
                close_hour: close_hour
            },
            {
                where: { store_id: storeId }
            }
        );
        return result;
    } catch (error) {
        logger.error("Lỗi khi cập nhật cửa hàng", { error: error.message, stack: error.stack, storeId });
        throw error;
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////// api//////////////////////////////////////////////////

const getAllStoresAPI = async () => {
    try {
        const stores = await Store.findAll();
        return stores;
    } catch (error) {
        logger.error("Lỗi khi lấy danh sách cửa hàng", { error: error.message, stack: error.stack });
        throw error;
    }
};

export default {
    addStore,
    getAllStores,
    deleteStore,
    getStoreById,
    updateStore,
    // API
    getAllStoresAPI
};