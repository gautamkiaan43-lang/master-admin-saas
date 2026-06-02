const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt#1' } = req.body;

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create order' });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Transaction not legit!' });
    }

    // Payment is verified
    // We can update the database status here if we have a table for pending transactions
    
    res.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error) {
    console.error('Razorpay Verify Payment Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
