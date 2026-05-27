const BlockedIp = require('../models/BlockedIp');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all blocked IPs
// @route   GET /api/master/ip-block
// @access  Private (Superadmin)
const getBlockedIps = asyncHandler(async (req, res) => {
  const ips = await BlockedIp.findAll({ order: [['createdAt', 'DESC']] });
  res.json(ips);
});

// @desc    Add a blocked IP
// @route   POST /api/master/ip-block
// @access  Private (Superadmin)
const addBlockedIp = asyncHandler(async (req, res) => {
  const { ipAddress, reason } = req.body;

  if (!ipAddress) {
    res.status(400);
    throw new Error('IP Address is required');
  }

  const existing = await BlockedIp.findOne({ where: { ipAddress } });
  if (existing) {
    res.status(400);
    throw new Error('IP is already blocked');
  }

  const blockedIp = await BlockedIp.create({ ipAddress, reason });
  res.status(201).json(blockedIp);
});

// @desc    Remove a blocked IP
// @route   DELETE /api/master/ip-block/:id
// @access  Private (Superadmin)
const removeBlockedIp = asyncHandler(async (req, res) => {
  const blockedIp = await BlockedIp.findByPk(req.params.id);

  if (!blockedIp) {
    res.status(404);
    throw new Error('Blocked IP not found');
  }

  await blockedIp.destroy();
  res.json({ message: 'IP removed from blocklist' });
});

module.exports = {
  getBlockedIps,
  addBlockedIp,
  removeBlockedIp,
};
