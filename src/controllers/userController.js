const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // Note: ensure axios is installed or use native fetch if Node 18+
const BlockedIp = require('../models/BlockedIp');

// Helper to simulate webhook dispatch to client software
const dispatchWebhook = async (user, eventType) => {
  // In a real scenario, you'd look up the webhook URL for the user's softwareName
  // e.g., const webhookUrl = getWebhookUrlForSoftware(user.softwareName);
  const webhookUrl = 'http://localhost:3000/api/webhooks/master-saas'; // Placeholder
  try {
    console.log(`[Webhook] Dispatching ${eventType} for user ${user.id} to ${webhookUrl}`);
    // await axios.post(webhookUrl, { userId: user.id, email: user.email, event: eventType, status: { active: user.active, isBlocked: user.isBlocked } });
  } catch (error) {
    console.error(`[Webhook Error] Failed to dispatch ${eventType} to ${webhookUrl}:`, error.message);
  }
};

// @desc    Register a new user/company
// @route   POST /api/master/register
// @access  Public (called from external software)
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, companyName, softwareName, plan, planPrice, expiryDate, ipAddress, password } = req.body;

  const userExists = await User.findOne({ where: { email } });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Get IP address from req.body if provided, else from req.ip (e.g. proxy/client ip)
  const clientIpAddress = ipAddress || req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

  // Hash password if provided
  let hashedPassword = null;
  if (password) {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(password, salt);
  }

  const user = await User.create({
    name,
    email,
    phone,
    companyName,
    softwareName,
    plan,
    planPrice: planPrice || 0,
    expiryDate: new Date(expiryDate),
    active: true,
    ipAddress: clientIpAddress,
    password: hashedPassword,
  });

  if (user) {
    // Don't return hashed password to frontend
    const { password: _pw, ...safeUser } = user.toJSON();
    res.status(201).json(safeUser);
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Get all users with filtering, sorting, pagination
// @route   GET /api/master/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  // Auto-seed initial illustrative users if database is empty
  const userCount = await User.count();
  if (userCount === 0) {
    await User.bulkCreate([
      {
        name: "Ramesh Kumar",
        email: "ramesh@rtco.in",
        phone: "+91 98765-43210",
        companyName: "Ramesh Trading Co.",
        softwareName: "Payroll Software",
        plan: "Premium",
        planPrice: 45000.00,
        expiryDate: new Date("2027-01-14"),
        active: true,
        isBlocked: false,
        ipAddress: "192.168.1.45"
      },
      {
        name: "Priya Sharma",
        email: "priya@sharmatech.com",
        phone: "+91 97654-32109",
        companyName: "Sharma Tech Solutions",
        softwareName: "HRM Software",
        plan: "Premium",
        planPrice: 35000.00,
        expiryDate: new Date("2026-08-15"),
        active: true,
        isBlocked: false,
        ipAddress: "10.0.0.12"
      },
      {
        name: "Suresh Patel",
        email: "suresh@patelindustries.com",
        phone: "+91 96543-21098",
        companyName: "Patel Industries",
        softwareName: "Employee Monitoring",
        plan: "FREE_TRIAL",
        planPrice: 0.00,
        expiryDate: new Date("2026-06-10"),
        active: false,
        isBlocked: false,
        ipAddress: "172.16.254.1"
      },
      {
        name: "Anita Singh",
        email: "anita@singhautomobiles.in",
        phone: "+91 95432-10987",
        companyName: "Singh Automobiles",
        softwareName: "Turf Software",
        plan: "Premium",
        planPrice: 25000.00,
        expiryDate: new Date("2028-11-20"),
        active: true,
        isBlocked: false,
        ipAddress: "192.168.0.100"
      }
    ]);
  }

  const { softwareName, plan, active, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'DESC' } = req.query;

  const queryOptions = {
    where: {},
    order: [[sortBy, order]],
    limit: parseInt(limit, 10),
    offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
  };

  if (softwareName) queryOptions.where.softwareName = softwareName;
  if (plan) queryOptions.where.plan = plan;
  if (active !== undefined) queryOptions.where.active = active === 'true';

  if (search) {
    queryOptions.where = {
      ...queryOptions.where,
      [Op.or]: [
        { email: { [Op.like]: `%${search}%` } },
        { companyName: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
      ],
    };
  }

  const { count, rows } = await User.findAndCountAll(queryOptions);

  // Strip password from all returned users
  const safeUsers = rows.map(u => {
    const { password: _pw, ...rest } = u.toJSON();
    return rest;
  });

  res.json({
    totalUsers: count,
    totalPages: Math.ceil(count / parseInt(limit, 10)),
    currentPage: parseInt(page, 10),
    users: safeUsers,
  });
});

// @desc    Get single user details
// @route   GET /api/master/user/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user plan
// @route   POST /api/master/update-plan
// @access  Private/Admin
const updatePlan = asyncHandler(async (req, res) => {
  const { id, name, companyName, email, phone, softwareName, plan, planPrice, expiryDate, password } = req.body;

  const user = await User.findByPk(id);

  if (user) {
    user.name = name !== undefined ? name : user.name;
    user.companyName = companyName !== undefined ? companyName : user.companyName;
    user.email = email !== undefined ? email : user.email;
    user.phone = phone !== undefined ? phone : user.phone;
    user.softwareName = softwareName !== undefined ? softwareName : user.softwareName;
    user.plan = plan !== undefined ? plan : user.plan;
    user.planPrice = planPrice !== undefined ? planPrice : user.planPrice;
    user.expiryDate = expiryDate ? new Date(expiryDate) : user.expiryDate;

    // Update password only if a new one is provided
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    const { password: _pw, ...safeUpdated } = user.toJSON();
    res.json(safeUpdated);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Toggle user status (activate/deactivate)
// @route   POST /api/master/toggle-status
// @access  Private/Admin
const toggleStatus = asyncHandler(async (req, res) => {
  const { id, active } = req.body;

  const user = await User.findByPk(id);

  if (user) {
    user.active = active;
    const updatedUser = await user.save();
    
    // Dispatch webhook to external software
    dispatchWebhook(updatedUser, 'USER_STATUS_TOGGLED');
    
    res.json({ message: `User status updated to ${active ? 'active' : 'inactive'}`, user: updatedUser });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/master/delete-user/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (user) {
    await user.destroy();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Block or Unblock user
// @route   POST /api/master/block-user
// @access  Private/Admin
const blockUser = asyncHandler(async (req, res) => {
  const { id, isBlocked } = req.body;

  const user = await User.findByPk(id);

  if (user) {
    user.isBlocked = isBlocked;
    const updatedUser = await user.save();
    
    // Dispatch webhook to external software
    dispatchWebhook(updatedUser, 'USER_BLOCKED_TOGGLED');

    res.json({ message: `User status updated to ${isBlocked ? 'blocked' : 'unblocked'}`, user: updatedUser });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Authenticate client software user (SSO login)
// @route   POST /api/master/client-login
// @access  Public (called from external software)
const clientLogin = asyncHandler(async (req, res) => {
  const { email, password, softwareName, ipAddress } = req.body;

  const clientIpAddress = ipAddress || req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;

  // 1. Check IP Blocklist
  if (clientIpAddress) {
    const isIpBlocked = await BlockedIp.findOne({ where: { ipAddress: clientIpAddress } });
    if (isIpBlocked) {
      res.status(403);
      throw new Error(`Access denied. IP ${clientIpAddress} is blocked.`);
    }
  }

  // 2. Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // 3. Verify software (Optional: ensure user is logging into the software they bought)
  // if (softwareName && user.softwareName !== softwareName) {
  //   res.status(403);
  //   throw new Error(`User does not have access to ${softwareName}`);
  // }

  // 4. Verify password
  if (!user.password || !(await bcrypt.compare(password, user.password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // 5. Check user status
  if (!user.active) {
    res.status(403);
    throw new Error('Account is inactive. Please contact support.');
  }

  if (user.isBlocked) {
    res.status(403);
    throw new Error('Account has been blocked. Please contact support.');
  }

  if (new Date() > new Date(user.expiryDate)) {
    res.status(403);
    throw new Error('Subscription plan has expired. Please renew.');
  }

  // 6. Generate token for client software
  const token = jwt.sign({ id: user.id, softwareName: user.softwareName }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token valid for 1 day
  });

  const { password: _pw, ...safeUser } = user.toJSON();

  res.json({
    message: 'Authentication successful',
    token,
    user: safeUser
  });
});

module.exports = {
  registerUser,
  getUsers,
  getUserById,
  updatePlan,
  toggleStatus,
  blockUser,
  deleteUser,
  clientLogin,
};
