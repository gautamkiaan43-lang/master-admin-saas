const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  softwareName: {
    type: DataTypes.STRING, // HRM, CRM, ERP, Payroll Software, etc.
    allowNull: false,
  },
  plan: {
    type: DataTypes.STRING, // FREE_TRIAL, $10, $20
    allowNull: false,
  },
  planPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true, // optional — set when creating from dashboard
  },
  // ── Payroll Integration Fields ──────────────────────────────────────────────
  payrollCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    comment: 'Company ID in Payroll DB (saas_pop_db.companies.id) — set after provisioning',
  },
  payrollStatus: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
    comment: 'Last known status synced to Payroll: active | suspended | inactive',
  },
}, {
  timestamps: true,
});

module.exports = User;
