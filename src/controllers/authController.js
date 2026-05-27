const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Auto-seed default superadmin
  const adminCount = await Admin.count();
  if (adminCount === 0) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await Admin.create({
      name: 'Super Admin',
      email: 'admin@master.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
    });
  }

  // Auto-seed user's requested master admin
  const userAdminExists = await Admin.findOne({ where: { email: 'kiaanmaster@gmail.com' } });
  if (!userAdminExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('kiaanmaster@123', salt);
    await Admin.create({
      name: 'Kiaan Master',
      email: 'kiaanmaster@gmail.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
    });
  }

  const admin = await Admin.findOne({ where: { email } });

  if (admin && (await bcrypt.compare(password, admin.password))) {
    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin.id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const updateProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findByPk(req.admin.id);
  
  if (admin) {
    admin.name = req.body.name || admin.name;
    admin.email = req.body.email || admin.email;
    admin.phone = req.body.phone !== undefined ? req.body.phone : admin.phone;
    admin.company = req.body.company !== undefined ? req.body.company : admin.company;

    const updatedAdmin = await admin.save();

    res.json({
      id: updatedAdmin.id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      phone: updatedAdmin.phone,
      company: updatedAdmin.company,
      role: updatedAdmin.role,
      token: generateToken(updatedAdmin.id),
    });
  } else {
    res.status(404);
    throw new Error('Admin not found');
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const admin = await Admin.findByPk(req.admin.id);

  if (admin) {
    const { oldPass, newPass } = req.body;
    
    if (!(await bcrypt.compare(oldPass, admin.password))) {
      res.status(400);
      throw new Error('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPass, salt);
    await admin.save();
    
    res.json({ message: 'Password updated successfully' });
  } else {
    res.status(404);
    throw new Error('Admin not found');
  }
});

module.exports = { login, updateProfile, updatePassword };
