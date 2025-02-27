const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Statische Dateien aus dem Frontend-Build-Verzeichnis bereitstellen
app.use(express.static(path.join(__dirname, '../frontend/build')));

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

// Zusätzliche Route für /api/login, die auf /api/auth/login umleitet
app.post('/api/login', (req, res) => {
  console.log('Redirecting from /api/login to /api/auth/login');
  // Weiterleitung der Anfrage an den korrekten Endpunkt
  req.url = '/api/auth/login';
  app._router.handle(req, res);
});

// Dummy-Routen für die Frontend-Anwendung
app.get('/api/robots', (req, res) => {
  res.json([
    {
      id: 1,
      name: "R2-D2",
      type: "Astromech",
      status: "Verfügbar",
      location: "Hauptgebäude"
    },
    {
      id: 2,
      name: "C-3PO",
      type: "Protokoll",
      status: "Verfügbar",
      location: "Konferenzraum"
    }
  ]);
});

app.get('/api/robots/reservations', (req, res) => {
  res.json([]);
});

app.get('/api/auth/validate', (req, res) => {
  res.json({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin'
    }
  });
});

// Catch-all route für das Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
