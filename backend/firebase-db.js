const firebase = require('firebase-admin');
const firebaseConfig = require('./config/firebase');

// Initialize Firebase Admin SDK
const serviceAccount = {
  "type": "service_account",
  "project_id": firebaseConfig.projectId,
  // In a real environment, you would use a proper service account key
  // This is a placeholder structure
  "private_key_id": "dummy_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nDUMMY_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
  "client_email": `firebase-adminsdk-xxxxx@${firebaseConfig.projectId}.iam.gserviceaccount.com`,
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40${firebaseConfig.projectId}.iam.gserviceaccount.com`
};

// In production, you would use a real service account key file
// firebase.initializeApp({
//   credential: firebase.credential.cert(serviceAccount),
//   databaseURL: firebaseConfig.databaseURL
// });

// For development, we'll use the application default credentials
firebase.initializeApp({
  databaseURL: firebaseConfig.databaseURL
});

const db = firebase.database();

// Models using Firebase Realtime Database
const robotModel = {
  getAll: async () => {
    const snapshot = await db.ref('robots').once('value');
    return snapshot.val() || {};
  },
  
  getById: async (id) => {
    const snapshot = await db.ref(`robots/${id}`).once('value');
    return snapshot.val();
  },
  
  create: async (robot) => {
    const newRobotRef = db.ref('robots').push();
    await newRobotRef.set(robot);
    return { id: newRobotRef.key, ...robot };
  },
  
  update: async (id, robot) => {
    await db.ref(`robots/${id}`).update(robot);
    return { id, ...robot };
  },
  
  delete: async (id) => {
    await db.ref(`robots/${id}`).remove();
    return { id };
  }
};

const reservationModel = {
  getAll: async () => {
    const snapshot = await db.ref('reservations').once('value');
    return snapshot.val() || {};
  },
  
  getById: async (id) => {
    const snapshot = await db.ref(`reservations/${id}`).once('value');
    return snapshot.val();
  },
  
  create: async (reservation) => {
    const newReservationRef = db.ref('reservations').push();
    await newReservationRef.set(reservation);
    return { id: newReservationRef.key, ...reservation };
  },
  
  update: async (id, reservation) => {
    await db.ref(`reservations/${id}`).update(reservation);
    return { id, ...reservation };
  },
  
  delete: async (id) => {
    await db.ref(`reservations/${id}`).remove();
    return { id };
  }
};

const userModel = {
  getAll: async () => {
    const snapshot = await db.ref('users').once('value');
    return snapshot.val() || {};
  },
  
  getById: async (id) => {
    const snapshot = await db.ref(`users/${id}`).once('value');
    return snapshot.val();
  },
  
  getByEmail: async (email) => {
    const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
    const users = snapshot.val();
    return users ? Object.values(users)[0] : null;
  },
  
  create: async (user) => {
    const newUserRef = db.ref('users').push();
    await newUserRef.set(user);
    return { id: newUserRef.key, ...user };
  },
  
  update: async (id, user) => {
    await db.ref(`users/${id}`).update(user);
    return { id, ...user };
  },
  
  delete: async (id) => {
    await db.ref(`users/${id}`).remove();
    return { id };
  }
};

module.exports = {
  db,
  robotModel,
  reservationModel,
  userModel
};
