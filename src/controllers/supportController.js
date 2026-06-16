const SupportTicket = require('../models/SupportTicket');
const TicketMessage = require('../models/TicketMessage');

/**
 * Get all tickets raised by Employers
 */
const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: TicketMessage, as: 'messages' }]
    });
    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get single ticket details and messages
 */
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findByPk(id, {
      include: [{ model: TicketMessage, as: 'messages' }]
    });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create Ticket (called internally by Payroll backend)
 */
const createTicket = async (req, res) => {
  try {
    const { ticketNumber, companyId, companyName, userId, subject, category, priority, description, projectName } = req.body;

    const ticket = await SupportTicket.create({
      ticketNumber,
      companyId,
      companyName,
      userId,
      subject,
      category,
      priority: priority || 'Low',
      description,
      projectName: projectName || 'Payroll SaaS',
      status: 'Open'
    });

    // Create the initial ticket message
    await TicketMessage.create({
      ticketId: ticket.id,
      senderType: 'client',
      senderId: userId,
      message: description
    });

    res.status(201).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reply to a Support Ticket from Super Admin
 */
const replyToTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    // Try finding by ID first, then by ticket_number
    let ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      ticket = await SupportTicket.findOne({ where: { ticketNumber: id } });
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const isClientReply = req.body.senderType === 'client' || req.headers['x-internal-api-key'];

    // Add message
    const reply = await TicketMessage.create({
      ticketId: ticket.id,
      senderType: isClientReply ? 'client' : 'admin',
      senderId: isClientReply ? (req.body.senderId || 1) : (req.user ? req.user.id : 1),
      message
    });

    if (isClientReply) {
      ticket.status = 'Open';
      await ticket.save();
      return res.json({ success: true, message: 'Reply received from client successfully.', data: reply });
    }

    // Update ticket status
    ticket.status = 'Waiting For Client';
    await ticket.save();

    // Sync back to Payroll Database
    const payrollService = require('../services/payrollService');
    await payrollService.syncTicketReply(ticket.ticketNumber, message);

    res.json({ success: true, message: 'Reply sent and synced successfully.', data: reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Support Ticket status
 */
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    let ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      ticket = await SupportTicket.findOne({ where: { ticketNumber: id } });
    }

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    ticket.status = status;
    await ticket.save();

    // Sync status back to Payroll
    const payrollService = require('../services/payrollService');
    await payrollService.syncTicketStatus(ticket.ticketNumber, status, ticket.priority);

    res.json({ success: true, message: 'Ticket status updated and synced.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllTickets,
  getTicketById,
  createTicket,
  replyToTicket,
  updateTicketStatus
};
