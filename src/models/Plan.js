const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING, // e.g., FREE_TRIAL, BASIC, PREMIUM
    allowNull: false,
    unique: true,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  duration: {
    type: DataTypes.INTEGER, // in days
    allowNull: false,
  },
  employeeLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  features: {
    type: DataTypes.JSON, // Array of features stored as JSON
    allowNull: true,
  },
}, {
  tableName: 'plans',
  timestamps: true,
});

module.exports = Plan;
