const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const auth = async (req, res, next) => {
  try {
    console.log('Auth Headers:', req.headers);
    const authHeader = req.header('Authorization');
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Kein gültiger Authorization Header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Extrahierter Token:', token.substring(0, 10) + '...');

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET nicht in Umgebungsvariablen gefunden!');
      throw new Error('JWT_SECRET nicht konfiguriert');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('Decodierter Token:', decoded);
    } catch (jwtError) {
      console.error('JWT Verifizierungsfehler:', jwtError);
      throw jwtError;
    }

    // Überprüfe, ob die ID ein gültiges MongoDB ObjectId Format hat
    if (!decoded._id || !mongoose.Types.ObjectId.isValid(decoded._id)) {
      console.error('Ungültige Benutzer-ID im Token:', decoded._id);
      throw new Error('Ungültige Benutzer-ID im Token');
    }

    try {
      const user = await User.findById(decoded._id);
      console.log('Gefundener Benutzer:', user ? {
        id: user._id,
        username: user.username,
        role: user.role
      } : 'Nicht gefunden');

      if (!user) {
        throw new Error('Benutzer nicht gefunden');
      }

      // Füge Benutzer und Token zum Request hinzu
      req.user = {
        _id: user._id,
        role: user.role,
        username: user.username,
        name: user.name
      };
      req.token = token;

      console.log('Auth erfolgreich:', {
        userId: req.user._id,
        role: req.user.role,
        username: req.user.username
      });

      next();
    } catch (dbError) {
      console.error('Datenbank-Fehler bei Benutzersuche:', dbError);
      throw new Error('Fehler beim Zugriff auf Benutzerdaten');
    }
  } catch (error) {
    console.error('Auth Middleware Fehler:', error);
    console.error('Fehler Stack:', error.stack);
    
    let message = 'Bitte authentifizieren Sie sich';
    
    if (error.name === 'JsonWebTokenError') {
      message = 'Ungültiger Token';
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token abgelaufen';
    }
    
    res.status(401).json({ 
      message,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = auth;
