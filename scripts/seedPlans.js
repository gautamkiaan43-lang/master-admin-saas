const sequelize = require('../src/config/database');
const Plan = require('../src/models/Plan');

const seedPlans = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const plansToSeed = [
      {
        name: '10 Days Free',
        price: 0,
        duration: 10,
        employeeLimit: 5,
        features: ['Basic Module Access', 'Standard Reports', 'Email Support']
      },
      {
        name: 'Premium_5',
        price: 9.99,
        duration: 30,
        employeeLimit: 5,
        features: ['All Modules Included', 'Priority Support', 'API Access', 'Custom Branding']
      },
      {
        name: 'Premium_12',
        price: 19.99,
        duration: 30,
        employeeLimit: 12,
        features: ['All Modules Included', 'Priority Support', 'API Access', 'Custom Branding']
      },
      {
        name: 'Premium_25',
        price: 29.99,
        duration: 30,
        employeeLimit: 25,
        features: ['All Modules Included', 'Priority Support', 'API Access', 'Custom Branding']
      }
    ];

    for (const p of plansToSeed) {
      const existing = await Plan.findOne({ where: { name: p.name } });
      if (!existing) {
        await Plan.create(p);
        console.log(`Plan created: ${p.name}`);
      } else {
        console.log(`Plan already exists: ${p.name}`);
      }
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedPlans();
