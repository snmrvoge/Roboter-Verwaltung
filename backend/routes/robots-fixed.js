const express = require('express');
const router = express.Router();
const Robot = require('../models/Robot');
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Alle Roboter abrufen
router.get('/', auth, async (req, res) => {
  try {
    console.log('=== Roboter Abrufen Start ===');
    console.log('Benutzer:', req.user);
    
    const robots = await Robot.find();
    console.log('Gefundene Roboter:', robots.length);
    
    res.json(robots);
    console.log('=== Roboter Abrufen Ende ===');
  } catch (error) {
    console.error('Fehler beim Laden der Roboter:', error);
    res.status(500).json({ message: 'Server-Fehler beim Laden der Roboter' });
  }
});

// Alle Reservierungen abrufen
router.get('/reservations', auth, async (req, res) => {
  try {
    console.log('=== Reservierungen Abrufen Start ===');
    console.log('Benutzer:', req.user ? {
      id: req.user._id,
      role: req.user.role,
      username: req.user.username
    } : 'Nicht authentifiziert');
    
    // Sicherstellen, dass die Modelle korrekt geladen sind
    if (!Reservation) {
      console.error('Reservation Modell nicht verfügbar');
      return res.status(500).json({ message: 'Interner Serverfehler: Modell nicht verfügbar' });
    }
    
    try {
      console.log('Führe Datenbankabfrage aus...');
      
      // Einfachere Abfrage ohne populate, um Fehler zu vermeiden
      const reservations = await Reservation.find();
      
      console.log('Abfrage erfolgreich, Anzahl gefundener Reservierungen:', reservations ? reservations.length : 0);
      
      if (!reservations || reservations.length === 0) {
        console.log('Keine Reservierungen gefunden');
        return res.json([]);
      }
      
      // Nur die notwendigen Daten zurückgeben
      const sanitizedReservations = reservations.map(reservation => {
        return reservation.toObject();
      });
      
      console.log('Sende Antwort mit', sanitizedReservations.length, 'Reservierungen');
      console.log('=== Reservierungen Abrufen Ende ===');
      
      res.json(sanitizedReservations);
    } catch (dbError) {
      console.error('Datenbankfehler beim Laden der Reservierungen:', dbError);
      return res.status(500).json({ message: 'Datenbankfehler beim Laden der Reservierungen' });
    }
  } catch (error) {
    console.error('Allgemeiner Fehler beim Laden der Reservierungen:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server-Fehler beim Laden der Reservierungen' });
  }
});

// Neue Reservierung erstellen
router.post('/reservations', auth, async (req, res) => {
  try {
    console.log('=== Neue Reservierung Start ===');
    console.log('Empfangene Reservierungsdaten:', req.body);
    console.log('Auth User:', req.user);
    
    const { robotId, startDate, endDate, eventName, location, contactPerson } = req.body;
    
    // Validierung
    if (!robotId || !startDate || !endDate || !eventName || !location) {
      console.log('Fehlende Pflichtfelder');
      return res.status(400).json({ message: 'Alle Pflichtfelder müssen ausgefüllt sein' });
    }
    
    // Überprüfe, ob der Roboter existiert
    let robot;
    try {
      if (!mongoose.Types.ObjectId.isValid(robotId)) {
        console.log('Ungültige Roboter-ID:', robotId);
        return res.status(400).json({ message: 'Ungültige Roboter-ID' });
      }
      
      robot = await Robot.findById(robotId);
      
      if (!robot) {
        console.log('Roboter nicht gefunden:', robotId);
        return res.status(404).json({ message: 'Roboter nicht gefunden' });
      }
      
      console.log('Roboter gefunden:', robot.name);
    } catch (dbError) {
      console.error('Datenbankfehler bei Robotersuche:', dbError);
      return res.status(500).json({ message: 'Datenbankfehler bei Robotersuche' });
    }
    
    // Erstelle neue Reservierung
    try {
      const reservation = new Reservation({
        robotId: robot._id,
        userId: req.user._id,
        eventName,
        location,
        contactPerson: contactPerson || {
          name: req.user.name || 'Nicht angegeben',
          email: req.user.email || 'Nicht angegeben',
          phone: 'Nicht angegeben'
        },
        startDate,
        endDate
      });
      
      await reservation.save();
      console.log('Reservierung erfolgreich erstellt:', reservation._id);
      
      res.status(201).json(reservation);
      console.log('=== Neue Reservierung Ende ===');
    } catch (saveError) {
      console.error('Fehler beim Speichern der Reservierung:', saveError);
      res.status(500).json({ message: 'Fehler beim Speichern der Reservierung' });
    }
  } catch (error) {
    console.error('Allgemeiner Fehler bei Reservierungserstellung:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server-Fehler bei Reservierungserstellung' });
  }
});

// Reservierung löschen
router.delete('/reservations/:id', auth, async (req, res) => {
  try {
    console.log('=== Reservierung Löschen Start ===');
    console.log('Reservierungs-ID:', req.params.id);
    console.log('Auth User:', req.user);
    
    // Überprüfe, ob die ID gültig ist
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Ungültige Reservierungs-ID');
      return res.status(400).json({ message: 'Ungültige Reservierungs-ID' });
    }
    
    // Finde und lösche die Reservierung
    try {
      const reservation = await Reservation.findById(req.params.id);
      
      if (!reservation) {
        console.log('Reservierung nicht gefunden');
        return res.status(404).json({ message: 'Reservierung nicht gefunden' });
      }
      
      // Nur der Ersteller oder ein Admin darf löschen
      if (reservation.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        console.log('Keine Berechtigung zum Löschen');
        return res.status(403).json({ message: 'Keine Berechtigung zum Löschen dieser Reservierung' });
      }
      
      await Reservation.findByIdAndDelete(req.params.id);
      console.log('Reservierung erfolgreich gelöscht');
      
      res.json({ message: 'Reservierung erfolgreich gelöscht' });
      console.log('=== Reservierung Löschen Ende ===');
    } catch (dbError) {
      console.error('Datenbankfehler beim Löschen der Reservierung:', dbError);
      res.status(500).json({ message: 'Datenbankfehler beim Löschen der Reservierung' });
    }
  } catch (error) {
    console.error('Allgemeiner Fehler beim Löschen der Reservierung:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server-Fehler beim Löschen der Reservierung' });
  }
});

module.exports = router;
