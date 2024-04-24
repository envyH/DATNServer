require('dotenv').config();
const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getMessaging, getToken } = require('firebase/messaging');
const { google } = require('googleapis');
const { getStorage, getDownloadURL } = require('firebase-admin/storage');


const PROJECT_ID = process.env.project_id;
const PRIVATE_KEY_ID = process.env.private_key_id;
const API_KEY_GOOGLE = process.env.API_KEY_GOOGLE;
const AUTH_DOMAIN = process.env.AUTH_DOMAIN;
const STORAGEBUCKET = process.env.STORAGE_BUCKET;
const messagingSenderID = process.env.messaging_sender_id;
const appID = process.env.app_id;
const measurementID = process.env.measurement_id;
const PRIVATE_KEY = process.env.private_key;
const CLIENT_EMAIL = process.env.client_email;
const CLIENT_ID = process.env.client_id;
const CLIENT_x509_CERT_URL = process.env.client_x509_cert_url;

const key = Buffer.from(PRIVATE_KEY, 'base64').toString('ascii');

const firebaseConfig = {
    apiKey: API_KEY_GOOGLE,
    authDomain: AUTH_DOMAIN,
    projectId: PROJECT_ID,
    storageBucket: STORAGEBUCKET,
    messagingSenderId: messagingSenderID,
    appId: appID,
    measurementId: measurementID
};


const app = initializeApp(firebaseConfig);

const serviceAccountKey = {
    "type": "service_account",
    "project_id": PROJECT_ID,
    "private_key_id": PRIVATE_KEY_ID,
    "private_key": key,
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

function getAccessToken() {
    return new Promise(function (resolve, reject) {
        const key = serviceAccountKey;
        const jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key,
            ['https://www.googleapis.com/auth/documents'],
            null
        );
        jwtClient.authorize(function (err, tokens) {
            if (err) {
                reject(err);
                return;
            }
            console.log(tokens);
            console.log("token", tokens.access_token);
            resolve(tokens.access_token);
        });
    });
}

module.exports = {
    admin,
}
