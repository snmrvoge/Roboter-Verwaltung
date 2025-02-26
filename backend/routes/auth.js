const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login
router.post('/login', async (req, res) => {
  try {
    console.log('=== Login Request Start ===');
    console.log('Request Body:', {
      username: req.body.username,
      hasPassword: !!req.body.password
    });

    const { username, password } = req.body;

    if (!username || !password) {
      console.log('Fehlende Anmeldedaten');
      return res.status(400).json({ message: 'Benutzername und Passwort sind erforderlich' });
    }

    // Benutzer finden
    let user;
    try {
      user = await User.findOne({ username });
      console.log('Benutzer gefunden:', user ? {
        id: user._id,
        username: user.username,
        role: user.role
      } : 'Nicht gefunden');
    } catch (dbError) {
      console.error('Datenbankfehler bei Benutzersuche:', dbError);
      return res.status(500).json({ message: 'Datenbankfehler bei der Benutzersuche' });
    }

    if (!user) {
      console.log('Benutzer nicht gefunden');
      return res.status(400).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Passwort vergleichen
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log('Passwort Vergleich:', isMatch);
    } catch (bcryptError) {
      console.error('Bcrypt Fehler:', bcryptError);
      return res.status(500).json({ message: 'Fehler bei der Passwortüberprüfung' });
    }

    if (!isMatch) {
      console.log('Passwort stimmt nicht überein');
      return res.status(400).json({ message: 'Ungültige Anmeldedaten' });
    }

    // Token generieren
    let token;
    try {
      token = jwt.sign(
        { 
          _id: user._id.toString(),
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );
      console.log('Token generiert');
    } catch (jwtError) {
      console.error('JWT Fehler:', jwtError);
      return res.status(500).json({ message: 'Fehler bei der Token-Generierung' });
    }

    // Erfolgreiche Antwort senden
    const response = {
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      token
    };
    console.log('Sende Antwort:', response);
    console.log('=== Login Request Ende ===');

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server-Fehler beim Login' });
  }
});

// Registrierung
router.post('/register', async (req, res) => {
  try {
    const { username, password, name } = req.body;
    
    // Prüfe ob Benutzer bereits existiert
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Ein Benutzer mit diesem Benutzernamen existiert bereits' });
    }
    
    const user = new User({ username, password, name });
    await user.save();
    
    const token = jwt.sign(
      { 
        _id: user._id.toString(),
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key'
    );
    console.log('Generated token:', token);

    // Update user's tokens array
    user.tokens = user.tokens.concat({ token });
    await user.save();
    console.log('User tokens updated');

    const response = {
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      token
    };
    console.log('Sending response:', response);

    res.status(201).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Aktueller Benutzer
router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Token validation endpoint
router.get('/validate', auth, async (req, res) => {
  try {
    console.log('=== Token Validation Request Start ===');
    console.log('User ID from auth middleware:', req.user._id);
    
    // If we get here, the auth middleware has already validated the token
    try {
      const user = await User.findById(req.user._id);
      
      console.log('User found:', user ? {
        id: user._id,
        username: user.username,
        role: user.role
      } : 'Not found');
      
      if (!user) {
        console.log('User not found in database');
        return res.status(404).json({ message: 'Benutzer nicht gefunden' });
      }
      
      const response = { 
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
          name: user.name
        }
      };
      
      console.log('Sending response:', response);
      console.log('=== Token Validation Request End ===');
      
      res.json(response);
    } catch (dbError) {
      console.error('Database error during user lookup:', dbError);
      res.status(500).json({ message: 'Datenbankfehler bei der Benutzersuche' });
    }
  } catch (error) {
    console.error('Token validation error:', error);
    console.error('Error stack:', error.stack);
    res.status(401).json({ message: 'Token ungültig' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.json({ message: 'Erfolgreich ausgeloggt' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
