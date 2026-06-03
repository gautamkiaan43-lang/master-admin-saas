const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BlockedIp = sequelize.define('BlockedIp', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'blockedips',
  timestamps: true,
});

module.exports = BlockedIp;
