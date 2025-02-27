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
  console.log('=== Get Robots Request ===');
  console.log('Sende Roboter:', db.robots);
  res.json(db.robots);
});

app.get('/api/robots/:id', (req, res) => {
  console.log(`=== Get Robot Request for ID ${req.params.id} ===`);
  const robotId = parseInt(req.params.id);
  const robot = db.robots.find(r => r.id === robotId);
  
  if (!robot) {
    console.log(`Roboter mit ID ${req.params.id} nicht gefunden`);
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  console.log('Gefundener Roboter:', robot);
  res.json(robot);
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

app.put('/api/robots/:id', (req, res) => {
  console.log(`=== Update Robot Request for ID ${req.params.id} ===`);
  console.log('Request body:', req.body);
  
  const robotId = parseInt(req.params.id);
  const robotIndex = db.robots.findIndex(r => r.id === robotId);
  
  if (robotIndex === -1) {
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  // Aktualisiere den Roboter mit den neuen Daten
  const updatedRobot = {
    ...db.robots[robotIndex],
    ...req.body,
    id: robotId // ID bleibt unverändert
  };
  
  // Ersetze den alten Roboter mit dem aktualisierten
  db.robots[robotIndex] = updatedRobot;
  
  // Gib den aktualisierten Roboter zurück
  console.log('Aktualisierter Roboter:', updatedRobot);
  res.json(updatedRobot);
});

app.delete('/api/robots/:id', (req, res) => {
  console.log(`=== Delete Robot Request for ID ${req.params.id} ===`);
  
  const robotId = parseInt(req.params.id);
  const robotIndex = db.robots.findIndex(r => r.id === robotId);
  
  if (robotIndex === -1) {
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  db.robots.splice(robotIndex, 1);
  res.status(204).send();
});

// Reservierungs-Routen
app.get('/api/robots/reservations', (req, res) => {
  res.json(db.reservations);
});

app.post('/api/robots/reservations', (req, res) => {
  console.log('=== Create Reservation Request ===');
  console.log('Request body:', req.body);
  
  const newId = db.reservations.length > 0 ? Math.max(...db.reservations.map(r => r.id)) + 1 : 1;
  
  const newReservation = {
    id: newId,
    robotId: req.body.robotId,
    userId: req.body.userId,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    purpose: req.body.purpose
  };
  
  db.reservations.push(newReservation);
  res.status(201).json(newReservation);
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
