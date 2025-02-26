const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roboter-verwaltung');
        
        const adminPassword = 'admin123'; // Default password
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        
        const admin = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'admin'
        });
        
        await admin.save();
        console.log('Admin-Benutzer erfolgreich erstellt!');
        console.log('Benutzername: admin');
        console.log('Passwort: admin123');
    } catch (error) {
        console.error('Fehler beim Erstellen des Admin-Benutzers:', error);
    } finally {
        await mongoose.connection.close();
    }
};

createAdminUser();
