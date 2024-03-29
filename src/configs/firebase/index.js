require('dotenv').config();
const admin = require('firebase-admin');
const { getStorage, getDownloadURL } = require('firebase-admin/storage');


const PROJECT_ID = process.env.project_id;
const PRIVATE_KEY_ID = process.env.private_key_id;
const PRIVATE_KEY = process.env.private_key;
const CLIENT_EMAIL = process.env.client_email;
const CLIENT_ID = process.env.client_id;
const CLIENT_x509_CERT_URL = process.env.client_x509_cert_url;


const serviceAccountKey = {
    "type": "service_account",
    "project_id": PROJECT_ID,
    "private_key_id": PRIVATE_KEY_ID,
    "private_key": PRIVATE_KEY,
    "client_email": CLIENT_EMAIL,
    "client_id": CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": CLIENT_x509_CERT_URL,
    "universe_domain": "googleapis.com"
}

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountKey),
    });
}

module.exports = {
    admin
}
