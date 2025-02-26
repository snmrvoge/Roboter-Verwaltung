const mongoose = require('mongoose');

const contactPersonSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  }
}, { _id: false });

const reservationSchema = new mongoose.Schema({
  robotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Robot',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  eventName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: contactPersonSchema,
    default: () => ({})
  }
}, {
  timestamps: true
});

// Vor dem Speichern: Validiere Datum
reservationSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('Das Enddatum muss nach dem Startdatum liegen'));
    return;
  }
  next();
});

// Index für Überlappungsprüfung
reservationSchema.index({ robotId: 1, startDate: 1, endDate: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
