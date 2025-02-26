const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Test Route
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'API is working!' });
});

// Simple login route without authentication
app.post('/api/auth/login', (req, res) => {
  console.log('=== Test Login Request ===');
  console.log('Request body:', req.body);
  
  // Return dummy data
  res.json({
    user: {
      _id: '123456789012345678901234',
      username: 'test',
      role: 'admin',
      name: 'Test User'
    },
    token: 'dummy-token'
  });
});

// Simple validate route
app.get('/api/auth/validate', (req, res) => {
  console.log('=== Test Validate Request ===');
  console.log('Headers:', req.headers);
  
  // Return dummy data
  res.json({
    user: {
      _id: '123456789012345678901234',
      username: 'test',
      role: 'admin',
      name: 'Test User'
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server without MongoDB connection
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS Origin: http://localhost:3000');
  console.log('This is a test server without MongoDB connection');
});
