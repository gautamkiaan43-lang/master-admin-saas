const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const planRoutes = require('./routes/planRoutes');
const statusRoutes = require('./routes/statusRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const supportRoutes = require('./routes/supportRoutes');

// Load support models to sync them with database
require('./models/SupportTicket');
require('./models/TicketMessage');

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://master-admin-kiaan.netlify.app',
      'https://kiaanmastersuperadmin.netlify.app'
    ];

    const isLocal = origin.startsWith('http://localhost') || 
                    origin.startsWith('http://127.0.0.1');

    const isAllowedDomain = isLocal || 
                            allowedOrigins.includes(origin) || 
                            origin.includes('hrpilotpro') || 
                            origin.includes('netlify.app');

    if (isAllowedDomain) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger (optional basic implementation)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', userRoutes);
app.use('/api/master/status', statusRoutes);
app.use('/api/master/dashboard', dashboardRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/support', supportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Master SaaS Backend is running' });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
