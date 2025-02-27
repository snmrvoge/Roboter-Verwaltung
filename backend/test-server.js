const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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

// Pfad zur JSON-Datenbankdatei
const DB_PATH = path.join(__dirname, 'db.json');

// Initialisiere Datenbank, falls sie nicht existiert
function initializeDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [
        {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          password: '$2a$10$yfIAA9xMUqJSx6nxcn5tAeZCJlMPfRsHY3BNsQJcJGsO.YJrOWeHi', // password123
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
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    console.log('Datenbank initialisiert');
  }
}

// Datenbank lesen
function readDatabase() {
  initializeDatabase();
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

// Datenbank schreiben
function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Test Route
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'API-Verbindung erfolgreich!' });
});

// Login Route
app.post('/api/auth/login', (req, res) => {
  console.log('=== Login Request ===');
  console.log('Request body:', req.body);
  
  // Immer erfolgreich für Testzwecke
  res.json({
    success: true,
    token: 'test-token-12345',
    user: {
      id: '1',
      name: 'Admin User',
      email: req.body.email || 'admin@example.com',
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

// Roboter-Routen
app.get('/api/robots', (req, res) => {
  const db = readDatabase();
  res.json(db.robots);
});

app.post('/api/robots', (req, res) => {
  console.log('=== Create Robot Request ===');
  console.log('Request body:', req.body);
  
  const db = readDatabase();
  const newId = db.robots.length > 0 ? Math.max(...db.robots.map(r => r.id)) + 1 : 1;
  
  const newRobot = {
    id: newId,
    name: req.body.name,
    type: req.body.type,
    status: req.body.status || 'Verfügbar',
    location: req.body.location
  };
  
  db.robots.push(newRobot);
  writeDatabase(db);
  
  res.status(201).json(newRobot);
});

app.put('/api/robots/:id', (req, res) => {
  console.log(`=== Update Robot Request for ID ${req.params.id} ===`);
  console.log('Request body:', req.body);
  
  const robotId = parseInt(req.params.id);
  const db = readDatabase();
  
  const robotIndex = db.robots.findIndex(r => r.id === robotId);
  if (robotIndex === -1) {
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  db.robots[robotIndex] = {
    ...db.robots[robotIndex],
    ...req.body,
    id: robotId // ID bleibt unverändert
  };
  
  writeDatabase(db);
  res.json(db.robots[robotIndex]);
});

app.delete('/api/robots/:id', (req, res) => {
  console.log(`=== Delete Robot Request for ID ${req.params.id} ===`);
  
  const robotId = parseInt(req.params.id);
  const db = readDatabase();
  
  const robotIndex = db.robots.findIndex(r => r.id === robotId);
  if (robotIndex === -1) {
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  db.robots.splice(robotIndex, 1);
  writeDatabase(db);
  
  res.status(204).send();
});

// Reservierungs-Routen
app.get('/api/robots/reservations', (req, res) => {
  const db = readDatabase();
  res.json(db.reservations);
});

app.post('/api/robots/reservations', (req, res) => {
  console.log('=== Create Reservation Request ===');
  console.log('Request body:', req.body);
  
  const db = readDatabase();
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
  writeDatabase(db);
  
  res.status(201).json(newReservation);
});

// Benutzer-Routen
app.get('/api/users', (req, res) => {
  const db = readDatabase();
  // Passwörter nicht zurückgeben
  const users = db.users.map(({ password, ...user }) => user);
  res.json(users);
});

app.post('/api/users', (req, res) => {
  console.log('=== Create User Request ===');
  console.log('Request body:', req.body);
  
  const db = readDatabase();
  const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
  
  // In einer echten Anwendung würde das Passwort gehasht werden
  const newUser = {
    id: newId,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password, // In Produktion hashen!
    role: req.body.role || 'user'
  };
  
  db.users.push(newUser);
  writeDatabase(db);
  
  // Passwort nicht zurückgeben
  const { password, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

// Token-Validierung
app.get('/api/auth/validate', (req, res) => {
  res.json({
    user: {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    }
  });
});

// Catch-all route für das Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Datenbank initialisieren
initializeDatabase();

// Start server
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
