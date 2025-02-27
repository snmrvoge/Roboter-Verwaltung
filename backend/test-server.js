const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS konfigurieren
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Statische Dateien aus dem Frontend-Build-Verzeichnis bereitstellen
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Speicher für Daten (In-Memory-Datenbank)
const db = {
  users: [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123', // In Produktion würde dies gehasht sein
      role: 'admin'
    }
  ],
  robots: [
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
  ],
  reservations: []
};

// API-Routen
app.get('/api/test', (req, res) => {
  res.json({ message: 'API-Verbindung erfolgreich!' });
});

// Login-Route
app.post('/api/auth/login', (req, res) => {
  console.log('=== Login Request ===');
  console.log('Request body:', req.body);
  
  // Immer erfolgreich für Testzwecke
  res.json({
    success: true,
    token: 'test-token-12345',
    user: {
      id: 1,
      name: 'Admin User',
      email: req.body.email || 'admin@example.com',
      role: 'admin'
    }
  });
});

// Umleitung von /api/login zu /api/auth/login
app.post('/api/login', (req, res) => {
  console.log('Redirecting from /api/login to /api/auth/login');
  req.url = '/api/auth/login';
  app._router.handle(req, res);
});

// Token-Validierung
app.get('/api/auth/validate', (req, res) => {
  res.json({
    user: {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    }
  });
});

// Roboter-Routen
app.get('/api/robots', (req, res) => {
  res.json(db.robots);
});

app.post('/api/robots', (req, res) => {
  console.log('=== Create Robot Request ===');
  console.log('Request body:', req.body);
  
  const newId = db.robots.length > 0 ? Math.max(...db.robots.map(r => r.id)) + 1 : 1;
  
  const newRobot = {
    id: newId,
    name: req.body.name,
    type: req.body.type,
    status: req.body.status || 'Verfügbar',
    location: req.body.location
  };
  
  db.robots.push(newRobot);
  res.status(201).json(newRobot);
});

// Reservierungs-Routen
app.get('/api/robots/reservations', (req, res) => {
  res.json(db.reservations);
});

// Benutzer-Routen
app.get('/api/users', (req, res) => {
  // Passwörter nicht zurückgeben
  const users = db.users.map(({ password, ...user }) => user);
  res.json(users);
});

app.post('/api/users', (req, res) => {
  console.log('=== Create User Request ===');
  console.log('Request body:', req.body);
  
  const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  
  const newUser = {
    id: newId,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, // In Produktion hashen!
    role: req.body.role || 'user'
  };
  
  db.users.push(newUser);
  
  // Passwort nicht zurückgeben
  const { password, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Catch-all Route für das Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Server starten
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
