const verifyInternalKey = (req, res, next) => {
  const apiKey = req.headers['x-internal-api-key'];
  const expectedKey = process.env.PAYROLL_INTERNAL_API_KEY || 'kiaan_internal_secret_2026';
  
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(403).json({ success: false, message: 'Forbidden: Invalid internal API key' });
  }
  next();
};

module.exports = { verifyInternalKey };
