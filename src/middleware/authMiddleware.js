const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const Admin = require('../models/Admin');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify admin exists
    const admin = await Admin.findByPk(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
});

module.exports = { protect };
