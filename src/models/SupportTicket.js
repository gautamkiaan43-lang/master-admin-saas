const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ticketNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'ticket_number'
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id'
  },
  companyName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'company_name'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    allowNull: false,
    defaultValue: 'Low',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Open', 'Assigned', 'In Progress', 'Waiting For Client', 'Resolved', 'Closed'),
    allowNull: false,
    defaultValue: 'Open',
  },
  projectName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'Payroll SaaS',
    field: 'project_name'
  }
}, {
  tableName: 'support_tickets',
  timestamps: true,
  underscored: true,
});

module.exports = SupportTicket;
