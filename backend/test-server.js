const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Test Route
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'API-Verbindung erfolgreich!' });
});

// Simple login route without authentication
app.post('/api/auth/login', (req, res) => {
  console.log('=== Test Login Request ===');
  console.log('Request body:', req.body);
  
  // Always return success for testing
  res.json({
    success: true,
    token: 'test-token-12345',
    user: {
      id: '1',
      name: 'Test User',
      email: req.body.email || 'test@example.com',
      role: 'admin'
    }
  });
});

// Catch-all route
app.get('*', (req, res) => {
  res.json({ message: 'Roboter-Verwaltung Test-API Server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
