import { Sequelize, DataTypes } from 'sequelize'
import mysql from 'mysql2'
import logger from './logger.js' // Import logger cùng cấp

const sequelize = new Sequelize(
  'doan4',
  'root',
  'root',
  {
    host: 'mysql', // ⚠️ giống mongo → host = service name
    dialect: 'mysql',
    // Nếu bạn muốn lưu lịch sử các câu SQL vào file log, thay vì để false hãy dùng dòng dưới:
    // logging: (msg) => logger.debug(msg),
    logging: false,
  }
)

export { sequelize, DataTypes }