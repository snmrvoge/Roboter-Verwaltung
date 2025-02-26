const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const icalGenerator = require('ical-generator').default;
const app = express();

// Pfad zur Datendatei
const DATA_FILE = path.join(__dirname, 'mock-data.json');

// Initialer Datenspeicher
let mockData = {
  robots: [
    {
      _id: 'robot1',
      name: 'R2-D2',
      type: 'Astromech',
      status: 'available',
      homebase: 'Tatooine'
    },
    {
      _id: 'robot2',
      name: 'C-3PO',
      type: 'Protocol',
      status: 'available',
      homebase: 'Tatooine'
    }
  ],
  reservations: [
    {
      _id: 'res1',
      robotId: {
        _id: 'robot1',
        name: 'R2-D2',
        type: 'Astromech',
        status: 'available',
        homebase: 'Tatooine'
      },
      userId: {
        _id: '123456789',
        username: 'testuser',
        role: 'admin',
        name: 'Test User'
      },
      startDate: '2025-02-25T10:00:00Z',
      endDate: '2025-02-26T10:00:00Z',
      eventName: 'Test Event',
      location: 'Test Location'
    }
  ],
  users: [
    {
      _id: 'admin123',
      email: 'admin@example.com',
      username: 'admin',
      role: 'admin',
      name: 'Administrator'
    },
    {
      _id: 'user1',
      email: 'user1@example.com',
      username: 'user1',
      role: 'user',
      name: 'Test User 1'
    },
    {
      _id: 'user2',
      email: 'user2@example.com',
      username: 'user2',
      role: 'user',
      name: 'Test User 2'
    }
  ]
};

// Lade Daten aus Datei, falls vorhanden
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsedData = JSON.parse(data);
      
      // Stelle sicher, dass die Struktur korrekt ist
      if (!parsedData.robots) parsedData.robots = [];
      if (!parsedData.reservations) parsedData.reservations = [];
      if (!parsedData.users) parsedData.users = [];
      
      console.log('Daten aus Datei geladen:', Object.keys(parsedData));
      
      // Entferne doppelte Reservierungen (basierend auf _id)
      const uniqueReservations = [];
      const reservationIds = new Set();
      
      parsedData.reservations.forEach(reservation => {
        if (!reservationIds.has(reservation._id)) {
          reservationIds.add(reservation._id);
          uniqueReservations.push(reservation);
        } else {
          console.log('Doppelte Reservierung entfernt:', reservation._id);
        }
      });
      
      // Stelle sicher, dass alle Reservierungen vollständige Roboter-Objekte haben
      const cleanedReservations = uniqueReservations.map(reservation => {
        // Wenn robotId ein String ist, ersetze ihn durch das vollständige Roboter-Objekt
        if (typeof reservation.robotId === 'string') {
          const robot = parsedData.robots.find(r => r._id === reservation.robotId);
          if (robot) {
            reservation.robotId = { ...robot };
          } else {
            console.log('Warnung: Roboter nicht gefunden für Reservierung:', reservation._id);
            // Ungültige Reservierung ohne gültigen Roboter
            return null;
          }
        }
        return reservation;
      }).filter(Boolean); // Entferne null-Werte (ungültige Reservierungen)
      
      // Aktualisiere die Daten
      mockData = {
        robots: parsedData.robots,
        reservations: cleanedReservations,
        users: parsedData.users
      };
      
      console.log('Anzahl Roboter:', mockData.robots.length);
      console.log('Anzahl Reservierungen:', mockData.reservations.length);
      console.log('Anzahl Benutzer:', mockData.users.length);
      
      if (uniqueReservations.length !== parsedData.reservations.length || 
          cleanedReservations.length !== uniqueReservations.length) {
        console.log(`Bereinigt: ${parsedData.reservations.length - cleanedReservations.length} problematische Reservierungen`);
        saveData(); // Speichere die bereinigten Daten
      }
    } else {
      console.log('Keine Datendatei gefunden, verwende Standarddaten');
      // Speichere Standarddaten
      saveData();
    }
  } catch (error) {
    console.error('Fehler beim Laden der Daten:', error);
    // Bei Fehler: Verwende Standarddaten und speichere sie
    saveData();
  }
}

// Speichere Daten in Datei
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(mockData, null, 2), 'utf8');
    console.log('Daten in Datei gespeichert');
  } catch (error) {
    console.error('Fehler beim Speichern der Daten:', error);
  }
}

// Lade Daten beim Start
loadData();

// CORS konfigurieren
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());

// Logging-Middleware für alle Anfragen
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', req.body);
  }
  if (req.headers.authorization) {
    console.log('Authorization header present');
  }
  next();
});

// Deaktiviere die /api/reservations Route, um Konflikte zu vermeiden
app.all('/api/reservations*', (req, res) => {
  console.log('ACHTUNG: Anfrage an deaktivierte /api/reservations Route:', req.method, req.url);
  res.status(404).json({ message: 'Diese Route ist deaktiviert. Bitte verwenden Sie /api/robots/reservations' });
});

// Deaktiviere auch die alte /api/robots/reservations Route, falls sie noch im Frontend verwendet wird
app.all('/api/robots/reservation', (req, res) => {
  console.log('ACHTUNG: Anfrage an falsch geschriebene Route (ohne s am Ende):', req.method, req.url);
  res.status(404).json({ message: 'Diese Route ist falsch geschrieben. Bitte verwenden Sie /api/robots/reservations (mit s am Ende)' });
});

// Deaktiviere auch andere potenzielle Routen, die zu Konflikten führen könnten
app.all('/api/reservation*', (req, res) => {
  console.log('ACHTUNG: Anfrage an deaktivierte /api/reservation* Route:', req.method, req.url);
  res.status(404).json({ message: 'Diese Route ist deaktiviert. Bitte verwenden Sie /api/robots/reservations' });
});

// Test Route
app.get('/api/test', (req, res) => {
  console.log('Test-Endpunkt aufgerufen');
  res.json({ message: 'API funktioniert!' });
});

// Mock-Authentifizierung
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  console.log(`Login-Versuch: ${email} mit Passwort: ${password}`);
  
  // Admin-Login direkt prüfen
  if (email === 'admin' && password === 'admin123') {
    const adminUser = mockData.users.find(u => u.role === 'admin');
    return res.json({
      token: 'mock-token-admin',
      user: adminUser || {
        _id: 'admin123',
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin',
        name: 'Administrator'
      }
    });
  }
  
  // Suche nach dem Benutzer in der Datenbank
  const user = mockData.users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ message: 'Ungültige Anmeldedaten. Benutzer nicht gefunden.' });
  }
  
  // Normaler Benutzer-Login
  if (password === 'user123') {
    return res.json({
      token: 'mock-token-user',
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  }
  
  // Wenn das Passwort nicht übereinstimmt
  return res.status(401).json({ message: 'Ungültige Anmeldedaten. Falsches Passwort.' });
});

// Mock-Validierung
app.get('/api/auth/validate', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  console.log(`Token-Validierung: ${token}`);
  
  // Admin-Token
  if (token === 'mock-token-admin') {
    return res.json({
      user: {
        _id: 'admin123',
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin',
        name: 'Administrator'
      }
    });
  }
  
  // Benutzer-Token
  res.json({
    user: {
      _id: '123456789',
      email: 'user@example.com',
      username: 'user',
      role: 'user',
      name: 'Normaler Benutzer'
    }
  });
});

// Mock-Roboter
app.get('/api/robots', (req, res) => {
  console.log('Roboter-Endpunkt aufgerufen (GET)');
  res.json(mockData.robots);
});

// Roboter erstellen - nur für Admins
app.post('/api/robots', (req, res) => {
  console.log('Roboter erstellen (POST)');
  console.log('Daten:', req.body);
  
  // Prüfe, ob der Benutzer ein Admin ist
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token !== 'mock-token-admin') {
    return res.status(403).json({ message: 'Nur Administratoren können neue Roboter erstellen' });
  }
  
  // Generiere eine zufällige ID
  const robotId = 'robot' + Math.floor(Math.random() * 1000);
  
  // Erstelle einen neuen Roboter mit den gesendeten Daten
  const newRobot = {
    _id: robotId,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  // Füge den neuen Roboter zum Mock-Datenspeicher hinzu
  mockData.robots.push(newRobot);
  
  // Speichere Änderungen
  saveData();
  
  console.log('Neuer Roboter erstellt:', newRobot);
  console.log('Aktuelle Roboter:', mockData.robots.length);
  res.status(201).json(newRobot);
});

// Roboter aktualisieren
app.put('/api/robots/:id', (req, res) => {
  const robotId = req.params.id;
  console.log(`Roboter aktualisieren (PUT): ${robotId}`);
  console.log('Daten:', req.body);
  
  // Finde den Roboter im Mock-Datenspeicher
  const robotIndex = mockData.robots.findIndex(r => r._id === robotId);
  
  if (robotIndex === -1) {
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  // Aktualisiere den Roboter
  const updatedRobot = {
    ...mockData.robots[robotIndex],
    ...req.body,
    _id: robotId, // Stelle sicher, dass die ID erhalten bleibt
    updatedAt: new Date().toISOString()
  };
  
  // Ersetze den alten Roboter im Mock-Datenspeicher
  mockData.robots[robotIndex] = updatedRobot;
  
  // Aktualisiere auch alle Reservierungen, die diesen Roboter verwenden
  mockData.reservations.forEach(reservation => {
    if (reservation.robotId && reservation.robotId._id === robotId) {
      reservation.robotId = { ...updatedRobot };
    }
  });
  
  // Speichere Änderungen
  saveData();
  
  console.log('Roboter aktualisiert:', updatedRobot);
  res.json(updatedRobot);
});

// Roboter löschen
app.delete('/api/robots/:id', (req, res) => {
  const robotId = req.params.id;
  console.log(`Roboter löschen (DELETE): ${robotId}`);
  
  // Finde den Roboter im Mock-Datenspeicher
  const robotIndex = mockData.robots.findIndex(r => r._id === robotId);
  
  if (robotIndex === -1) {
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  // Entferne den Roboter aus dem Mock-Datenspeicher
  mockData.robots.splice(robotIndex, 1);
  
  // Entferne auch alle Reservierungen für diesen Roboter
  mockData.reservations = mockData.reservations.filter(
    reservation => reservation.robotId && reservation.robotId._id !== robotId
  );
  
  // Speichere Änderungen
  saveData();
  
  console.log('Roboter gelöscht, verbleibende Roboter:', mockData.robots.length);
  res.json({ message: 'Roboter erfolgreich gelöscht', _id: robotId });
});

// WICHTIG: Die Reihenfolge der Routen ist entscheidend!
// Spezifischere Routen müssen vor allgemeineren Routen definiert werden

// Mock-Reservierungen
app.get('/api/robots/reservations', (req, res) => {
  console.log('Reservierungs-Endpunkt aufgerufen (GET)');
  
  try {
    // Validiere und bereinige die Reservierungsdaten
    const uniqueReservations = [];
    const reservationIds = new Set();
    
    mockData.reservations.forEach(reservation => {
      // Prüfe, ob die Reservierung gültig ist
      const isValid = reservation._id && 
                      reservation.robotId && 
                      reservation.userId && 
                      reservation.startDate && 
                      reservation.endDate && 
                      reservation.eventName;
      
      // Füge nur gültige, eindeutige Reservierungen hinzu
      if (isValid && !reservationIds.has(reservation._id)) {
        reservationIds.add(reservation._id);
        uniqueReservations.push(reservation);
      } else if (reservationIds.has(reservation._id)) {
        console.log('Doppelte Reservierung gefiltert:', reservation._id);
      }
    });
    
    // Aktuelles Datum für den Vergleich
    const now = new Date();
    
    // Sortiere Reservierungen: Zukünftige zuerst (nach Startdatum aufsteigend), dann vergangene (nach Startdatum absteigend)
    const sortedReservations = [...uniqueReservations].sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      
      // Prüfe, ob die Reservierungen in der Zukunft oder Vergangenheit liegen
      const aIsFuture = dateA >= now;
      const bIsFuture = dateB >= now;
      
      // Wenn beide in der Zukunft oder beide in der Vergangenheit sind, sortiere nach Startdatum
      if (aIsFuture === bIsFuture) {
        // Für zukünftige Reservierungen: aufsteigend (die nächste zuerst)
        if (aIsFuture) {
          return dateA.getTime() - dateB.getTime();
        }
        // Für vergangene Reservierungen: absteigend (die neueste zuerst)
        return dateB.getTime() - dateA.getTime();
      }
      
      // Zukünftige Reservierungen vor vergangenen anzeigen
      return aIsFuture ? -1 : 1;
    });
    
    // Wenn Änderungen vorgenommen wurden, aktualisiere den Datenspeicher
    if (sortedReservations.length !== mockData.reservations.length) {
      console.log(`Gefiltert: ${mockData.reservations.length - sortedReservations.length} problematische Reservierungen`);
      mockData.reservations = sortedReservations;
      saveData(); // Speichere die bereinigten Daten
    }
    
    console.log(`Sende ${sortedReservations.length} Reservierungen an Client (nächste anstehende zuerst)`);
    res.json(sortedReservations);
  } catch (error) {
    console.error('Fehler beim Abrufen der Reservierungen:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// Neue Reservierung erstellen
app.post('/api/robots/reservations', (req, res) => {
  console.log('Reservierungs-Endpunkt aufgerufen (POST)');
  
  try {
    const { robotId, startDate, endDate, eventName, userId, location } = req.body;
    
    if (!robotId || !startDate || !endDate || !eventName) {
      return res.status(400).json({ message: 'Alle Felder müssen ausgefüllt sein' });
    }
    
    // Prüfe, ob der Roboter existiert
    const robot = mockData.robots.find(r => r._id === robotId);
    if (!robot) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }
    
    // Konvertiere Datumsangaben zu Date-Objekten für den Vergleich
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Prüfe, ob Start- und Enddatum gültig sind
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Ungültiges Datum oder Zeitformat' });
    }
    
    // Prüfe, ob das Enddatum nach dem Startdatum liegt
    if (end <= start) {
      return res.status(400).json({ message: 'Das Enddatum muss nach dem Startdatum liegen' });
    }
    
    // Prüfe auf Überschneidungen mit bestehenden Reservierungen
    const conflictingReservation = mockData.reservations.find(reservation => {
      // Stelle sicher, dass wir mit dem richtigen Roboter vergleichen
      const reservationRobotId = typeof reservation.robotId === 'string' 
        ? reservation.robotId 
        : reservation.robotId._id;
      
      if (reservationRobotId !== robotId) {
        return false; // Überschneidungen sind nur relevant, wenn es derselbe Roboter ist
      }
      
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);
      
      // Prüfe auf Überschneidungen
      const hasOverlap = (
        // Neue Reservierung beginnt während einer bestehenden
        (start >= reservationStart && start < reservationEnd) ||
        // Neue Reservierung endet während einer bestehenden
        (end > reservationStart && end <= reservationEnd) ||
        // Neue Reservierung umschließt eine bestehende
        (start <= reservationStart && end >= reservationEnd)
      );
      
      console.log(`Prüfe Überschneidung mit Reservierung ${reservation._id} für Roboter ${reservationRobotId}:`, 
        hasOverlap ? 'KONFLIKT GEFUNDEN' : 'Keine Überschneidung',
        `\nStart: ${start} vs ${reservationStart}`,
        `\nEnde: ${end} vs ${reservationEnd}`
      );
      
      return hasOverlap;
    });
    
    if (conflictingReservation) {
      // Formatiere die Zeiträume für die Fehlermeldung
      const conflictStart = new Date(conflictingReservation.startDate);
      const conflictEnd = new Date(conflictingReservation.endDate);
      
      const formatDate = (date) => {
        return date.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      const conflictTimeRange = `${formatDate(conflictStart)} - ${formatDate(conflictEnd)}`;
      const robotName = robot.name || 'Der ausgewählte Roboter';
      
      return res.status(409).json({ 
        message: `Nicht möglich: ${robotName} ist zum Zeitpunkt ${conflictTimeRange} bereits reserviert.`,
        conflictingReservation
      });
    }
    
    // Erstelle neue Reservierung
    const newReservation = {
      _id: uuidv4(),
      robotId: { ...robot }, // Vollständiges Roboter-Objekt speichern
      startDate,
      endDate,
      eventName,
      location: location || '',
      userId: userId || 'anonymous',
      createdAt: new Date().toISOString()
    };
    
    mockData.reservations.push(newReservation);
    saveData();
    
    console.log('Neue Reservierung erstellt:', newReservation._id);
    res.status(201).json(newReservation);
  } catch (error) {
    console.error('Fehler beim Erstellen der Reservierung:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// Reservierung aktualisieren
app.put('/api/robots/reservations/:id', (req, res) => {
  console.log('Reservierung aktualisieren (PUT):', req.params.id);
  
  try {
    const reservationId = req.params.id;
    const { robotId, startDate, endDate, eventName, location } = req.body;
    
    // Finde die zu aktualisierende Reservierung
    const reservationIndex = mockData.reservations.findIndex(r => r._id === reservationId);
    
    if (reservationIndex === -1) {
      return res.status(404).json({ message: 'Reservierung nicht gefunden' });
    }
    
    const existingReservation = mockData.reservations[reservationIndex];
    
    // Prüfe, ob der Roboter existiert, falls er geändert wurde
    let robot = existingReservation.robotId;
    if (robotId && robotId !== existingReservation.robotId._id) {
      robot = mockData.robots.find(r => r._id === robotId);
      if (!robot) {
        return res.status(404).json({ message: 'Roboter nicht gefunden' });
      }
    }
    
    // Konvertiere Datumsangaben zu Date-Objekten für den Vergleich
    const start = new Date(startDate || existingReservation.startDate);
    const end = new Date(endDate || existingReservation.endDate);
    const targetRobotId = robotId || existingReservation.robotId._id;
    
    // Prüfe, ob Start- und Enddatum gültig sind
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Ungültiges Datum oder Zeitformat' });
    }
    
    // Prüfe, ob das Enddatum nach dem Startdatum liegt
    if (end <= start) {
      return res.status(400).json({ message: 'Das Enddatum muss nach dem Startdatum liegen' });
    }
    
    // Prüfe auf Überschneidungen mit anderen Reservierungen
    const conflictingReservation = mockData.reservations.find((reservation, index) => {
      // Ignoriere die aktuelle Reservierung beim Vergleich
      if (index === reservationIndex) return false;
      
      // Stelle sicher, dass wir mit dem richtigen Roboter vergleichen
      const reservationRobotId = typeof reservation.robotId === 'string' 
        ? reservation.robotId 
        : reservation.robotId._id;
      
      if (reservationRobotId !== targetRobotId) {
        return false; // Überschneidungen sind nur relevant, wenn es derselbe Roboter ist
      }
      
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);
      
      // Prüfe auf Überschneidungen
      const hasOverlap = (
        // Aktualisierte Reservierung beginnt während einer bestehenden
        (start >= reservationStart && start < reservationEnd) ||
        // Aktualisierte Reservierung endet während einer bestehenden
        (end > reservationStart && end <= reservationEnd) ||
        // Aktualisierte Reservierung umschließt eine bestehende
        (start <= reservationStart && end >= reservationEnd)
      );
      
      console.log(`Prüfe Überschneidung mit Reservierung ${reservation._id} für Roboter ${reservationRobotId}:`, 
        hasOverlap ? 'KONFLIKT GEFUNDEN' : 'Keine Überschneidung',
        `\nStart: ${start} vs ${reservationStart}`,
        `\nEnde: ${end} vs ${reservationEnd}`
      );
      
      return hasOverlap;
    });
    
    if (conflictingReservation) {
      // Formatiere die Zeiträume für die Fehlermeldung
      const conflictStart = new Date(conflictingReservation.startDate);
      const conflictEnd = new Date(conflictingReservation.endDate);
      
      const formatDate = (date) => {
        return date.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      const conflictTimeRange = `${formatDate(conflictStart)} - ${formatDate(conflictEnd)}`;
      const robotName = robot.name || 'Der ausgewählte Roboter';
      
      return res.status(409).json({ 
        message: `Nicht möglich: ${robotName} ist zum Zeitpunkt ${conflictTimeRange} bereits reserviert.`,
        conflictingReservation
      });
    }
    
    // Aktualisiere die Reservierung
    const updatedReservation = {
      ...existingReservation,
      robotId: typeof robot === 'string' ? mockData.robots.find(r => r._id === robot) : robot,
      startDate: startDate || existingReservation.startDate,
      endDate: endDate || existingReservation.endDate,
      eventName: eventName || existingReservation.eventName,
      location: location !== undefined ? location : existingReservation.location,
      updatedAt: new Date().toISOString()
    };
    
    mockData.reservations[reservationIndex] = updatedReservation;
    saveData();
    
    console.log('Reservierung aktualisiert:', updatedReservation._id);
    res.json(updatedReservation);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Reservierung:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// Reservierung löschen
app.delete('/api/robots/reservations/:id', (req, res) => {
  const reservationId = req.params.id;
  console.log(`Reservierung löschen (DELETE): ${reservationId}`);
  
  // Finde die Reservierung im Mock-Datenspeicher
  const reservationIndex = mockData.reservations.findIndex(r => r._id === reservationId);
  
  if (reservationIndex === -1) {
    return res.status(404).json({ message: 'Reservierung nicht gefunden' });
  }
  
  // Entferne die Reservierung aus dem Mock-Datenspeicher
  mockData.reservations.splice(reservationIndex, 1);
  
  // Speichere Änderungen
  saveData();
  
  console.log('Reservierung gelöscht, verbleibende Reservierungen:', mockData.reservations.length);
  res.json({ message: 'Reservierung erfolgreich gelöscht', _id: reservationId });
});

// Benutzer-Endpunkte
app.get('/api/users', (req, res) => {
  console.log('Benutzer-Endpunkt aufgerufen (GET)');
  
  // Prüfe, ob der Benutzer ein Admin ist
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token !== 'mock-token-admin') {
    return res.status(403).json({ message: 'Nur Administratoren können Benutzer verwalten' });
  }
  
  // Mock-Benutzerliste zurückgeben
  res.json(mockData.users);
});

// Benutzer erstellen - nur für Admins
app.post('/api/users', (req, res) => {
  console.log('Benutzer erstellen (POST)');
  console.log('Daten:', req.body);
  
  // Prüfe, ob der Benutzer ein Admin ist
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token !== 'mock-token-admin') {
    return res.status(403).json({ message: 'Nur Administratoren können neue Benutzer erstellen' });
  }
  
  // Validiere die Eingabedaten
  const { username, password, name, email, role } = req.body;
  
  if (!username || !password || !name || !email || !role) {
    return res.status(400).json({ message: 'Alle Felder müssen ausgefüllt sein' });
  }
  
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ message: 'Der Benutzername muss zwischen 3 und 20 Zeichen lang sein' });
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return res.status(400).json({ message: 'Der Benutzername darf nur Buchstaben und Zahlen enthalten' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ message: 'Das Passwort muss mindestens 6 Zeichen lang sein' });
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    return res.status(400).json({ message: 'Das Passwort darf nur Buchstaben und Zahlen enthalten' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Die E-Mail-Adresse muss ein "@" enthalten' });
  }
  
  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ message: 'Die Rolle muss entweder "admin" oder "user" sein' });
  }
  
  // Generiere eine zufällige ID
  const userId = 'user' + Math.floor(Math.random() * 1000);
  
  // Erstelle einen neuen Benutzer mit den gesendeten Daten
  const newUser = {
    _id: userId,
    username,
    name,
    email,
    role,
    createdAt: new Date().toISOString()
  };
  
  // Hier würde normalerweise der Benutzer in der Datenbank gespeichert werden
  console.log('Neuer Benutzer erstellt:', newUser);
  
  mockData.users.push(newUser);
  saveData();
  
  res.status(201).json(newUser);
});

// Benutzer bearbeiten - nur für Admins
app.put('/api/users/:userId', (req, res) => {
  console.log('Benutzer aktualisieren (PUT)');
  console.log('Daten:', req.body);
  
  // Prüfe, ob der Benutzer ein Admin ist
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token !== 'mock-token-admin') {
    return res.status(403).json({ message: 'Nur Administratoren können Benutzer bearbeiten' });
  }
  
  const userId = req.params.userId;
  console.log('Aktualisiere Benutzer mit ID:', userId);
  
  // Validiere die Eingabedaten
  const { username, name, email, role } = req.body;
  
  if (!username || !name || !email || !role) {
    return res.status(400).json({ message: 'Alle Pflichtfelder müssen ausgefüllt sein' });
  }
  
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ message: 'Der Benutzername muss zwischen 3 und 20 Zeichen lang sein' });
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return res.status(400).json({ message: 'Der Benutzername darf nur Buchstaben und Zahlen enthalten' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ message: 'Die E-Mail-Adresse muss ein "@" enthalten' });
  }
  
  if (role !== 'admin' && role !== 'user') {
    return res.status(400).json({ message: 'Die Rolle muss entweder "admin" oder "user" sein' });
  }
  
  // Hier würde normalerweise der Benutzer in der Datenbank aktualisiert werden
  console.log('Benutzer aktualisiert:', { _id: userId, username, name, email, role });
  
  // Aktualisiere den Benutzer im Mock-Datenspeicher
  const userIndex = mockData.users.findIndex(u => u._id === userId);
  if (userIndex !== -1) {
    mockData.users[userIndex] = {
      _id: userId,
      username,
      name,
      email,
      role
    };
    saveData();
  }
  
  // Sende die aktualisierten Benutzerdaten zurück
  res.json({
    _id: userId,
    username,
    name,
    email,
    role
  });
});

// Passwort ändern
app.post('/api/users/change-password', (req, res) => {
  console.log('Passwort ändern (POST)');
  
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const { currentPassword, newPassword } = req.body;
  
  console.log(`Passwortänderung für Token: ${token}`);
  console.log(`Aktuelles Passwort: ${currentPassword}, Neues Passwort: ${newPassword}`);
  
  // Validierung
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Aktuelles und neues Passwort sind erforderlich' });
  }
  
  // Simuliere Passwortänderung
  // In einer echten Anwendung würden wir hier das Passwort in der Datenbank aktualisieren
  
  // Für Admin
  if (token === 'mock-token-admin' && currentPassword === 'admin123') {
    // In einer echten Anwendung würden wir hier das Passwort in der Datenbank aktualisieren
    console.log('Admin-Passwort geändert');
    
    // Aktualisiere das Passwort für zukünftige Anmeldungen (nur für Testzwecke)
    // In einer echten Anwendung würde dies in der Datenbank gespeichert werden
    return res.json({ message: 'Passwort erfolgreich geändert' });
  }
  
  // Für normale Benutzer
  if (token === 'mock-token-user' && currentPassword === 'user123') {
    console.log('Benutzer-Passwort geändert');
    return res.json({ message: 'Passwort erfolgreich geändert' });
  }
  
  // Falsches aktuelles Passwort
  return res.status(401).json({ message: 'Das aktuelle Passwort ist falsch' });
});

// Benutzer löschen - nur für Admins
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  console.log(`Benutzer löschen (DELETE): ${userId}`);
  
  // Prüfe, ob der Benutzer ein Admin ist
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token !== 'mock-token-admin') {
    return res.status(403).json({ message: 'Nur Administratoren können Benutzer löschen' });
  }
  
  // Hier würde normalerweise der Benutzer aus der Datenbank gelöscht werden
  console.log('Benutzer gelöscht:', userId);
  
  // Entferne den Benutzer aus dem Mock-Datenspeicher
  const userIndex = mockData.users.findIndex(u => u._id === userId);
  if (userIndex !== -1) {
    mockData.users.splice(userIndex, 1);
    saveData();
  }
  
  res.status(200).json({ message: 'Benutzer erfolgreich gelöscht' });
});

// Einzelnen Roboter abrufen - WICHTIG: Diese Route muss nach den /api/robots/reservations Routen kommen
app.get('/api/robots/:id', (req, res) => {
  const robotId = req.params.id;
  console.log(`Einzelnen Roboter abrufen (GET): ${robotId}`);
  
  // Finde den Roboter im Mock-Datenspeicher
  const robot = mockData.robots.find(r => r._id === robotId);
  
  if (!robot) {
    return res.status(404).json({ message: 'Roboter nicht gefunden' });
  }
  
  res.json(robot);
});

// Verfügbare Roboter für einen Zeitraum abrufen
app.post('/api/robots/available', (req, res) => {
  console.log('Verfügbare Roboter für Zeitraum abrufen (POST)');
  console.log('Request body:', req.body);
  
  try {
    const { startDate, endDate, excludeReservationId } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start- und Enddatum sind erforderlich' });
    }
    
    // Konvertiere Datumsangaben zu Date-Objekten
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Prüfe, ob Start- und Enddatum gültig sind
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Ungültiges Datum oder Zeitformat' });
    }
    
    // Prüfe, ob das Enddatum nach dem Startdatum liegt
    if (end <= start) {
      return res.status(400).json({ message: 'Das Enddatum muss nach dem Startdatum liegen' });
    }
    
    // Finde alle Reservierungen, die sich mit dem angegebenen Zeitraum überschneiden
    const overlappingReservations = mockData.reservations.filter(reservation => {
      // Ignoriere die Reservierung, die gerade bearbeitet wird (falls vorhanden)
      if (excludeReservationId && reservation._id === excludeReservationId) {
        return false;
      }
      
      const reservationStart = new Date(reservation.startDate);
      const reservationEnd = new Date(reservation.endDate);
      
      // Prüfe auf Überschneidungen
      const hasOverlap = (
        // Angefragter Zeitraum beginnt während einer bestehenden Reservierung
        (start >= reservationStart && start < reservationEnd) ||
        // Angefragter Zeitraum endet während einer bestehenden Reservierung
        (end > reservationStart && end <= reservationEnd) ||
        // Angefragter Zeitraum umschließt eine bestehende Reservierung
        (start <= reservationStart && end >= reservationEnd)
      );
      
      if (hasOverlap) {
        console.log(`Überschneidung gefunden mit Reservierung ${reservation._id} für Roboter ${reservation.robotId._id}`);
      }
      
      return hasOverlap;
    });
    
    // Sammle die IDs der Roboter, die in diesem Zeitraum bereits reserviert sind
    const reservedRobotIds = new Set();
    overlappingReservations.forEach(reservation => {
      const robotId = typeof reservation.robotId === 'string' 
        ? reservation.robotId 
        : reservation.robotId._id;
      
      reservedRobotIds.add(robotId);
    });
    
    console.log('Reservierte Roboter-IDs:', [...reservedRobotIds]);
    
    // Finde alle Roboter, die nicht in diesem Zeitraum reserviert sind
    const availableRobotIds = mockData.robots
      .filter(robot => !reservedRobotIds.has(robot._id))
      .map(robot => robot._id);
    
    console.log('Verfügbare Roboter-IDs:', availableRobotIds);
    
    res.json(availableRobotIds);
  } catch (error) {
    console.error('Fehler beim Abrufen verfügbarer Roboter:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// Generiere einen iCalendar-Feed für alle Reservierungen
app.get('/api/calendar/ical', (req, res) => {
  try {
    console.log('Generiere iCalendar-Feed');
    
    // Erstelle einen neuen Kalender
    const calendar = icalGenerator({
      name: 'Roboter Reservierungen',
      timezone: 'Europe/Berlin'
    });

    // Füge alle Reservierungen als Events hinzu
    mockData.reservations.forEach(reservation => {
      try {
        console.log('Verarbeite Reservierung:', reservation._id);
        
        // Stelle sicher, dass robotId ein Objekt ist
        const robotId = typeof reservation.robotId === 'string' 
          ? mockData.robots.find(r => r._id === reservation.robotId) 
          : reservation.robotId;
          
        if (!robotId) {
          console.log('Roboter nicht gefunden für Reservierung:', reservation._id);
          return; // Überspringe diese Reservierung
        }
        
        const robotName = robotId.name || 'Unbekannter Roboter';
        const robotType = robotId.type || 'Unbekannter Typ';
        const robotStatus = robotId.status || 'unknown';
        
        // Bestimme die Farbe basierend auf dem Status
        let color;
        if (robotStatus === 'maintenance') {
          color = '#FF0000'; // Rot für Wartung
        } else if (robotStatus === 'reserved') {
          color = '#FFA500'; // Orange für reserviert
        } else {
          color = '#00FF00'; // Grün für verfügbar
        }

        // Erstelle das Event
        calendar.createEvent({
          start: new Date(reservation.startDate),
          end: new Date(reservation.endDate),
          summary: `${reservation.eventName} - ${robotName}`,
          description: `Reservierung für ${robotName} (${robotType})\nOrt: ${reservation.location || 'Nicht angegeben'}\nKontakt: ${reservation.contactPerson?.name || 'Nicht angegeben'}`,
          location: reservation.location || 'Nicht angegeben'
        });
      } catch (eventError) {
        console.error('Fehler beim Verarbeiten einer Reservierung:', eventError);
      }
    });

    // Füge Wartungszeiten als separate Events hinzu
    mockData.robots.forEach(robot => {
      try {
        if (robot.status === 'maintenance') {
          console.log('Verarbeite Wartung für Roboter:', robot._id);
          
          // Für Roboter in Wartung, erstelle ein Event für die nächsten 7 Tage
          const now = new Date();
          const endMaintenance = new Date(now);
          endMaintenance.setDate(now.getDate() + 7);

          // Erstelle das Event
          calendar.createEvent({
            start: now,
            end: endMaintenance,
            summary: `WARTUNG: ${robot.name}`,
            description: `${robot.name} (${robot.type}) ist in Wartung und nicht verfügbar.`,
            location: robot.homebase || 'Unbekannt'
          });
        }
      } catch (maintenanceError) {
        console.error('Fehler beim Verarbeiten einer Wartung:', maintenanceError);
      }
    });

    // Setze den Content-Type und sende den Kalender
    res.set('Content-Type', 'text/calendar; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="roboter-reservierungen.ics"');
    res.send(calendar.toString());
  } catch (error) {
    console.error('Fehler beim Generieren des iCalendar-Feeds:', error);
    res.status(500).json({ error: 'Fehler beim Generieren des Kalenders' });
  }
});

// Generiere eine öffentliche URL für den Kalender-Feed (nur für Ansicht)
app.get('/api/calendar/public', (req, res) => {
  // Generiere einen Token für den öffentlichen Zugriff
  const publicToken = uuidv4();
  
  // Speichere den Token (in einer echten Anwendung würde man das in einer Datenbank speichern)
  if (!mockData.publicTokens) {
    mockData.publicTokens = [];
  }
  
  // Lösche alte Tokens, die älter als 30 Tage sind
  const now = new Date();
  mockData.publicTokens = mockData.publicTokens.filter(token => {
    const tokenDate = new Date(token.createdAt);
    const diffDays = Math.floor((now - tokenDate) / (1000 * 60 * 60 * 24));
    return diffDays < 30;
  });
  
  // Füge den neuen Token hinzu
  mockData.publicTokens.push({
    token: publicToken,
    createdAt: now.toISOString()
  });
  
  // Speichere die aktualisierten Daten
  saveData();
  
  // Generiere die öffentliche URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const publicUrl = `${baseUrl}/api/calendar/public/${publicToken}`;
  
  res.json({ 
    url: publicUrl,
    icalUrl: `${baseUrl}/api/calendar/public/${publicToken}/ical`,
    message: 'Diese URL kann in Kalender-Anwendungen abonniert werden. Der Link ist 30 Tage gültig.'
  });
});

// Öffentlicher Zugriff auf den Kalender mit Token
app.get('/api/calendar/public/:token', (req, res) => {
  const { token } = req.params;
  
  // Überprüfe, ob der Token gültig ist
  if (!mockData.publicTokens || !mockData.publicTokens.some(t => t.token === token)) {
    return res.status(404).json({ error: 'Ungültiger oder abgelaufener Token' });
  }
  
  // Sende eine HTML-Seite mit einem eingebetteten Kalender
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Roboter Reservierungen</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        h1 { color: #333; }
        .calendar-container { margin-top: 20px; }
        .legend { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; }
        .legend-item { display: flex; align-items: center; margin-right: 20px; }
        .color-box { width: 20px; height: 20px; margin-right: 5px; }
        .available { background-color: #00FF00; }
        .reserved { background-color: #FFA500; }
        .maintenance { background-color: #FF0000; }
      </style>
    </head>
    <body>
      <h1>Roboter Reservierungen - Nur Ansicht</h1>
      <p>Hier sehen Sie alle aktuellen Reservierungen und Wartungszeiten für unsere Roboter.</p>
      
      <div class="legend">
        <div class="legend-item">
          <div class="color-box available"></div>
          <span>Verfügbar</span>
        </div>
        <div class="legend-item">
          <div class="color-box reserved"></div>
          <span>Reserviert</span>
        </div>
        <div class="legend-item">
          <div class="color-box maintenance"></div>
          <span>In Wartung</span>
        </div>
      </div>
      
      <div class="calendar-container">
        <p>Um diesen Kalender zu abonnieren, nutzen Sie bitte folgende URL in Ihrer Kalender-Anwendung:</p>
        <code>${req.protocol}://${req.get('host')}/api/calendar/public/${token}/ical</code>
        
        <p>Alternativ können Sie den Kalender <a href="${req.protocol}://${req.get('host')}/api/calendar/public/${token}/ical" target="_blank">hier herunterladen</a>.</p>
      </div>
    </body>
    </html>
  `);
});

// Öffentlicher Zugriff auf den iCalendar-Feed mit Token
app.get('/api/calendar/public/:token/ical', (req, res) => {
  const { token } = req.params;
  
  // Überprüfe, ob der Token gültig ist
  if (!mockData.publicTokens || !mockData.publicTokens.some(t => t.token === token)) {
    return res.status(404).json({ error: 'Ungültiger oder abgelaufener Token' });
  }
  
  // Leite zur iCalendar-Route weiter
  req.url = '/api/calendar/ical';
  app._router.handle(req, res);
});

// Statische Dateien für das Frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all Route für das Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Starte den Server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log('CORS Origin: http://localhost:3000');
  console.log('Test-Anmeldedaten: Beliebiger Benutzername und Passwort werden akzeptiert');
  console.log('Daten werden in', DATA_FILE, 'gespeichert');
});

// Fehlerbehandlung für unbehandelte Fehler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unbehandelte Ablehnung bei:', promise, 'Grund:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Unbehandelte Ausnahme:', err);
});
