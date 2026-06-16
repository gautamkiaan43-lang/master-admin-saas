const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_T1r8sgDPyFz1bB',
  key_secret: 'GBL1GdG1iHJWvDEFkvDyG0Bf',
});

async function run() {
  try {
    console.log('Testing Razorpay order creation...');
    const order = await razorpay.orders.create({
      amount: 800, // INR 8.00 in paise
      currency: 'INR',
      receipt: 'test_receipt_123',
    });
    console.log('Success! Order details:', order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
  }
}

run();
