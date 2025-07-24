const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables first
dotenv.config();

// Import and connect to database
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Connect to database
connectDB().catch(err => {
  console.error('Database connection failed:', err);
});

const app = express();

// CORS configuration for production and development
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://excel-analytics-jash.vercel.app',
        'https://excel-analytics-jash-pandya.vercel.app'
      ]
    : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api', protectedRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route - this should handle the base URL
app.get("/", (req, res) => {
  res.json({ 
    message: "Excel Analytics Backend API is running!", 
    status: "success",
    endpoints: {
      auth: "/api/auth",
      files: "/api/files", 
      admin: "/api/admin",
      dashboard: "/api/dashboard"
    }
  });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
    }
  });
}

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

// Always export the app for Vercel
module.exports = app;

// Only listen in development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}