const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');
const { verifyInternalKey } = require('../middleware/internalMiddleware');

// Internal service-to-service creation route (from Payroll backend)
router.post('/create-ticket', verifyInternalKey, supportController.createTicket);

// Internal service-to-service status sync/reply routes (from Payroll backend)
router.post('/reply/:id', (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];
  if (apiKey) {
    return verifyInternalKey(req, res, next);
  }
  return protect(req, res, next);
}, supportController.replyToTicket);

router.put('/:id/status', (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];
  if (apiKey) {
    return verifyInternalKey(req, res, next);
  }
  return protect(req, res, next);
}, supportController.updateTicketStatus);

// Super Admin dashboard routes
router.get('/', protect, supportController.getAllTickets);
router.get('/:id', protect, supportController.getTicketById);

module.exports = router;
