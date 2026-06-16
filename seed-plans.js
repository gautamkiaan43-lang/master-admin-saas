const mysql = require('mysql2/promise');

async function seedPlans() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: 'master_saas_db_local'
  });

  console.log('Connected to MySQL to seed plans.');

  try {
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM plans');
    if (existing[0].count === 0) {
      console.log('Seeding plans...');
      const plans = [
        {
          name: '10 Days Free',
          price: 0.00,
          duration: 10,
          employeeLimit: 5,
          features: JSON.stringify(["Basic Module Access", "Standard Reports", "Email Support"])
        },
        {
          name: 'Premium',
          price: 25000.00,
          duration: 365,
          employeeLimit: 99999,
          features: JSON.stringify(["All Modules Included", "Priority Support", "API Access", "Custom Branding", "Dedicated Manager"])
        }
      ];

      for (const plan of plans) {
        await connection.query(
          'INSERT INTO plans (name, price, duration, employeeLimit, features, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [plan.name, plan.price, plan.duration, plan.employeeLimit, plan.features]
        );
        console.log(`Plan '${plan.name}' seeded.`);
      }
    } else {
      console.log('Plans already exist. Skipping seeding.');
    }
  } catch (err) {
    console.error('Error seeding plans:', err);
  } finally {
    await connection.end();
  }
}

seedPlans();
