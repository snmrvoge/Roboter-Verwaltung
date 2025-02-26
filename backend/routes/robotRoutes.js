const express = require('express');
const router = express.Router();
const Robot = require('../models/Robot');
const Reservation = require('../models/Reservation');
const jwt = require('jsonwebtoken');

// Auth Middleware
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Bitte authentifizieren Sie sich' });
  }
};

// Middleware für Admin-Berechtigungen
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Nur Administratoren können diese Aktion ausführen' });
  }
  next();
};

// GET /api/robots - Alle Roboter abrufen
router.get('/', auth, async (req, res) => {
  try {
    const robots = await Robot.find();
    res.json(robots);
  } catch (error) {
    console.error('Fehler beim Abrufen der Roboter:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen der Roboter' });
  }
});

// GET /api/robots/:id - Einzelnen Roboter abrufen
router.get('/:id', auth, async (req, res) => {
  try {
    const robot = await Robot.findById(req.params.id);
    if (!robot) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }
    res.json(robot);
  } catch (error) {
    console.error('Fehler beim Abrufen des Roboters:', error);
    res.status(500).json({ message: 'Server-Fehler beim Abrufen des Roboters' });
  }
});

// POST /api/robots - Neuen Roboter erstellen
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { name, type, homebase } = req.body;

    if (!name || !type || !homebase) {
      return res.status(400).json({ message: 'Name, Typ und Homebase sind erforderlich' });
    }

    const robot = new Robot({
      name,
      type,
      homebase,
      status: 'available'
    });

    await robot.save();
    res.status(201).json(robot);
  } catch (error) {
    console.error('Fehler beim Erstellen des Roboters:', error);
    res.status(500).json({ message: 'Server-Fehler beim Erstellen des Roboters' });
  }
});

// PUT /api/robots/:id - Roboter aktualisieren
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    console.log('PUT Request erhalten:', {
      params: req.params,
      body: req.body,
      headers: req.headers
    });

    const robotId = req.params.id;
    const { name, type, status, homebase } = req.body;

    if (!name || !type || !homebase) {
      return res.status(400).json({ message: 'Name, Typ und Homebase sind erforderlich' });
    }

    const robot = await Robot.findById(robotId);
    if (!robot) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }

    // Prüfe auf aktive Reservierungen wenn Status geändert wird
    if (robot.status === 'reserved' && status === 'available') {
      const activeReservation = await Reservation.findOne({
        robotId: robot._id,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() }
      });

      if (activeReservation) {
        return res.status(400).json({
          message: 'Roboter kann nicht auf verfügbar gesetzt werden, da noch eine aktive Reservierung besteht'
        });
      }
    }

    robot.name = name;
    robot.type = type;
    robot.status = status;
    robot.homebase = homebase;

    const updatedRobot = await robot.save();
    console.log('Roboter aktualisiert:', updatedRobot);
    res.json(updatedRobot);
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Roboters:', error);
    res.status(500).json({ message: 'Server-Fehler beim Aktualisieren des Roboters' });
  }
});

// DELETE /api/robots/:id - Roboter löschen
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const robot = await Robot.findById(req.params.id);
    if (!robot) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }

    await robot.deleteOne();
    res.json({ message: 'Roboter erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Roboters:', error);
    res.status(500).json({ message: 'Server-Fehler beim Löschen des Roboters' });
  }
});

module.exports = router;
