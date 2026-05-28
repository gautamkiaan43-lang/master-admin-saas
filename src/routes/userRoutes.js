const express = require('express');
const router = express.Router();
const {
  registerUser,
  getUsers,
  getUserById,
  updatePlan,
  toggleStatus,
  blockUser,
  deleteUser,
  clientLogin,
  verifySubscription,
} = require('../controllers/userController');
const {
  getBlockedIps,
  addBlockedIp,
  removeBlockedIp,
} = require('../controllers/ipController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (called from external software)
router.post('/register', registerUser);
router.post('/client-login', clientLogin);
router.get('/verify-subscription', verifySubscription);

// Protected routes (Superadmin only)
router.use(protect);
router.get('/users', getUsers);
router.get('/user/:id', getUserById);
router.post('/update-plan', updatePlan);
router.post('/toggle-status', toggleStatus);
router.post('/block-user', blockUser);
router.delete('/delete-user/:id', deleteUser);

// IP Blocklist Routes
router.get('/ip-block', getBlockedIps);
router.post('/ip-block', addBlockedIp);
router.delete('/ip-block/:id', removeBlockedIp);

module.exports = router;
