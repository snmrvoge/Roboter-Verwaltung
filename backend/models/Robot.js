const mongoose = require('mongoose');

const robotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['available', 'reserved', 'maintenance'],
        default: 'available',
    },
    homebase: {
        type: String,
        required: true,
    },
    specifications: {
        type: Map,
        of: String
    },
    reservations: [{
        startDate: Date,
        endDate: Date,
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Methode zum Aktualisieren des Status basierend auf aktuellen Reservierungen
robotSchema.methods.updateStatusBasedOnReservations = async function() {
  const now = new Date();
  
  // Finde aktuelle Reservierung
  const currentReservation = await mongoose.model('Reservation').findOne({
    robotId: this._id,
    startDate: { $lte: now },
    endDate: { $gt: now }
  });

  // Wenn der Roboter in Wartung ist, nichts ändern
  if (this.status === 'maintenance') {
    return;
  }

  // Aktualisiere Status basierend auf Reservierung
  if (currentReservation) {
    this.status = 'reserved';
  } else {
    this.status = 'available';
  }

  await this.save();
};

// Middleware zum Aktualisieren des Status vor dem Senden
robotSchema.pre('find', async function() {
  // Verwende this.model.find().exec() statt this.model.find()
  const robots = await this.model.find(this.getQuery()).exec();
  for (const robot of robots) {
    if (robot.status !== 'maintenance') {  // Nur aktualisieren wenn nicht in Wartung
      const now = new Date();
      const currentReservation = await mongoose.model('Reservation').findOne({
        robotId: robot._id,
        startDate: { $lte: now },
        endDate: { $gt: now }
      });
      robot.status = currentReservation ? 'reserved' : 'available';
      await robot.save();
    }
  }
});

robotSchema.pre('findOne', async function() {
  // Verwende this.model.findOne().exec() statt this.model.findOne()
  const robot = await this.model.findOne(this.getQuery()).exec();
  if (robot && robot.status !== 'maintenance') {  // Nur aktualisieren wenn nicht in Wartung
    const now = new Date();
    const currentReservation = await mongoose.model('Reservation').findOne({
      robotId: robot._id,
      startDate: { $lte: now },
      endDate: { $gt: now }
    });
    robot.status = currentReservation ? 'reserved' : 'available';
    await robot.save();
  }
});

const Robot = mongoose.model('Robot', robotSchema);

module.exports = Robot;
