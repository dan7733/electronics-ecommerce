import { Sequelize, DataTypes } from 'sequelize'
import mysql from 'mysql2'
import logger from './logger.js'

const sequelize = new Sequelize(
  'electronics_ecommerce', // Đã cập nhật tên DB mới
  'root',
  'root',
  {
    host: 'mysql',
    dialect: 'mysql',
    logging: false,
  }
)

export { sequelize, DataTypes }