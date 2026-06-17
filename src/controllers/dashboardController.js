const User = require('../models/User');
const sequelize = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');
const { Op } = require('sequelize');

// @desc    Get dashboard analytics
// @route   GET /api/master/dashboard
// @access  Private/Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.count();
  
  const activeUsers = await User.count({ where: { active: true } });
  
  const inactiveUsers = await User.count({ where: { active: false } });
  
  const freeTrialUsers = await User.count({
    where: {
      plan: {
        [Op.in]: ['FREE_TRIAL', '10 Days Free', 'free', 'Free Trial']
      }
    }
  });
  
  const paidUsers = await User.count({
    where: {
      plan: {
        [Op.notIn]: ['FREE_TRIAL', '10 Days Free', 'free', 'Free Trial']
      }
    }
  });

  const totalRevenue = await User.sum('planPrice') || 0;

  // Software wise stats
  const softwareWiseStats = await User.findAll({
    attributes: [
      'softwareName',
      [sequelize.fn('COUNT', sequelize.col('id')), 'userCount'],
    ],
    group: ['softwareName'],
  });

  res.json({
    totalUsers,
    activeUsers,
    inactiveUsers,
    freeTrialUsers,
    paidUsers,
    totalRevenue,
    softwareWiseStats,
  });
});

module.exports = { getDashboardStats };
