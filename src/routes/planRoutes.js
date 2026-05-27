const express = require('express');
const router = express.Router();
const {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
} = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPlans);

// Protected routes (Superadmin only)
router.use(protect);
router.post('/create', createPlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
