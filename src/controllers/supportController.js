const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const axios = require('axios');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * Validate internal API key for client sync requests
 */
const validateInternalKey = (req) => {
  const internalApiKey = req.headers['x-internal-api-key'];
  const validKeys = [
    process.env.PAYROLL_INTERNAL_API_KEY || 'kiaan_internal_secret_2026',
    process.env.ATTENDANCE_INTERNAL_API_KEY || 'kiaan_attendance_secret_2026'
  ];
  return internalApiKey && validKeys.includes(internalApiKey);
};

/**
 * Sync tickets from child systems (Attendance / Payroll)
 * POST /api/support/create-ticket
 */
exports.createTicketSync = asyncHandler(async (req, res) => {
  if (!validateInternalKey(req)) {
    return res.status(401).json({ success: false, message: 'Unauthorized sync request.' });
  }

  const { ticketNumber, companyId, companyName, userId, subject, category, priority = 'Medium', description, projectName } = req.body;

  if (!ticketNumber || !companyId || !subject || !description) {
    return res.status(400).json({ success: false, message: 'Required fields missing for sync.' });
  }

  // 1. Insert or ignore if duplicate
  const [existing] = await sequelize.query(
    'SELECT id FROM support_tickets WHERE ticket_number = :ticketNumber LIMIT 1',
    { replacements: { ticketNumber }, type: QueryTypes.SELECT }
  );

  if (existing) {
    return res.json({ success: true, message: 'Ticket already synced.' });
  }

  // 2. Save ticket in superadmin database
  const [insertedId] = await sequelize.query(
    `INSERT INTO support_tickets (ticket_number, company_id, company_name, project_name, user_id, subject, category, priority, description, status, created_at, updated_at)
     VALUES (:ticketNumber, :companyId, :companyName, :projectName, :userId, :subject, :category, :priority, :description, 'Open', NOW(), NOW())`,
    {
      replacements: { ticketNumber, companyId, companyName, projectName, userId, subject, category, priority, description },
      type: QueryTypes.INSERT
    }
  );

  // 3. Save first message
  await sequelize.query(
    `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message, created_at)
     VALUES (:insertedId, 'client', :userId, :description, NOW())`,
    {
      replacements: { insertedId, userId, description },
      type: QueryTypes.INSERT
    }
  );

  res.status(201).json({ success: true, message: 'Ticket created and synced successfully.' });
});

/**
 * Fetch all support tickets
 * GET /api/support/tickets
 */
exports.getAllTickets = asyncHandler(async (req, res) => {
  const tickets = await sequelize.query(
    'SELECT * FROM support_tickets ORDER BY created_at DESC',
    { type: QueryTypes.SELECT }
  );
  res.json({ success: true, tickets });
});

/**
 * Get ticket details with message history
 * GET /api/support/ticket/:id
 */
exports.getTicketById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tickets = await sequelize.query(
    'SELECT * FROM support_tickets WHERE id = :id LIMIT 1',
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  
  const ticket = tickets[0];
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  const messages = await sequelize.query(
    'SELECT * FROM ticket_messages WHERE ticket_id = :id ORDER BY created_at ASC',
    { replacements: { id }, type: QueryTypes.SELECT }
  );

  // Attach messages directly to the ticket object as expected by SupportDesk.jsx
  ticket.messages = messages;

  res.json({ success: true, ticket });
});

/**
 * Reply to support ticket (Superadmin)
 * POST /api/support/reply/:id
 */
exports.replyToTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
  }

  const tickets = await sequelize.query(
    'SELECT * FROM support_tickets WHERE id = :id LIMIT 1',
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  
  const ticket = tickets[0];
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  // 1. Save reply message in superadmin DB
  const [insertedId] = await sequelize.query(
    `INSERT INTO ticket_messages (ticket_id, sender_type, sender_id, message, created_at)
     VALUES (:ticketId, 'admin', 0, :message, NOW())`,
    {
      replacements: { ticketId: id, message },
      type: QueryTypes.INSERT
    }
  );

  // 2. Update status in superadmin DB
  await sequelize.query(
    "UPDATE support_tickets SET status = 'Waiting For Client', updated_at = NOW() WHERE id = :ticketId",
    { replacements: { ticketId: id }, type: QueryTypes.UPDATE }
  );

  // 3. Sync reply back to child project
  const projectName = ticket.project_name || '';
  if (projectName.toLowerCase().includes('attendance') || projectName.toLowerCase().includes('hrm')) {
    try {
      const attendanceUrl = `${process.env.ATTENDANCE_API_URL || 'http://localhost:8081'}/api/internal/support/sync`;
      await axios.post(attendanceUrl, {
        action: 'reply',
        ticketNumber: ticket.ticket_number,
        reply: message
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.ATTENDANCE_INTERNAL_API_KEY || 'kiaan_attendance_secret_2026'
        },
        timeout: 5000
      });
    } catch (err) {
      console.error('[SUPPORT_SYNC] Failed to sync reply to Attendance SaaS:', err.message);
    }
  } else if (projectName.toLowerCase().includes('payroll')) {
    try {
      const payrollUrl = `${process.env.PAYROLL_API_URL || 'http://localhost:5001'}/api/internal/support/sync`;
      await axios.post(payrollUrl, {
        action: 'reply',
        ticketNumber: ticket.ticket_number,
        reply: message
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.PAYROLL_INTERNAL_API_KEY || 'kiaan_internal_secret_2026'
        },
        timeout: 5000
      });
    } catch (err) {
      console.error('[SUPPORT_SYNC] Failed to sync reply to Payroll SaaS:', err.message);
    }
  }

  res.json({
    success: true,
    message: 'Reply sent and synced successfully.',
    data: {
      id: insertedId,
      ticket_id: parseInt(id, 10),
      sender_type: 'admin',
      sender_id: 0,
      message,
      created_at: new Date().toISOString()
    }
  });
});

/**
 * Update support ticket status (Superadmin)
 * PUT /api/support/ticket/:id/status
 */
exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const tickets = await sequelize.query(
    'SELECT * FROM support_tickets WHERE id = :id LIMIT 1',
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  
  const ticket = tickets[0];
  if (!ticket) {
    return res.status(404).json({ success: false, message: 'Ticket not found.' });
  }

  // 1. Update status in superadmin DB
  await sequelize.query(
    'UPDATE support_tickets SET status = :status, updated_at = NOW() WHERE id = :ticketId',
    { replacements: { ticketId: id, status }, type: QueryTypes.UPDATE }
  );

  // 2. Sync status back to child project
  const projectName = ticket.project_name || '';
  if (projectName.toLowerCase().includes('attendance') || projectName.toLowerCase().includes('hrm')) {
    try {
      const attendanceUrl = `${process.env.ATTENDANCE_API_URL || 'http://localhost:8081'}/api/internal/support/sync`;
      await axios.post(attendanceUrl, {
        action: 'status',
        ticketNumber: ticket.ticket_number,
        status: status
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.ATTENDANCE_INTERNAL_API_KEY || 'kiaan_attendance_secret_2026'
        },
        timeout: 5000
      });
    } catch (err) {
      console.error('[SUPPORT_SYNC] Failed to sync status to Attendance SaaS:', err.message);
    }
  } else if (projectName.toLowerCase().includes('payroll')) {
    try {
      const payrollUrl = `${process.env.PAYROLL_API_URL || 'http://localhost:5001'}/api/internal/support/sync`;
      await axios.post(payrollUrl, {
        action: 'status',
        ticketNumber: ticket.ticket_number,
        status: status
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.PAYROLL_INTERNAL_API_KEY || 'kiaan_internal_secret_2026'
        },
        timeout: 5000
      });
    } catch (err) {
      console.error('[SUPPORT_SYNC] Failed to sync status to Payroll SaaS:', err.message);
    }
  }

  res.json({ success: true, message: 'Ticket status updated and synced successfully.' });
});
