const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Firebase DB Models
const { robotModel, reservationModel, userModel } = require('./firebase-db');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://roboter-verwaltung-2025.ew.r.appspot.com', 'https://roboter-verwaltung-2025.appspot.com'] 
    : 'http://localhost:3000',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await userModel.getByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await userModel.getByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Robot Routes
app.get('/api/robots', async (req, res) => {
  try {
    const robots = await robotModel.getAll();
    res.json(Object.entries(robots).map(([id, robot]) => ({ id, ...robot })));
  } catch (error) {
    console.error('Get robots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/robots/:id', async (req, res) => {
  try {
    const robot = await robotModel.getById(req.params.id);
    if (!robot) {
      return res.status(404).json({ message: 'Robot not found' });
    }
    res.json({ id: req.params.id, ...robot });
  } catch (error) {
    console.error('Get robot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/robots', authenticateToken, async (req, res) => {
  try {
    const robot = await robotModel.create(req.body);
    res.status(201).json(robot);
  } catch (error) {
    console.error('Create robot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/robots/:id', authenticateToken, async (req, res) => {
  try {
    const robot = await robotModel.update(req.params.id, req.body);
    res.json(robot);
  } catch (error) {
    console.error('Update robot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/robots/:id', authenticateToken, async (req, res) => {
  try {
    await robotModel.delete(req.params.id);
    res.json({ message: 'Robot deleted' });
  } catch (error) {
    console.error('Delete robot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reservation Routes
app.get('/api/reservations', async (req, res) => {
  try {
    const reservations = await reservationModel.getAll();
    res.json(Object.entries(reservations).map(([id, reservation]) => ({ id, ...reservation })));
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/reservations/:id', async (req, res) => {
  try {
    const reservation = await reservationModel.getById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json({ id: req.params.id, ...reservation });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/reservations', authenticateToken, async (req, res) => {
  try {
    const reservation = await reservationModel.create({
      ...req.body,
      userId: req.user.id,
      createdAt: new Date().toISOString()
    });
    res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/reservations/:id', authenticateToken, async (req, res) => {
  try {
    const reservation = await reservationModel.getById(req.params.id);
    
    // Check if reservation exists
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check if user is authorized
    if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedReservation = await reservationModel.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString()
    });
    
    res.json(updatedReservation);
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/reservations/:id', authenticateToken, async (req, res) => {
  try {
    const reservation = await reservationModel.getById(req.params.id);
    
    // Check if reservation exists
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    
    // Check if user is authorized
    if (reservation.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await reservationModel.delete(req.params.id);
    res.json({ message: 'Reservation deleted' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test Route
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'API is working!' });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // For any request that doesn't match an API route, serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Error Handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS Origin: ${process.env.NODE_ENV === 'production' ? 'Production URLs' : 'http://localhost:3000'}`);
  console.log('Database: Firebase Realtime Database');
});
