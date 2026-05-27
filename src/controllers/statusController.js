const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Check status of a user by email
// @route   GET /api/master/status/:email
// @access  Public (Used by external software to verify login/subscription)
const checkStatus = asyncHandler(async (req, res) => {
  const { email } = req.params;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Check if expiry date has passed
  const currentDate = new Date();
  const isExpired = currentDate > new Date(user.expiryDate);

  // If expired or blocked, user is not active
  const isActuallyActive = user.active && !isExpired && !user.isBlocked;

  res.json({
    active: isActuallyActive,
    isBlocked: user.isBlocked,
    plan: user.plan,
    expiryDate: user.expiryDate.toISOString().split('T')[0],
  });
});

module.exports = { checkStatus };
