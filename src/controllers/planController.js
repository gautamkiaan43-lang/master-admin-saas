const Plan = require('../models/Plan');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create a new plan
// @route   POST /api/plans/create
// @access  Private/Admin
const createPlan = asyncHandler(async (req, res) => {
  const { name, price, duration, employeeLimit, features } = req.body;

  const planExists = await Plan.findOne({ where: { name } });

  if (planExists) {
    res.status(400);
    throw new Error('Plan already exists');
  }

  const plan = await Plan.create({
    name,
    price,
    duration,
    employeeLimit,
    features,
  });

  res.status(201).json(plan);
});

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.findAll();
  res.json(plans);
});

// @desc    Update a plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = asyncHandler(async (req, res) => {
  const { name, price, duration, employeeLimit, features } = req.body;

  const plan = await Plan.findByPk(req.params.id);

  if (plan) {
    plan.name = name || plan.name;
    plan.price = price !== undefined ? price : plan.price;
    plan.duration = duration || plan.duration;
    plan.employeeLimit = employeeLimit || plan.employeeLimit;
    plan.features = features || plan.features;

    const updatedPlan = await plan.save();
    res.json(updatedPlan);
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});

// @desc    Delete a plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findByPk(req.params.id);

  if (plan) {
    await plan.destroy();
    res.json({ message: 'Plan removed' });
  } else {
    res.status(404);
    throw new Error('Plan not found');
  }
});

module.exports = {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
};
