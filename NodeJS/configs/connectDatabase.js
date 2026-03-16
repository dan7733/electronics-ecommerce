import { Sequelize, DataTypes } from 'sequelize'
import mysql from 'mysql2'

const sequelize = new Sequelize(
  'doan4',
  'root',
  'root',
  {
    host: 'mysql', // ⚠️ giống mongo → host = service name
    dialect: 'mysql',
    logging: false,
  }
)

export { sequelize, DataTypes }
