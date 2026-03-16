import { sequelize, DataTypes } from '../configs/connectDatabase.js';
import { Op } from 'sequelize';
import { User } from './userModel.js';
import { Product } from './productModel.js';
import { Order } from './orderModel.js';

const Review = sequelize.define('Review', {
  review_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    },
    onDelete: 'CASCADE'
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
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'order_id'
    },
    onDelete: 'CASCADE'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'reviews'
});

// Define associations
Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });
Review.belongsTo(Order, { foreignKey: 'order_id' });

export { Review }
export default Review;
