// firebase-admin
const admin = require('firebase-admin');
const serviceAccount = require('./config.json');
if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

module.exports = {
    admin
}