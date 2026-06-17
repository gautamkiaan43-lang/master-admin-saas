const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

// Public sync route (internal authentication verified inside controller)
router.post('/create-ticket', supportController.createTicketSync);

// Protected routes (require superadmin session token)
router.use(protect);
router.get('/tickets', supportController.getAllTickets);
router.get('/ticket/:id', supportController.getTicketById);
router.post('/reply/:id', supportController.replyToTicket);
router.put('/ticket/:id/status', supportController.updateTicketStatus);

module.exports = router;
