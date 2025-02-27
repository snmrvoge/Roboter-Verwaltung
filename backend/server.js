const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Pfad zur JSON-Datenbankdatei
const DB_PATH = path.join(__dirname, 'db.json');

// Standarddaten für die Initialisierung
const DEFAULT_DB = {
  robots: {
    "robot1": {
      "name": "R2-D2",
      "type": "Astromech",
      "status": "available",
      "description": "Ein zuverlässiger Astromech-Droide mit vielen nützlichen Werkzeugen."
    },
    "robot2": {
      "name": "C-3PO",
      "type": "Protokoll",
      "status": "available",
      "description": "Ein Protokolldroide, der über 6 Millionen Kommunikationsformen beherrscht."
    },
    "robot3": {
      "name": "BB-8",
      "type": "Astromech",
      "status": "available",
      "description": "Ein kugelförmiger Astromech-Droide mit einem hohen Maß an Unabhängigkeit."
    },
    "robot4": {
      "name": "K-2SO",
      "type": "Sicherheit",
      "status": "available",
      "description": "Ein umprogrammierter imperialer Sicherheitsdroide mit einer direkten Persönlichkeit."
    }
  },
  users: {
    "user1": {
      "name": "Admin",
      "email": "admin@example.com",
      "password": "$2b$10$kLt72AD5xLOIst7N3Cd1HOUsCVolKk5GrflSC8TXcqsaiR4EQIFEy",
      "role": "admin"
    },
    "user2": {
      "name": "Test User",
      "email": "user@example.com",
      "password": "$2b$10$kLt72AD5xLOIst7N3Cd1HOUsCVolKk5GrflSC8TXcqsaiR4EQIFEy",
      "role": "user"
    }
  },
  reservations: {}
};

// Hilfsfunktion zum Initialisieren der Datenbank
const initializeDatabase = () => {
  try {
    // Prüfen, ob die Datenbankdatei existiert
    if (!fs.existsSync(DB_PATH)) {
      console.log('Datenbank existiert nicht. Erstelle neue Datenbank mit Standarddaten...');
      writeDatabase(DEFAULT_DB);
      console.log('Datenbank erfolgreich initialisiert.');
    } else {
      // Prüfen, ob die Datenbank gültig ist
      try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        JSON.parse(data);
        console.log('Bestehende Datenbank erfolgreich geladen.');
      } catch (error) {
        console.error('Datenbank ist beschädigt. Erstelle neue Datenbank mit Standarddaten...', error);
        writeDatabase(DEFAULT_DB);
        console.log('Datenbank erfolgreich zurückgesetzt.');
      }
    }
  } catch (error) {
    console.error('Fehler bei der Initialisierung der Datenbank:', error);
  }
};

// Hilfsfunktion zum Lesen der Datenbank
const readDatabase = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Fehler beim Lesen der Datenbank:', error);
    // Bei Lesefehler Standarddaten zurückgeben und Datenbank neu initialisieren
    initializeDatabase();
    return DEFAULT_DB;
  }
};

// Hilfsfunktion zum Schreiben in die Datenbank
const writeDatabase = (data) => {
  try {
    // Sicherstellen, dass das Verzeichnis existiert
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Fehler beim Schreiben in die Datenbank:', error);
    return false;
  }
};

// Middleware zur Authentifizierung
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Nicht authentifiziert' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token ungültig' });
    }
    req.user = user;
    next();
  });
};

// Middleware für Admin-Rechte
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine Berechtigung' });
  }
  next();
};

// Routen

// Registrierung
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const db = readDatabase();
    
    // Prüfen, ob E-Mail bereits existiert
    const userExists = Object.values(db.users).some(user => user.email === email);
    if (userExists) {
      return res.status(400).json({ message: 'Benutzer existiert bereits' });
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Neuen Benutzer erstellen
    const newUserId = `user${Date.now()}`;
    db.users[newUserId] = {
      name,
      email,
      password: hashedPassword,
      role: 'user' // Standardrolle
    };
    
    writeDatabase(db);
    
    res.status(201).json({ message: 'Benutzer erfolgreich registriert' });
  } catch (error) {
    console.error('Fehler bei der Registrierung:', error);
    res.status(500).json({ message: 'Serverfehler bei der Registrierung' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const db = readDatabase();
    
    // Benutzer finden
    const user = Object.entries(db.users).find(([_, user]) => user.email === email);
    
    if (!user) {
      return res.status(400).json({ message: 'Ungültige Anmeldedaten' });
    }
    
    const [userId, userData] = user;
    
    // Passwort überprüfen
    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Ungültige Anmeldedaten' });
    }
    
    // Token erstellen
    const token = jwt.sign(
      { id: userId, name: userData.name, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      token,
      user: {
        id: userId,
        name: userData.name,
        email: userData.email,
        role: userData.role
      }
    });
  } catch (error) {
    console.error('Fehler beim Login:', error);
    res.status(500).json({ message: 'Serverfehler beim Login' });
  }
});

// Roboter-Routen

// Alle Roboter abrufen
app.get('/api/robots', authenticateToken, (req, res) => {
  try {
    const db = readDatabase();
    const robots = Object.entries(db.robots).map(([id, robot]) => ({
      id,
      ...robot
    }));
    res.json(robots);
  } catch (error) {
    console.error('Fehler beim Abrufen der Roboter:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Roboter' });
  }
});

// Einen Roboter abrufen
app.get('/api/robots/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    
    if (!db.robots[id]) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }
    
    res.json({ id, ...db.robots[id] });
  } catch (error) {
    console.error('Fehler beim Abrufen des Roboters:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen des Roboters' });
  }
});

// Roboter erstellen (nur Admin)
app.post('/api/robots', authenticateToken, isAdmin, (req, res) => {
  try {
    const { name, type, description } = req.body;
    const db = readDatabase();
    
    const newRobotId = `robot${Date.now()}`;
    db.robots[newRobotId] = {
      name,
      type,
      status: 'available',
      description
    };
    
    writeDatabase(db);
    
    res.status(201).json({ id: newRobotId, ...db.robots[newRobotId] });
  } catch (error) {
    console.error('Fehler beim Erstellen des Roboters:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen des Roboters' });
  }
});

// Roboter aktualisieren (nur Admin)
app.put('/api/robots/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, status, description } = req.body;
    const db = readDatabase();
    
    if (!db.robots[id]) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }
    
    db.robots[id] = {
      name: name || db.robots[id].name,
      type: type || db.robots[id].type,
      status: status || db.robots[id].status,
      description: description || db.robots[id].description
    };
    
    writeDatabase(db);
    
    res.json({ id, ...db.robots[id] });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Roboters:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Roboters' });
  }
});

// Roboter löschen (nur Admin)
app.delete('/api/robots/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    
    if (!db.robots[id]) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }
    
    // Prüfen, ob Reservierungen für diesen Roboter existieren
    const hasReservations = Object.values(db.reservations).some(res => res.robotId === id);
    if (hasReservations) {
      return res.status(400).json({ message: 'Roboter hat aktive Reservierungen und kann nicht gelöscht werden' });
    }
    
    delete db.robots[id];
    writeDatabase(db);
    
    res.json({ message: 'Roboter erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Roboters:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen des Roboters' });
  }
});

// Reservierungs-Routen

// Alle Reservierungen abrufen
app.get('/api/reservations', authenticateToken, (req, res) => {
  try {
    const db = readDatabase();
    let reservations;
    
    if (req.user.role === 'admin') {
      // Admin sieht alle Reservierungen
      reservations = Object.entries(db.reservations).map(([id, reservation]) => ({
        id,
        ...reservation
      }));
    } else {
      // Benutzer sieht nur eigene Reservierungen
      reservations = Object.entries(db.reservations)
        .filter(([_, reservation]) => reservation.userId === req.user.id)
        .map(([id, reservation]) => ({
          id,
          ...reservation
        }));
    }
    
    res.json(reservations);
  } catch (error) {
    console.error('Fehler beim Abrufen der Reservierungen:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Reservierungen' });
  }
});

// Eine Reservierung abrufen
app.get('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    
    if (!db.reservations[id]) {
      return res.status(404).json({ message: 'Reservierung nicht gefunden' });
    }
    
    // Prüfen, ob Benutzer Zugriff hat
    if (req.user.role !== 'admin' && db.reservations[id].userId !== req.user.id) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }
    
    res.json({ id, ...db.reservations[id] });
  } catch (error) {
    console.error('Fehler beim Abrufen der Reservierung:', error);
    res.status(500).json({ message: 'Serverfehler beim Abrufen der Reservierung' });
  }
});

// Reservierung erstellen
app.post('/api/reservations', authenticateToken, (req, res) => {
  try {
    const { title, start, end, robotId, description } = req.body;
    const db = readDatabase();
    
    // Prüfen, ob Roboter existiert
    if (!db.robots[robotId]) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }
    
    // Prüfen, ob Roboter verfügbar ist
    if (db.robots[robotId].status !== 'available') {
      return res.status(400).json({ message: 'Roboter ist nicht verfügbar' });
    }
    
    // Prüfen, ob Zeitraum verfügbar ist
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const isOverlapping = Object.values(db.reservations).some(reservation => {
      if (reservation.robotId !== robotId) return false;
      
      const resStart = new Date(reservation.start);
      const resEnd = new Date(reservation.end);
      
      return (startDate < resEnd && endDate > resStart);
    });
    
    if (isOverlapping) {
      return res.status(400).json({ message: 'Zeitraum ist bereits reserviert' });
    }
    
    // Neue Reservierung erstellen
    const newReservationId = `res${Date.now()}`;
    db.reservations[newReservationId] = {
      title,
      start,
      end,
      robotId,
      userId: req.user.id,
      description
    };
    
    writeDatabase(db);
    
    res.status(201).json({ id: newReservationId, ...db.reservations[newReservationId] });
  } catch (error) {
    console.error('Fehler beim Erstellen der Reservierung:', error);
    res.status(500).json({ message: 'Serverfehler beim Erstellen der Reservierung' });
  }
});

// Reservierung aktualisieren
app.put('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, start, end, robotId, description } = req.body;
    const db = readDatabase();
    
    if (!db.reservations[id]) {
      return res.status(404).json({ message: 'Reservierung nicht gefunden' });
    }
    
    // Prüfen, ob Benutzer Zugriff hat
    if (req.user.role !== 'admin' && db.reservations[id].userId !== req.user.id) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }
    
    // Wenn Roboter geändert wird, prüfen ob er existiert
    if (robotId && robotId !== db.reservations[id].robotId) {
      if (!db.robots[robotId]) {
        return res.status(404).json({ message: 'Roboter nicht gefunden' });
      }
      
      if (db.robots[robotId].status !== 'available') {
        return res.status(400).json({ message: 'Roboter ist nicht verfügbar' });
      }
    }
    
    // Wenn Zeitraum geändert wird, prüfen ob er verfügbar ist
    if ((start && start !== db.reservations[id].start) || (end && end !== db.reservations[id].end)) {
      const startDate = new Date(start || db.reservations[id].start);
      const endDate = new Date(end || db.reservations[id].end);
      const currentRobotId = robotId || db.reservations[id].robotId;
      
      const isOverlapping = Object.entries(db.reservations).some(([resId, reservation]) => {
        if (resId === id || reservation.robotId !== currentRobotId) return false;
        
        const resStart = new Date(reservation.start);
        const resEnd = new Date(reservation.end);
        
        return (startDate < resEnd && endDate > resStart);
      });
      
      if (isOverlapping) {
        return res.status(400).json({ message: 'Zeitraum ist bereits reserviert' });
      }
    }
    
    // Reservierung aktualisieren
    db.reservations[id] = {
      title: title || db.reservations[id].title,
      start: start || db.reservations[id].start,
      end: end || db.reservations[id].end,
      robotId: robotId || db.reservations[id].robotId,
      userId: db.reservations[id].userId,
      description: description || db.reservations[id].description
    };
    
    writeDatabase(db);
    
    res.json({ id, ...db.reservations[id] });
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Reservierung:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren der Reservierung' });
  }
});

// Reservierung löschen
app.delete('/api/reservations/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = readDatabase();
    
    if (!db.reservations[id]) {
      return res.status(404).json({ message: 'Reservierung nicht gefunden' });
    }
    
    // Prüfen, ob Benutzer Zugriff hat
    if (req.user.role !== 'admin' && db.reservations[id].userId !== req.user.id) {
      return res.status(403).json({ message: 'Keine Berechtigung' });
    }
    
    delete db.reservations[id];
    writeDatabase(db);
    
    res.json({ message: 'Reservierung erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Reservierung:', error);
    res.status(500).json({ message: 'Serverfehler beim Löschen der Reservierung' });
  }
});

// Test-Endpunkt
app.get('/api/test', (req, res) => {
  res.json({ message: 'API-Verbindung erfolgreich!' });
});

// Catch-all-Route für das Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Datenbank initialisieren
initializeDatabase();

// Server starten
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
