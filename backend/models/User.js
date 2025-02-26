const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: false
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, { 
  timestamps: true 
});

// Passwort hashen vor dem Speichern
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Finde Benutzer anhand der Anmeldedaten
userSchema.statics.findByCredentials = async function(username, password) {
  const User = this;
  console.log('Suche Benutzer:', username);
  const user = await User.findOne({ username });

  if (!user) {
    console.log('Benutzer nicht gefunden');
    throw new Error('Ungültige Anmeldedaten');
  }

  console.log('Benutzer gefunden, vergleiche Passwörter');
  console.log('Eingegebenes Passwort:', password);
  console.log('Gespeichertes Hash:', user.password);

  // Erstelle neuen Hash mit dem eingegebenen Passwort
  const newHash = await bcrypt.hash(password, 8);
  console.log('Neuer Hash für Vergleich:', newHash);

  const isMatch = await bcrypt.compare(password, user.password);
  console.log('Passwort-Vergleich Ergebnis:', isMatch);

  if (!isMatch) {
    throw new Error('Ungültige Anmeldedaten');
  }

  return user;
};

// Generiere Auth-Token
userSchema.methods.generateAuthToken = async function() {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() }, 
    process.env.JWT_SECRET || 'your-secret-key'
  );

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

// Entferne sensitive Daten bei der JSON-Konvertierung
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
