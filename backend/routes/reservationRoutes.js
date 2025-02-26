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

// GET /api/reservations - Alle Reservierungen abrufen
router.get('/', auth, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate('robotId')
      .populate('userId');
    res.json(reservations);
  } catch (error) {
    console.error('Fehler beim Laden der Reservierungen:', error);
    res.status(500).json({ message: 'Server-Fehler beim Laden der Reservierungen' });
  }
});

// POST /api/reservations - Neue Reservierung erstellen
router.post('/', auth, async (req, res) => {
  try {
    const { robotId, startDate, endDate, eventName, location } = req.body;

    if (!robotId || !startDate || !endDate || !eventName || !location) {
      return res.status(400).json({ message: 'Alle Felder sind erforderlich' });
    }

    const robot = await Robot.findById(robotId);
    if (!robot) {
      return res.status(404).json({ message: 'Roboter nicht gefunden' });
    }

    if (robot.status === 'maintenance') {
      return res.status(400).json({ message: 'Roboter ist in Wartung und kann nicht reserviert werden' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      return res.status(400).json({ message: 'Enddatum muss nach dem Startdatum liegen' });
    }

    // Überprüfe Überschneidungen
    const existingReservation = await Reservation.findOne({
      robotId: robot._id,
      $or: [
        { startDate: { $lte: start }, endDate: { $gt: start } },
        { startDate: { $lt: end }, endDate: { $gte: end } },
        { startDate: { $gte: start }, endDate: { $lte: end } }
      ]
    });

    if (existingReservation) {
      return res.status(400).json({ message: 'Zeitraum bereits reserviert' });
    }

    const reservation = new Reservation({
      robotId: robot._id,
      userId: req.user._id,
      startDate: start,
      endDate: end,
      eventName,
      location
    });

    await reservation.save();

    if (start <= now && end >= now) {
      robot.status = 'reserved';
      await robot.save();
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Fehler beim Erstellen der Reservierung:', error);
    res.status(500).json({ message: 'Server-Fehler beim Erstellen der Reservierung' });
  }
});

// DELETE /api/reservations/:id - Reservierung löschen
router.delete('/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('robotId')
      .populate('userId');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservierung nicht gefunden' });
    }

    if (req.user.role !== 'admin' && reservation.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Löschen dieser Reservierung' });
    }

    const now = new Date();
    if (reservation.startDate <= now && reservation.endDate >= now) {
      reservation.robotId.status = 'available';
      await reservation.robotId.save();
    }

    await reservation.deleteOne();
    res.json({ message: 'Reservierung erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Reservierung:', error);
    res.status(500).json({ message: 'Server-Fehler beim Löschen der Reservierung' });
  }
});

module.exports = router;
