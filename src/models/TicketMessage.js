const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const SupportTicket = require('./SupportTicket');

const TicketMessage = sequelize.define('TicketMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'ticket_id',
    references: {
      model: SupportTicket,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  senderType: {
    type: DataTypes.ENUM('client', 'admin'),
    allowNull: false,
    field: 'sender_type'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'sender_id'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  attachment: {
    type: DataTypes.STRING(255),
    allowNull: true,
  }
}, {
  tableName: 'ticket_messages',
  timestamps: true,
  updatedAt: false, // only createdAt is needed
  underscored: true,
});

SupportTicket.hasMany(TicketMessage, { foreignKey: 'ticket_id', as: 'messages' });
TicketMessage.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });

module.exports = TicketMessage;
